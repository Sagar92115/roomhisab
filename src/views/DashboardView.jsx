import React from 'react';
import {
  Wallet,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Plus,
  Calculator,
  Share2,
  ChevronRight,
  Receipt,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatINR, formatDate, getCategoryMeta } from '../utils/formatters.js';

export default function DashboardView({
  room,
  members,
  currentMember,
  expenses = [],
  hisaabSummary,
  onOpenAddExpense,
  onNavigateToHisaab,
  onNavigateToExpenses,
  onEditExpense,
  onDeleteExpense
}) {
  const memberCount = members.length || 1;

  // Calculate current month's expenses (e.g. 2026-09)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = expenses.filter(e => (e.date || '').startsWith(currentMonthKey));
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);

  // Overall total expenses
  const overallTotal = expenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);
  const perPersonShare = overallTotal / memberCount;

  // Current member's stats
  const memberPaid = expenses
    .filter(e => e.paid_by_id === currentMember?.id)
    .reduce((sum, e) => sum + (e.amountRupees || 0), 0);

  const netBalance = memberPaid - perPersonShare;
  const isCreditor = netBalance > 0.01;
  const isDebtor = netBalance < -0.01;

  // Top 5 recent expenses
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =====================================================================
          ROOM HERO BANNER & STATS
         ===================================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              <span>{room?.name || 'Room No. 204'}</span>
              <span>•</span>
              <span>{memberCount} Roommates</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Room Expenses</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
                {formatINR(overallTotal)}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Current Month: <span className="text-white font-medium">{formatINR(currentMonthTotal)}</span>
              {' • '}
              Equal Share: <span className="text-brand-300 font-medium">{formatINR(perPersonShare)}</span> each
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddExpense}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/30 transition text-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Expense</span>
            </button>

            <button
              onClick={onNavigateToHisaab}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold rounded-2xl border border-white/10 transition text-sm backdrop-blur-md"
            >
              <Calculator className="w-4 h-4 text-brand-400" />
              <span>Calculate Hisaab</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CURRENT USER'S PERSONAL BALANCE CARD (Highlighted with Color Rules)
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentMember?.profile_image || '👤'}</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Your Personal Balance
              </h3>
              <p className="text-xs text-slate-500">
                Viewing as <span className="font-semibold text-slate-700">{currentMember?.name || 'Roommate'}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Equal Share</span>
            <span className="text-xs font-bold text-slate-700">{formatINR(perPersonShare)}</span>
          </div>
        </div>

        {/* Dynamic Balance Indicator */}
        <div className={`p-4 rounded-2xl border transition ${
          isCreditor
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : isDebtor
            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                isCreditor ? 'bg-emerald-600 shadow-sm shadow-emerald-600/30' : isDebtor ? 'bg-rose-600 shadow-sm shadow-rose-600/30' : 'bg-slate-500'
              }`}>
                {isCreditor ? (
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                ) : isDebtor ? (
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                  {isCreditor ? 'Overall You Will Receive' : isDebtor ? 'Overall You Need To Pay' : 'Status'}
                </p>
                <p className={`text-2xl font-black ${
                  isCreditor ? 'text-emerald-700' : isDebtor ? 'text-rose-700' : 'text-slate-800'
                }`}>
                  {isCreditor ? `+${formatINR(netBalance)}` : isDebtor ? formatINR(netBalance) : 'All Settled Up 🎉'}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToHisaab}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isCreditor
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : isDebtor
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              <span>View Settlements</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Breakdown mini-row */}
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Your Total Paid:</span>{' '}
              <strong className="text-slate-800">{formatINR(memberPaid)}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px]">Your Fair Share:</span>{' '}
              <strong className="text-slate-800">{formatINR(perPersonShare)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROOMMATES OVERVIEW CHIPS
         ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Roommates Breakdown ({members.length})
          </h3>
          <span className="text-xs text-slate-400">Equal split for all</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {members.map(m => {
            const mPaid = expenses
              .filter(e => e.paid_by_id === m.id)
              .reduce((sum, e) => sum + (e.amountRupees || 0), 0);
            const mBalance = mPaid - perPersonShare;
            const mReceives = mBalance > 0.01;
            const mPays = mBalance < -0.01;

            return (
              <div
                key={m.id}
                className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{m.profile_image || '👤'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    mReceives
                      ? 'bg-emerald-100 text-emerald-800'
                      : mPays
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mReceives ? `+${formatINR(mBalance)}` : mPays ? formatINR(mBalance) : 'Settled'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Paid: {formatINR(mPaid)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          RECENT EXPENSES LIST
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Expenses</h3>
          </div>
          <button
            onClick={onNavigateToExpenses}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1"
          >
            <span>View All ({expenses.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No expenses yet.</p>
              <p className="text-xs text-slate-500 mt-0.5">Start recording daily roommate expenses digitally.</p>
            </div>
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-brand-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add First Expense</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map(exp => {
              const meta = getCategoryMeta(exp.category);
              return (
                <div
                  key={exp.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl px-2 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200/60">
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {exp.description}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>{formatDate(exp.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">{exp.paid_by_name}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-sm text-[10px] ${meta.color}`}>
                          {exp.category}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatINR(exp.amountRupees)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatINR(exp.perPersonShareRupees)} / person
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
