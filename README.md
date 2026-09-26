# 🏠 RoomHisaab

**RoomHisaab** is a complete, production-ready shared expense management application for bachelors and roommates living together.

---

## 🚀 How to Run (Direct 1-Click)

### Option 1: Double-click `start.bat`
Just double-click **`start.bat`** on Windows. It will start the server and automatically open the application in your browser at `http://localhost:5000`.

### Option 2: Terminal / Command Prompt
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser or phone.

---

## 📁 Everything in One Single Folder:
```
room-hisaab/
├── index.js          # Main Express server & API entrypoint
├── routes.js         # API routes (Rooms, Expenses, Hisaab, Settlements)
├── db.js             # Built-in SQLite database (node:sqlite)
├── hisaabEngine.js   # Calculation engine & transaction minimizer
├── test-suite.js     # Automated verification suite
├── start.bat         # 1-click Windows launcher
├── package.json      # Dependencies and scripts
├── public/           # Pre-built full-stack web app UI & assets
├── src/              # React frontend source code
├── vite.config.js    # Build & bundler config
└── README.md         # Documentation
```

---

## ✨ Key Features

1. **Equal Split Rule **:
   - Every expense is divided equally among all roommates.
   - Exact integer paise calculation guarantees 0% rounding loss.

2. **Hisaab & Settlements **:
   - Choose any date range (*Today, This Week, This Month, Last Month, Custom Range*).
   - Generates exact settlements with minimized transactions.

3. **UPI Payment & QR Codes **:
   - 1-click UPI deep links to pay directly via GPay / PhonePe / Paytm / BHIM.
   - QR code popup for receiver's QR code.
   - 100% safe: never asks for PIN, OTP, or passwords.

4. **WhatsApp Hisaab Summary**:
   - 1-click share ready-made formatted summary to roommate WhatsApp group.

5. **Month Closing & Freeze**:
   - Finalize month to lock historical expenses against accidental edits or deletion.

6. **Pre-Loaded Demo Room**:
   - Comes pre-configured with **Room No. 204** (Sagar, Rahul, Amit, Rohit) for instant testing.
