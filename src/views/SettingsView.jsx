import React, { useState } from 'react';
import {
  Settings,
  Home,
  Users,
  Key,
  Copy,
  Check,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters.js';

export default function SettingsView({
  room,
  rooms = [],
  members = [],
  closedMonths = [],
  onSwitchRoom,
  onOpenCreateRoomModal,
  onResetDemo,
  onReopenMonth,
  onUpdateRoomName,
  onExitRoom
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(room?.name || '');
  const [updating, setUpdating] = useState(false);

  const copyInvite = () => {
    if (!room?.invite_code) return;
    navigator.clipboard.writeText(room.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveRoomName = async (e) => {
    e.preventDefault();
    if (!roomNameInput.trim()) return;
    setUpdating(true);
    try {
      await onUpdateRoomName(roomNameInput.trim());
      setEditingRoomName(false);
    } catch (err) {
      alert(err.message || 'Failed to update room name');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Room & App Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure group details, invite roommates, and manage closed months.
        </p>
      </div>

      {/* =====================================================================
          ROOM DETAILS & INVITE CARD
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Room Details</h3>
          </div>
          <button
            onClick={onOpenCreateRoomModal}
            className="text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            + New Room
          </button>
        </div>

        {/* Room Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 uppercase">
            Room / Group Name
          </label>
          {editingRoomName ? (
            <form onSubmit={handleSaveRoomName} className="flex gap-2">
              <input
                type="text"
                value={roomNameInput}
                onChange={e => setRoomNameInput(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingRoomName(false)}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-sm font-bold text-slate-900">{room?.name}</span>
              <button
                onClick={() => {
                  setRoomNameInput(room?.name || '');
                  setEditingRoomName(true);
                }}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Invite Code */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 uppercase">
            Room Invite Code
          </label>
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                {room?.invite_code || 'RH-204-DEMO'}
              </span>
            </div>
            <button
              onClick={copyInvite}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Share this code with your roommates so they can join this room instantly.
          </p>
        </div>

        {/* Room Switcher if multiple rooms exist */}
        {rooms.length > 1 && (
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase">
              Switch Active Room
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rooms.map(r => (
                <button
                  key={r.id}
                  onClick={() => onSwitchRoom(r.id)}
                  className={`p-3 text-left rounded-2xl border transition ${
                    r.id === room?.id
                      ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate">{r.name}</span>
                    {r.id === room?.id && <span className="text-[10px] text-brand-600 font-bold">Active</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Exit Room / Switch Room Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Switch / Exit Room</span>
            <span className="text-[11px] text-slate-500">Log out of this room to create or join a new room.</span>
          </div>
          <button
            onClick={onExitRoom}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Exit Room
          </button>
        </div>
      </div>

      {/* =====================================================================
          CLOSED MONTHS ARCHIVE (Section 15 of Prompt)
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Closed Months Archive</h3>
            <p className="text-xs text-slate-500">
              Closed months protect finalized past hisaab from accidental editing or deletion.
            </p>
          </div>
        </div>

        {closedMonths.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No closed months yet. You can close any finalized month from the Hisaab tab.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {closedMonths.map(cm => (
              <div
                key={cm.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Month {cm.month_key}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Closed on {formatDate(cm.closed_at.slice(0, 10))} • Final Total: {formatINR(cm.total_expense_paise / 100)}
                  </p>
                </div>

                <button
                  onClick={() => onReopenMonth(cm.month_key)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-semibold transition"
                  title="Reopen this month to permit editing"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          DEMO DATA SEEDING (Section 23 of Prompt)
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Demo & Testing Data</h3>
            <p className="text-xs text-slate-500">
              Instantly seed or reset the complete sample room as specified in requirements.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-emerald-950">Room No. 204 (Demo Room)</h4>
            <p className="text-[11px] text-emerald-800/80">
              Pre-populates Sagar, Rahul, Amit, Rohit with September 2026 expenses & settlements.
            </p>
          </div>

          <button
            onClick={onResetDemo}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load / Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECURITY & PRIVACY PRINCIPLES (Section 19 of Prompt)
         ===================================================================== */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Zero-Credential Security Architecture
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          RoomHisaab strictly operates on deep links and public UPI identifiers. The application never asks for, handles, or stores any sensitive banking credentials (no UPI PIN, no bank passwords, no OTPs, no card numbers or CVVs). Payments occur exclusively inside verified official UPI banking apps on the user's mobile device.
        </p>
      </div>
    </div>
  );
}
