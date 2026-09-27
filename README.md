<div align="center">

# 🏠 RoomHisaab (रूम हिसाब)
### *Smart, Simple & Stress-Free Shared Expense Manager for Roommates*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_RoomHisaab-059669?style=for-the-badge)](https://7f2ba9065061a1.lhr.life)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Sagar92115%2Froomhisab-181717?style=for-the-badge&logo=github)](https://github.com/Sagar92115/roomhisab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Built--in_WAL-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)

<p align="center">
  <b>🌐 Live App URL:</b> <a href="https://7f2ba9065061a1.lhr.life">https://7f2ba9065061a1.lhr.life</a>
</p>

</div>

---

## 📖 About The Project (परिचय)

Living with roommates or in a bachelor flat usually involves buying milk, groceries, paying electricity bills, Wi-Fi, and LPG cylinders. Maintaining these daily expenses in a physical notebook or messy WhatsApp chats leads to confusion, forgotten payments, and awkward arguments at the end of the month.

**RoomHisaab** solves this completely. 

It digitally records daily expenses, divides every bill equally among all roommates, calculates the exact **Hisaab** for any chosen date range, and automatically figures out **who needs to pay whom and how much** — complete with **1-click UPI payments** (Google Pay, PhonePe, Paytm) and **receiver QR code popups**.

> **The 2 Core Questions RoomHisaab Answers Instantly:**
> 1. *"Is date range ka mera kitna hisaab hai aur mujhe kisko kitna paisa dena hai?"*
> 2. *"Jisko paise dene hain, usko easily 1-click me payment kaise karu?"*

---

## ✨ Key Features (मुख्य विशेषताएं)

### ⚖️ 1. Strict Equal-Split Rule (बराबर हिस्सा)
- Every single expense entered into the app is automatically divided **EQUALLY** among all roommates.
- Calculated in exact **integer paise** (`amount * 100`) to guarantee **zero floating-point errors** or rounding discrepancies.

### 🧮 2. Hisaab & Optimal Settlement Engine
- Select any custom date range or use 1-click presets: **Today**, **This Week**, **This Month**, **Last Month**, or **All Time**.
- Generates a minimized transaction plan using a **two-pointer greedy matching algorithm** — resolving all debts and credits with the minimum number of payments.

### 📱 3. 1-Click UPI & Receiver QR Code Payments
- **Direct UPI Deep Link**: Clicking `[Pay ₹X]` immediately launches installed UPI apps (**Google Pay, PhonePe, Paytm, BHIM, Cred**) on mobile with receiver UPI ID and amount pre-filled.
- **Scan & Pay QR Popup**: Opens an interactive modal displaying the receiver's uploaded QR code or dynamically generated UPI QR code.
- **Payment Status Tracking**: Toggle settlement status between 🟠 **Pending** and 🟢 **Paid** with celebration confetti!

### 💬 4. WhatsApp 1-Click Hisaab Sharing
- Formats a beautiful, clean WhatsApp summary text with emojis and roommate breakdowns.
- 1-click share via native mobile share sheet or copy directly to clipboard.

### 🔒 5. Month Closing & Freeze
- Once a month ends, group admins can **Close the Month** to freeze historical records, preventing accidental edits or deletions. Can be reopened anytime from Settings.

### 🚪 6. Privacy & Room Isolation
- When a new visitor opens the site, **no old or private hisaab is shown**.
- Visitors are greeted with a clean **Welcome Screen** allowing them to:
  - **Create their own room** (Room name + Roommates + UPI IDs)
  - **Join with an 8-character invite code** (e.g. `RH-BEST-699F8F`)
  - **Or test the pre-loaded "Room No. 204" demo**

### 🛡️ 7. Zero-Credential Security
- RoomHisaab operates strictly on public UPI identifiers and deep links.
- **The app never asks for or stores UPI PINs, passwords, OTPs, or bank account credentials.**

### 🎨 8. Mobile-First Responsive UI & PWA
- Clean mobile bottom navigation bar (**Home**, **Expenses**, **Hisaab**, **Members**, **Settings**) and desktop sidebar.
- Modern rounded fintech cards with Emerald Green (receivables) and Rose Red (payables).
- Installable on Android/iOS home screen as a Progressive Web App (PWA).

---

