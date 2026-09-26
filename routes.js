import express from 'express';
import multer from 'multer';
import path from 'node:path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';
import { db, generateId, generateInviteCode, seedDemoRoom } from './db.js';
import { calculateHisaab } from './hisaabEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer storage for QR code uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `qr-${Date.now()}-${generateId().slice(0, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Helper: Check if date falls in a closed month
function isDateInClosedMonth(roomId, dateStr) {
  if (!dateStr) return false;
  const monthKey = dateStr.slice(0, 7);
  const row = db.prepare('SELECT * FROM closed_months WHERE room_id = ? AND month_key = ?').get(roomId, monthKey);
  return Boolean(row);
}

// -----------------------------------------------------------------------------
// ROOMS
// -----------------------------------------------------------------------------

// List all rooms
router.get('/rooms', (req, res) => {
  try {
    const rooms = db.prepare('SELECT * FROM rooms ORDER BY created_at DESC').all();
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get room by ID
router.get('/rooms/:roomId', (req, res) => {
  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    const members = db.prepare('SELECT * FROM members WHERE room_id = ? ORDER BY created_at ASC').all(room.id);
    const expenseCount = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount_paise), 0) as totalPaise FROM expenses WHERE room_id = ?').get(room.id);
    const closedMonths = db.prepare('SELECT * FROM closed_months WHERE room_id = ? ORDER BY month_key DESC').all(room.id);

    res.json({
      success: true,
      room,
      members,
      stats: {
        memberCount: members.length,
        expenseCount: expenseCount.count,
        totalExpenseRupees: expenseCount.totalPaise / 100
      },
      closedMonths
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Room
router.post('/rooms', (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }
    if (!Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 members are required to create a room' });
    }

    const roomId = generateId();
    const inviteCode = generateInviteCode(name);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO rooms (id, name, invite_code, admin_member_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(roomId, name.trim(), inviteCode, null, now);

    const insertMember = db.prepare(`
      INSERT INTO members (id, room_id, name, upi_id, qr_image, profile_image, is_admin, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let adminId = null;
    const avatars = ['👨‍💼', '👨‍💻', '🧑‍🎨', '🧑‍🍳', '👩‍🔬', '👨‍🚀', '🧕', '🧔'];

    members.forEach((m, idx) => {
      const memId = generateId();
      if (idx === 0) adminId = memId;
      insertMember.run(
        memId,
        roomId,
        m.name.trim(),
        (m.upiId || '').trim(),
        m.qrImage || null,
        m.profileImage || avatars[idx % avatars.length],
        idx === 0 ? 1 : 0,
        now
      );
    });

    db.prepare('UPDATE rooms SET admin_member_id = ? WHERE id = ?').run(adminId, roomId);

    const createdRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    const createdMembers = db.prepare('SELECT * FROM members WHERE room_id = ?').all(roomId);

    res.status(201).json({
      success: true,
      room: createdRoom,
      members: createdMembers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Join room by invite code
router.post('/rooms/join', (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code is required' });
    }
    const room = db.prepare('SELECT * FROM rooms WHERE UPPER(invite_code) = UPPER(?)').get(inviteCode.trim());
    if (!room) {
      return res.status(404).json({ success: false, error: 'Invalid invite code or room does not exist' });
    }
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset demo data
router.post('/rooms/reset-demo', (req, res) => {
  try {
    const newRoomId = seedDemoRoom();
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(newRoomId);
    res.json({ success: true, roomId: newRoomId, room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// MEMBERS
// -----------------------------------------------------------------------------

// Add Member
router.post('/rooms/:roomId/members', (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, upiId, qrImage, profileImage } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Member name is required' });
    }

    const memberId = generateId();
    const now = new Date().toISOString();
    const avatars = ['👨‍💼', '👨‍💻', '🧑‍🎨', '🧑‍🍳', '👩‍🔬', '👨‍🚀', '🧕', '🧔'];

    db.prepare(`
      INSERT INTO members (id, room_id, name, upi_id, qr_image, profile_image, is_admin, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      memberId,
      roomId,
      name.trim(),
      (upiId || '').trim(),
      qrImage || null,
      profileImage || avatars[Math.floor(Math.random() * avatars.length)],
      0,
      now
    );

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    res.status(201).json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Member
router.put('/rooms/:roomId/members/:memberId', (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, upiId, qrImage, profileImage, isAdmin } = req.body;

    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    db.prepare(`
      UPDATE members
      SET name = COALESCE(?, name),
          upi_id = COALESCE(?, upi_id),
          qr_image = COALESCE(?, qr_image),
          profile_image = COALESCE(?, profile_image),
          is_admin = COALESCE(?, is_admin)
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : null,
      upiId !== undefined ? upiId.trim() : null,
      qrImage !== undefined ? qrImage : null,
      profileImage !== undefined ? profileImage : null,
      isAdmin !== undefined ? (isAdmin ? 1 : 0) : null,
      memberId
    );

    const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    res.json({ success: true, member: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove Member
router.delete('/rooms/:roomId/members/:memberId', (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    // Check member count
    const memberCount = db.prepare('SELECT count(*) as count FROM members WHERE room_id = ?').get(roomId).count;
    if (memberCount <= 2) {
      return res.status(400).json({ success: false, error: 'A room must have at least 2 members. Cannot remove.' });
    }

    // Check if member has recorded expenses
    const expCount = db.prepare('SELECT count(*) as count FROM expenses WHERE paid_by_id = ?').get(memberId).count;
    if (expCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot remove member because they have ${expCount} recorded expense(s). Please delete or reassign their expenses first.`
      });
    }

    db.prepare('DELETE FROM members WHERE id = ? AND room_id = ?').run(memberId, roomId);
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member Details & personal history
router.get('/rooms/:roomId/members/:memberId/details', (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const member = db.prepare('SELECT * FROM members WHERE id = ? AND room_id = ?').get(memberId, roomId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const expensesPaid = db.prepare(`
      SELECT * FROM expenses WHERE room_id = ? AND paid_by_id = ? ORDER BY date DESC, created_at DESC
    `).all(roomId, memberId);

    const totalPaidPaise = expensesPaid.reduce((acc, curr) => acc + curr.amount_paise, 0);

    const totalRoomExpensesPaise = db.prepare('SELECT COALESCE(SUM(amount_paise), 0) as total FROM expenses WHERE room_id = ?').get(roomId).total;
    const memberCount = db.prepare('SELECT count(*) as count FROM members WHERE room_id = ?').get(roomId).count;
    const fairSharePaise = memberCount > 0 ? Math.floor(totalRoomExpensesPaise / memberCount) : 0;
    const balancePaise = totalPaidPaise - fairSharePaise;

    // Settlement history
    const settlementsToPay = db.prepare(`
      SELECT s.*, m.name as receiver_name, m.upi_id as receiver_upi, m.profile_image as receiver_avatar
      FROM settlements s
      JOIN members m ON s.to_member_id = m.id
      WHERE s.room_id = ? AND s.from_member_id = ?
      ORDER BY s.created_at DESC
    `).all(roomId, memberId);

    const settlementsToReceive = db.prepare(`
      SELECT s.*, m.name as payer_name, m.upi_id as payer_upi, m.profile_image as payer_avatar
      FROM settlements s
      JOIN members m ON s.from_member_id = m.id
      WHERE s.room_id = ? AND s.to_member_id = ?
      ORDER BY s.created_at DESC
    `).all(roomId, memberId);

    res.json({
      success: true,
      member,
      summary: {
        totalPaidPaise,
        totalPaidRupees: totalPaidPaise / 100,
        fairSharePaise,
        fairShareRupees: fairSharePaise / 100,
        balancePaise,
        balanceRupees: balancePaise / 100,
        status: balancePaise > 0 ? 'receives' : balancePaise < 0 ? 'pays' : 'settled'
      },
      expenses: expensesPaid.map(e => ({
        ...e,
        amountRupees: e.amount_paise / 100,
        perPersonShareRupees: (Math.round(e.amount_paise / memberCount)) / 100
      })),
      settlementsToPay: settlementsToPay.map(s => ({ ...s, amountRupees: s.amount_paise / 100 })),
      settlementsToReceive: settlementsToReceive.map(s => ({ ...s, amountRupees: s.amount_paise / 100 }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// EXPENSES
// -----------------------------------------------------------------------------

// List expenses with search & filters
router.get('/rooms/:roomId/expenses', (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate, category, paidById, search } = req.query;

    let query = `
      SELECT e.*, m.name as paid_by_name, m.profile_image as paid_by_avatar
      FROM expenses e
      JOIN members m ON e.paid_by_id = m.id
      WHERE e.room_id = ?
    `;
    const params = [roomId];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    if (category && category !== 'All') {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (paidById && paidById !== 'All') {
      query += ' AND e.paid_by_id = ?';
      params.push(paidById);
    }
    if (search && search.trim()) {
      query += ' AND (e.description LIKE ? OR m.name LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = db.prepare(query).all(...params);
    const memberCount = db.prepare('SELECT count(*) as count FROM members WHERE room_id = ?').get(roomId).count;

    // Check closed months to flag expenses
    const closedMonths = db.prepare('SELECT month_key FROM closed_months WHERE room_id = ?').all(roomId).map(r => r.month_key);

    const formatted = expenses.map(e => {
      const monthKey = e.date.slice(0, 7);
      return {
        ...e,
        amountRupees: e.amount_paise / 100,
        perPersonShareRupees: memberCount > 0 ? (Math.round(e.amount_paise / memberCount)) / 100 : 0,
        isClosedMonth: closedMonths.includes(monthKey)
      };
    });

    res.json({ success: true, expenses: formatted, memberCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Expense
router.post('/rooms/:roomId/expenses', (req, res) => {
  try {
    const { roomId } = req.params;
    const { paidById, amount, description, category, date } = req.body;

    if (!paidById) {
      return res.status(400).json({ success: false, error: 'Paid By member is required' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number greater than 0' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Expense description is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, error: 'Expense date is required' });
    }

    // Check if month is closed
    if (isDateInClosedMonth(roomId, date)) {
      return res.status(400).json({
        success: false,
        error: `Cannot add expense for ${date}. The month ${date.slice(0, 7)} has been closed/finalized. Please reopen the month in Settings to make changes.`
      });
    }

    const expenseId = generateId();
    const amountPaise = Math.round(numAmount * 100);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO expenses (id, room_id, paid_by_id, amount_paise, description, category, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      roomId,
      paidById,
      amountPaise,
      description.trim(),
      category || 'Other',
      date,
      now,
      now
    );

    const expense = db.prepare(`
      SELECT e.*, m.name as paid_by_name, m.profile_image as paid_by_avatar
      FROM expenses e
      JOIN members m ON e.paid_by_id = m.id
      WHERE e.id = ?
    `).get(expenseId);

    const memberCount = db.prepare('SELECT count(*) as count FROM members WHERE room_id = ?').get(roomId).count;

    res.status(201).json({
      success: true,
      expense: {
        ...expense,
        amountRupees: expense.amount_paise / 100,
        perPersonShareRupees: memberCount > 0 ? (Math.round(expense.amount_paise / memberCount)) / 100 : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Expense
router.put('/rooms/:roomId/expenses/:expenseId', (req, res) => {
  try {
    const { roomId, expenseId } = req.params;
    const { paidById, amount, description, category, date } = req.body;

    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND room_id = ?').get(expenseId, roomId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    // Check if original date or new date belongs to closed month
    if (isDateInClosedMonth(roomId, existing.date)) {
      return res.status(400).json({
        success: false,
        error: `Cannot edit expense from closed month (${existing.date.slice(0, 7)}). Reopen month first.`
      });
    }
    if (date && isDateInClosedMonth(roomId, date)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change date to closed month (${date.slice(0, 7)}). Reopen month first.`
      });
    }

    const numAmount = amount !== undefined ? parseFloat(amount) : null;
    const amountPaise = numAmount !== null ? Math.round(numAmount * 100) : null;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE expenses
      SET paid_by_id = COALESCE(?, paid_by_id),
          amount_paise = COALESCE(?, amount_paise),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          date = COALESCE(?, date),
          updated_at = ?
      WHERE id = ? AND room_id = ?
    `).run(
      paidById || null,
      amountPaise,
      description !== undefined ? description.trim() : null,
      category || null,
      date || null,
      now,
      expenseId,
      roomId
    );

    const updated = db.prepare(`
      SELECT e.*, m.name as paid_by_name, m.profile_image as paid_by_avatar
      FROM expenses e
      JOIN members m ON e.paid_by_id = m.id
      WHERE e.id = ?
    `).get(expenseId);

    res.json({
      success: true,
      expense: {
        ...updated,
        amountRupees: updated.amount_paise / 100
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Expense
router.delete('/rooms/:roomId/expenses/:expenseId', (req, res) => {
  try {
    const { roomId, expenseId } = req.params;
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND room_id = ?').get(expenseId, roomId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (isDateInClosedMonth(roomId, existing.date)) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete expense from closed month (${existing.date.slice(0, 7)}). Reopen month first.`
      });
    }

    db.prepare('DELETE FROM expenses WHERE id = ? AND room_id = ?').run(expenseId, roomId);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// HISAAB / SETTLEMENTS
// -----------------------------------------------------------------------------

// Calculate Hisaab for date range
router.get('/rooms/:roomId/hisaab', (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({ success: false, error: 'End date cannot be before start date' });
    }

    const hisaab = calculateHisaab(roomId, startDate, endDate);
    res.json({ success: true, hisaab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update settlement status (pending <-> paid)
router.post('/settlements/:settlementId/status', (req, res) => {
  try {
    const { settlementId } = req.params;
    const { status } = req.body; // 'paid' or 'pending'

    const existing = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Settlement record not found' });
    }

    const newStatus = status === 'paid' ? 'paid' : 'pending';
    const paidAt = newStatus === 'paid' ? new Date().toISOString() : null;

    db.prepare('UPDATE settlements SET status = ?, paid_at = ? WHERE id = ?').run(newStatus, paidAt, settlementId);

    const updated = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId);
    res.json({ success: true, settlement: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// MONTH CLOSING
// -----------------------------------------------------------------------------

// Close month
router.post('/rooms/:roomId/months/close', (req, res) => {
  try {
    const { roomId } = req.params;
    const { monthKey, closedByMemberId, notes } = req.body; // e.g. "2026-09"

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return res.status(400).json({ success: false, error: 'Invalid monthKey format. Expected YYYY-MM' });
    }

    // Check if already closed
    const existing = db.prepare('SELECT * FROM closed_months WHERE room_id = ? AND month_key = ?').get(roomId, monthKey);
    if (existing) {
      return res.status(400).json({ success: false, error: `Month ${monthKey} is already closed` });
    }

    // Calculate total expenses for this month
    const startDate = `${monthKey}-01`;
    const endDate = `${monthKey}-31`;
    const totalExp = db.prepare(`
      SELECT COALESCE(SUM(amount_paise), 0) as total FROM expenses
      WHERE room_id = ? AND date >= ? AND date <= ?
    `).get(roomId, startDate, endDate).total;

    const id = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO closed_months (id, room_id, month_key, closed_at, closed_by_member_id, total_expense_paise, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, roomId, monthKey, now, closedByMemberId || null, totalExp, notes || null);

    res.json({
      success: true,
      message: `Month ${monthKey} closed successfully. All expenses for this period are now locked.`,
      closedMonth: { id, roomId, monthKey, closedAt: now, totalExpenseRupees: totalExp / 100 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reopen month
router.post('/rooms/:roomId/months/reopen', (req, res) => {
  try {
    const { roomId } = req.params;
    const { monthKey } = req.body;

    if (!monthKey) {
      return res.status(400).json({ success: false, error: 'monthKey is required' });
    }

    db.prepare('DELETE FROM closed_months WHERE room_id = ? AND month_key = ?').run(roomId, monthKey);
    res.json({ success: true, message: `Month ${monthKey} reopened. Expenses can now be modified.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// QR UPLOAD & GENERATION
// -----------------------------------------------------------------------------

// Upload member QR code
router.post('/upload-qr', upload.single('qrImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, qrImageUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate dynamic UPI QR Code as DataURL
router.get('/generate-upi-qr', async (req, res) => {
  try {
    const { upiId, name, amount } = req.query;
    if (!upiId) {
      return res.status(400).json({ success: false, error: 'upiId is required' });
    }
    const cleanAmount = amount ? parseFloat(amount).toFixed(2) : '';
    let upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'RoomHisaab')}&cu=INR`;
    if (cleanAmount && !isNaN(cleanAmount)) {
      upiPayload += `&am=${cleanAmount}`;
    }

    const qrDataUrl = await QRCode.toDataURL(upiPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({ success: true, upiPayload, qrDataUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
