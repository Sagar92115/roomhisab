import { db, generateId } from './db.js';

/**
 * Calculates equal-split Hisaab and generates optimal settlement transactions.
 * All computations use integer paise to avoid any rounding or floating-point discrepancy.
 */
export function calculateHisaab(roomId, startDate, endDate) {
  // 1. Get room details
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // 2. Get all members
  const members = db.prepare('SELECT * FROM members WHERE room_id = ? ORDER BY created_at ASC').all(roomId);
  if (members.length === 0) {
    return {
      totalExpensePaise: 0,
      totalExpenseRupees: 0,
      memberCount: 0,
      fairSharePaise: 0,
      fairShareRupees: 0,
      members: [],
      settlements: [],
      isMonthClosed: false
    };
  }

  const memberCount = members.length;
  const memberMap = new Map();
  members.forEach(m => {
    memberMap.set(m.id, {
      ...m,
      paidPaise: 0,
      fairSharePaise: 0,
      balancePaise: 0
    });
  });

  // 3. Query expenses within date range
  let query = 'SELECT * FROM expenses WHERE room_id = ?';
  const params = [roomId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  query += ' ORDER BY date DESC, created_at DESC';

  const expenses = db.prepare(query).all(...params);

  // 4. Sum total and per-member paid amounts
  let totalExpensePaise = 0;
  for (const exp of expenses) {
    totalExpensePaise += exp.amount_paise;
    const m = memberMap.get(exp.paid_by_id);
    if (m) {
      m.paidPaise += exp.amount_paise;
    }
  }

  // 5. Equal division calculation
  const baseFairShare = Math.floor(totalExpensePaise / memberCount);
  const remainderPaise = totalExpensePaise % memberCount;

  // Assign fair shares ensuring sum(fairSharePaise) === totalExpensePaise
  const memberList = Array.from(memberMap.values());
  memberList.forEach((m, idx) => {
    m.fairSharePaise = baseFairShare + (idx < remainderPaise ? 1 : 0);
    m.balancePaise = m.paidPaise - m.fairSharePaise;
  });

  // Check if current date range touches any closed month
  const closedMonthRows = db.prepare(`
    SELECT * FROM closed_months WHERE room_id = ?
  `).all(roomId);

  let isMonthClosed = false;
  if (startDate && endDate) {
    const startMonth = startDate.slice(0, 7);
    const endMonth = endDate.slice(0, 7);
    isMonthClosed = closedMonthRows.some(cm => cm.month_key >= startMonth && cm.month_key <= endMonth);
  }

  // 6. Optimal Settlement Algorithm (Greedy matching)
  // Creditors: balance > 0 (will receive money)
  // Debtors: balance < 0 (must pay money)
  const creditors = memberList
    .filter(m => m.balancePaise > 0)
    .map(m => ({ memberId: m.id, name: m.name, upi_id: m.upi_id, remaining: m.balancePaise }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = memberList
    .filter(m => m.balancePaise < 0)
    .map(m => ({ memberId: m.id, name: m.name, upi_id: m.upi_id, remaining: -m.balancePaise }))
    .sort((a, b) => b.remaining - a.remaining);

  const rawSettlements = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.remaining, debtor.remaining);
    if (settleAmount > 0) {
      rawSettlements.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountPaise: settleAmount
      });
      creditor.remaining -= settleAmount;
      debtor.remaining -= settleAmount;
    }

    if (creditor.remaining === 0) cIdx++;
    if (debtor.remaining === 0) dIdx++;
  }

  // 7. Reconcile with persisted settlement statuses in DB
  const settlements = rawSettlements.map(item => {
    const fromMember = memberMap.get(item.fromMemberId);
    const toMember = memberMap.get(item.toMemberId);

    // Look for existing settlement in DB
    const existing = db.prepare(`
      SELECT * FROM settlements 
      WHERE room_id = ? 
        AND from_member_id = ? 
        AND to_member_id = ? 
        AND amount_paise = ?
        AND (date_range_start = ? OR date_range_start IS NULL)
        AND (date_range_end = ? OR date_range_end IS NULL)
    `).get(roomId, item.fromMemberId, item.toMemberId, item.amountPaise, startDate || null, endDate || null);

    let settlementId = existing ? existing.id : null;
    let status = existing ? existing.status : 'pending';
    let paidAt = existing ? existing.paid_at : null;

    if (!existing) {
      // Auto-insert pending settlement record for tracking
      settlementId = generateId();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO settlements (id, room_id, from_member_id, to_member_id, amount_paise, status, date_range_start, date_range_end, created_at, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        settlementId,
        roomId,
        item.fromMemberId,
        item.toMemberId,
        item.amountPaise,
        'pending',
        startDate || null,
        endDate || null,
        now,
        null
      );
    }

    const amountRupees = item.amountPaise / 100;
    const upiLink = `upi://pay?pa=${encodeURIComponent(toMember.upi_id)}&pn=${encodeURIComponent(toMember.name)}&am=${amountRupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent('RoomHisaab - ' + room.name)}`;

    return {
      id: settlementId,
      fromMemberId: fromMember.id,
      fromMemberName: fromMember.name,
      fromMemberAvatar: fromMember.profile_image,
      toMemberId: toMember.id,
      toMemberName: toMember.name,
      toMemberUpiId: toMember.upi_id,
      toMemberQrImage: toMember.qr_image,
      toMemberAvatar: toMember.profile_image,
      amountPaise: item.amountPaise,
      amountRupees: amountRupees,
      status: status,
      paidAt: paidAt,
      upiLink: upiLink
    };
  });

  return {
    roomId: room.id,
    roomName: room.name,
    startDate: startDate || null,
    endDate: endDate || null,
    totalExpensePaise,
    totalExpenseRupees: totalExpensePaise / 100,
    memberCount,
    fairSharePaise: baseFairShare,
    fairShareRupees: baseFairShare / 100,
    isMonthClosed,
    members: memberList.map(m => ({
      id: m.id,
      name: m.name,
      upi_id: m.upi_id,
      qr_image: m.qr_image,
      profile_image: m.profile_image,
      is_admin: m.is_admin,
      paidPaise: m.paidPaise,
      paidRupees: m.paidPaise / 100,
      fairSharePaise: m.fairSharePaise,
      fairShareRupees: m.fairSharePaise / 100,
      balancePaise: m.balancePaise,
      balanceRupees: m.balancePaise / 100,
      status: m.balancePaise > 0 ? 'receives' : m.balancePaise < 0 ? 'pays' : 'settled'
    })),
    settlements
  };
}