## 📊 Example Calculation (हिसाब का उदाहरण)

Suppose **4 roommates** live together: **Sagar, Rahul, Amit, and Rohit**.

- **Total Expenses for September:** ₹12,000
- **Fair Share per Person:** ₹3,000 each

| Roommate | Actual Paid | Fair Share | Net Balance | Status | Action Generated |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Sagar** | ₹5,000 | ₹3,000 | **+₹2,000** | 🟢 Creditor | Receives ₹2,000 |
| **Amit** | ₹3,000 | ₹3,000 | **₹0** | ⚪ Settled | All settled up |
| **Rahul** | ₹2,000 | ₹3,000 | **-₹1,000** | 🔴 Debtor | **Rahul ➔ Sagar: ₹1,000** |
| **Rohit** | ₹2,000 | ₹3,000 | **-₹1,000** | 🔴 Debtor | **Rohit ➔ Sagar: ₹1,000** |

**Total Debtors Paid (₹2,000) = Total Creditors Received (₹2,000). Exactly zero money created or lost.**

---

## 📁 Project Structure (फ़ोल्डर संरचना)

```text
roomhisab/
│
├── start.bat               # 1-Click Windows Local Launcher
├── start-live.bat          # 1-Click Public Live Internet Tunnel Launcher
│
├── index.js                # Main Express server & API entrypoint
├── routes.js               # REST API Routes (Rooms, Expenses, Hisaab, Settlements)
├── db.js                   # Node.js built-in SQLite (node:sqlite) with WAL mode
├── hisaabEngine.js         # Exact Hisaab calculations & transaction minimizer
├── test-suite.js           # Automated verification test suite (12 tests)
├── package.json            # Unified dependencies and build scripts
│
├── dist/                   # Production-ready compiled web application
│   ├── index.html          # Web entrypoint
│   ├── assets/             # Bundled JavaScript & Tailwind CSS
│   ├── favicon.svg         # App Icon
│   └── manifest.json       # PWA Mobile Manifest
│
├── src/                    # Complete React 18 Source Code
│   ├── App.jsx             # Root component with room isolation & routing
│   ├── index.css           # Global Tailwind CSS styling
│   ├── components/         # Header, Navigation, Modals (Expense, QR, Confirm)
│   └── views/              # Dashboard, Expenses, Hisaab, Members, Analytics, Welcome
│
├── data/                   # SQLite database file (roomhisaab.db)
└── uploads/                # Member UPI QR code uploads
```

---

## 🚀 How to Run Locally (कंप्यूटर पर कैसे चलाएं)

### Option 1: 1-Click Windows Launcher (सबसे आसान)
Just double-click **`start.bat`**. It will automatically:
1. Initialize the SQLite database.
2. Launch the backend server on port `5000`.
3. Open your default browser at **`http://localhost:5000`**.

---

### Option 2: Using Terminal / Command Prompt
```bash
# 1. Clone the repository
git clone https://github.com/Sagar92115/roomhisab.git

# 2. Navigate to project directory
cd roomhisab

# 3. Install dependencies
npm install

# 4. Start the application
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

### Option 3: Share Instantly Over The Internet (Live Tunnel)
Double-click **`start-live.bat`** or run:
```powershell
ssh -R 80:localhost:5000 -o StrictHostKeyChecking=no nokey@localhost.run
```
It prints a live HTTPS link (e.g. `https://xxxx.lhr.life`) that can be opened on any smartphone in the world!

---

## 🌐 Deploy 24/7 on Cloud (Render.com)

Since the repository is ready on GitHub, you can host it 24/7 for free:

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Select **`Sagar92115/roomhisab`**.
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free ($0/month)**
5. Click **Deploy Web Service**. Render gives you a permanent HTTPS URL!

---

## 👨‍💻 Author & Credits

- **Developer**: Sagar Patel ([@Sagar92115](https://github.com/Sagar92115))
- **Repository**: [https://github.com/Sagar92115/roomhisab](https://github.com/Sagar92115/roomhisab)
- **Live Link**: [https://7f2ba9065061a1.lhr.life](https://7f2ba9065061a1.lhr.life)

<br/>

<div align="center">
  <b>⭐ If this helped your roommate hisaab, give it a star on GitHub! ⭐</b>
</div>
