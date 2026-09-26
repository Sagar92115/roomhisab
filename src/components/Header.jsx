import React, { useState } from 'react';
import { Plus, Users, Copy, Check, ChevronDown, Home, Sparkles } from 'lucide-react';

export default function Header({
  room,
  members,
  currentMember,
  setCurrentMember,
  onOpenAddExpense,
  onOpenRoomModal
}) {
  const [copied, setCopied] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const copyInvite = () => {
    if (!room?.invite_code) return;
    const shareUrl = `${window.location.origin}/?join=${room.invite_code}`;
    const shareText = `Join our room "${room.name}" on RoomHisaab: ${shareUrl}\nInvite Code: ${room.invite_code}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Room Info & Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenRoomModal}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-left group"
            title="Switch or Create Room"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-brand-500/20 group-hover:scale-105 transition">
              🏠
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-slate-900 truncate">
                  {room?.name || 'RoomHisaab'}
                </h1>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>{members.length} roommates</span>
                <span>•</span>
                <span className="font-mono text-brand-700 font-medium">{room?.invite_code}</span>
              </p>
            </div>
          </button>

          {/* Copy Invite Code pill */}
          <button
            onClick={copyInvite}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Copy invite code to share with roommates"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Invite</span>
              </>
            )}
          </button>
        </div>

        {/* Right side controls: Active Roommate Switcher + Add Expense button */}
        <div className="flex items-center gap-2">
          {/* Roommate Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition text-xs font-medium text-slate-800"
              title="Change active roommate perspective"
            >
              <span className="text-sm">{currentMember?.profile_image || '👤'}</span>
              <span className="hidden xs:inline text-slate-500">Viewing as:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[80px] sm:max-w-[100px]">
                {currentMember?.name || 'Select'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Roommate Perspective
                  </div>
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentMember(m);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm transition ${
                        currentMember?.id === m.id
                          ? 'bg-brand-50 text-brand-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{m.profile_image || '👤'}</span>
                        <span className="truncate">{m.name}</span>
                        {m.is_admin ? (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-normal">Admin</span>
                        ) : null}
                      </div>
                      {currentMember?.id === m.id && (
                        <Check className="w-4 h-4 text-brand-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Add Expense Button */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-brand-600/30 hover:shadow-brand-600/40 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
