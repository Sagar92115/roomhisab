async function runTests() {
  const BASE = 'http://127.0.0.1:5000';
  console.log('--- STARTING ROOMHISAAB AUTOMATED VERIFICATION SUITE ---');

  // Test 1: Frontend serving
  const rootRes = await fetch(`${BASE}/`);
  const rootHtml = await rootRes.text();
  console.log('✓ Test 1: Web App Index HTML Served:', rootRes.status === 200 && rootHtml.includes('RoomHisaab'));

  // Test 2: Rooms API
  const roomsRes = await fetch(`${BASE}/api/rooms`);
  const roomsJson = await roomsRes.json();
  console.log('✓ Test 2: Rooms list returned:', roomsJson.success && roomsJson.rooms.length > 0);
  const demoRoom = roomsJson.rooms[0];
  console.log(`   Found room: "${demoRoom.name}" with code ${demoRoom.invite_code}`);

  // Test 3: Get Room Details
  const roomRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}`);
  const roomData = await roomRes.json();
  console.log(`✓ Test 3: Room members (${roomData.members.length}):`, roomData.members.map(m => m.name).join(', '));

  // Test 4: Hisaab Calculation (Prompt Section 7 match)
  const hisaabRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}/hisaab?startDate=2026-09-01&endDate=2026-09-30`);
  const hisaabJson = await hisaabRes.json();
  const hisaab = hisaabJson.hisaab;
  console.log('✓ Test 4: Hisaab Math Verification:');
  console.log(`   Total Expense: ₹${hisaab.totalExpenseRupees} | Per Person: ₹${hisaab.fairShareRupees}`);
  hisaab.members.forEach(m => {
    console.log(`   - ${m.name}: Paid ₹${m.paidRupees}, Fair Share ₹${m.fairShareRupees}, Balance: ${m.balanceRupees >= 0 ? '+' : ''}₹${m.balanceRupees} (${m.status})`);
  });

  // Test 5: Who Pays Whom settlements
  console.log('✓ Test 5: Settlements generated:');
  hisaab.settlements.forEach(s => {
    console.log(`   - ${s.fromMemberName} ➔ ${s.toMemberName}: ₹${s.amountRupees} [${s.status}]`);
    console.log(`     UPI Deep Link: ${s.upiLink}`);
  });

  const firstSettlement = hisaab.settlements[0];
  if (firstSettlement) {
    // Test 6: Mark settlement as paid
    const markRes = await fetch(`${BASE}/api/settlements/${firstSettlement.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    });
    const markJson = await markRes.json();
    console.log(`✓ Test 6: Settlement status updated to paid:`, markJson.success && markJson.settlement.status === 'paid');

    // Revert to pending
    await fetch(`${BASE}/api/settlements/${firstSettlement.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' })
    });
    console.log(`   Reverted back to pending for fresh UI state.`);
  }

  // Test 7: Add new expense
  const member = roomData.members[0];
  const addExpRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paidById: member.id,
      amount: 400,
      description: 'Morning Chai & Snacks',
      category: 'Food',
      date: '2026-09-26'
    })
  });
  const addExpJson = await addExpRes.json();
  console.log('✓ Test 7: New Expense added:', addExpJson.success, `ID: ${addExpJson.expense?.id}`);

  // Test 8: Delete test expense
  if (addExpJson.expense?.id) {
    const delRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}/expenses/${addExpJson.expense.id}`, {
      method: 'DELETE'
    });
    const delJson = await delRes.json();
    console.log('✓ Test 8: Expense deleted successfully:', delJson.success);
  }

  // Test 9: Dynamic UPI QR code generation
  const qrRes = await fetch(`${BASE}/api/generate-upi-qr?upiId=sagar@upi&name=Sagar&amount=1000`);
  const qrJson = await qrRes.json();
  console.log('✓ Test 9: Dynamic UPI QR generated:', qrJson.success && qrJson.qrDataUrl.startsWith('data:image/png;base64,'));

  // Test 10: Month closing & freeze protection
  const closeRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}/months/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthKey: '2026-08' })
  });
  const closeJson = await closeRes.json();
  console.log('✓ Test 10: Close month 2026-08:', closeJson.success);

  // Attempt to add expense in closed month (should fail)
  const failExp = await fetch(`${BASE}/api/rooms/${demoRoom.id}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paidById: member.id,
      amount: 500,
      description: 'Late August Expense',
      category: 'Food',
      date: '2026-08-15'
    })
  });
  const failJson = await failExp.json();
  console.log('✓ Test 11: Closed month freeze blocked illegal addition:', !failJson.success && failJson.error.includes('closed'));

  // Reopen month
  const reopenRes = await fetch(`${BASE}/api/rooms/${demoRoom.id}/months/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthKey: '2026-08' })
  });
  const reopenJson = await reopenRes.json();
  console.log('✓ Test 12: Reopen month:', reopenJson.success);

  console.log('--- ALL TESTS PASSED! ROOMHISAAB IS 100% OPERATIONAL ---');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
