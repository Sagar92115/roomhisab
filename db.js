import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'roomhisaab.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    admin_member_id TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    name TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    qr_image TEXT,
    profile_image TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    paid_by_id TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    from_member_id TEXT NOT NULL,
    to_member_id TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    date_range_start TEXT,
    date_range_end TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS closed_months (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    month_key TEXT NOT NULL,
    closed_at TEXT NOT NULL,
    closed_by_member_id TEXT,
    total_expense_paise INTEGER NOT NULL,
    notes TEXT,
    UNIQUE(room_id, month_key),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );
`);

export function generateId() {
  return crypto.randomUUID();
}

export function generateInviteCode(roomName) {
  const clean = (roomName || 'ROOM').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'ROOM';
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RH-${clean}-${rand}`;
}

// Check if any rooms exist; if not, seed demo "Room No. 204"
export function initDemoDataIfEmpty() {
  const countStmt = db.prepare('SELECT count(*) as count FROM rooms');
  const countRow = countStmt.get();
  if (!countRow || countRow.count === 0) {
    console.log('No rooms found. Seeding initial demo Room No. 204...');
    seedDemoRoom();
  }
}

export function seedDemoRoom() {
  const roomId = generateId();
  const now = new Date().toISOString();

  // Create room
  db.prepare(`
    INSERT INTO rooms (id, name, invite_code, admin_member_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(roomId, 'Room No. 204', 'RH-204-DEMO', null, now);

  // Members
  const sagarId = generateId();
  const rahulId = generateId();
  const amitId = generateId();
  const rohitId = generateId();

  const members = [
    { id: sagarId, name: 'Sagar', upi: 'sagar@upi', isAdmin: 1, avatar: '👨‍💼', color: '#10B981' },
    { id: rahulId, name: 'Rahul', upi: 'rahul@upi', isAdmin: 0, avatar: '👨‍💻', color: '#3B82F6' },
    { id: amitId, name: 'Amit', upi: 'amit@okhdfcbank', isAdmin: 0, avatar: '🧑‍🎨', color: '#8B5CF6' },
    { id: rohitId, name: 'Rohit', upi: 'rohit@paytm', isAdmin: 0, avatar: '🧑‍🍳', color: '#F59E0B' }
  ];

  const insertMember = db.prepare(`
    INSERT INTO members (id, room_id, name, upi_id, qr_image, profile_image, is_admin, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of members) {
    insertMember.run(m.id, roomId, m.name, m.upi, null, m.avatar, m.isAdmin, now);
  }

  // Update room admin to Sagar
  db.prepare('UPDATE rooms SET admin_member_id = ? WHERE id = ?').run(sagarId, roomId);

  // Sample expenses matching user specification:
  // Total = ₹12,000, 4 members = ₹3,000 each
  // Sagar: ₹1,200 + ₹3,800 = ₹5,000 (+₹2,000 balance)
  // Rahul: ₹200 + ₹1,800 = ₹2,000 (-₹1,000 balance)
  // Amit: ₹1,600 + ₹1,400 = ₹3,000 (₹0 balance)
  // Rohit: ₹800 + ₹1,200 = ₹2,000 (-₹1,000 balance)
  const expenses = [
    {
      paidById: sagarId,
      amountPaise: 120000,
      description: 'Monthly Grocery & Vegetables',
      category: 'Grocery',
      date: '2026-09-02'
    },
    {
      paidById: rahulId,
      amountPaise: 20000,
      description: 'Daily Milk Packets (Week 1)',
      category: 'Milk',
      date: '2026-09-04'
    },
    {
      paidById: rohitId,
      amountPaise: 80000,
      description: '20L Drinking Water Cans & Dispenser',
      category: 'Water',
      date: '2026-09-06'
    },
    {
      paidById: sagarId,
      amountPaise: 380000,
      description: 'LPG Gas Cylinder & Kitchen Stove Service',
      category: 'Gas',
      date: '2026-09-08'
    },
    {
      paidById: amitId,
      amountPaise: 160000,
      description: 'Electricity Bill (August/September)',
      category: 'Electricity',
      date: '2026-09-10'
    },
    {
      paidById: rahulId,
      amountPaise: 180000,
      description: 'Weekend Biryani & Food Delivery',
      category: 'Food',
      date: '2026-09-12'
    },
    {
      paidById: amitId,
      amountPaise: 140000,
      description: 'Fiber WiFi Internet Bill (300 Mbps)',
      category: 'Internet',
      date: '2026-09-15'
    },
    {
      paidById: rohitId,
      amountPaise: 120000,
      description: 'Cleaning Supplies, Mop & Toiletries',
      category: 'Other',
      date: '2026-09-18'
    }
  ];

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, room_id, paid_by_id, amount_paise, description, category, date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const exp of expenses) {
    insertExpense.run(
      generateId(),
      roomId,
      exp.paidById,
      exp.amountPaise,
      exp.description,
      exp.category,
      exp.date,
      now,
      now
    );
  }

  console.log(`Demo Room No. 204 created successfully with ID: ${roomId}`);
  return roomId;
}
