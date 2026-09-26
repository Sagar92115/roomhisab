import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Tag,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatINR, CATEGORIES, getCategoryMeta } from '../utils/formatters.js';

export default function AnalyticsView({
  room,
  members = [],
  expenses = []
}) {
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or 'YYYY-MM'

  // Extract available months
  const monthSet = new Set();
  expenses.forEach(e => {
    if (e.date) monthSet.add(e.date.slice(0, 7));
  });
  const availableMonths = Array.from(monthSet).sort().reverse();

  // Filter expenses by selected month
  const activeExpenses = selectedMonth === 'all'
    ? expenses
    : expenses.filter(e => e.date.startsWith(selectedMonth));

  const totalExpense = activeExpenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);
  const memberCount = members.length || 1;
  const perPersonShare = totalExpense / memberCount;

  // Category breakdown
  const categoryTotals = {};
  CATEGORIES.forEach(c => { categoryTotals[c.name] = 0; });
  activeExpenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amountRupees || 0);
  });

  const sortedCategories = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  // Member contributions
  const memberContributions = members.map(m => {
    const mPaid = activeExpenses
      .filter(e => e.paid_by_id === m.id)
      .reduce((sum, e) => sum + (e.amountRupees || 0), 0);
    return {
      id: m.id,
      name: m.name,
      avatar: m.profile_image,
      paid: mPaid,
      percent: totalExpense > 0 ? (mPaid / totalExpense) * 100 : 0
    };
  }).sort((a, b) => b.paid - a.paid);

  // Highest and lowest contributors
  const highestSpender = memberContributions[0]?.paid > 0 ? memberContributions[0] : null;
  const lowestSpender = memberContributions.length > 1 ? memberContributions[memberContributions.length - 1] : null;
  const topCategory = sortedCategories[0] ? { name: sortedCategories[0][0], amount: sortedCategories[0][1] } : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Room Analytics & Summary</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {activeExpenses.length} records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Spending patterns, category breakdown, and roommate contributions.
          </p>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Period:</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer shadow-2xs"
          >
            <option value="all">All Recorded History</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 4 Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Spent
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(totalExpense)}
          </span>
          <span className="text-[11px] text-slate-500">{activeExpenses.length} transactions</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Per Head Share
          </span>
          <span className="text-xl font-extrabold text-brand-700 mt-1 block">
            {formatINR(perPersonShare)}
          </span>
          <span className="text-[11px] text-slate-500">Divided by {memberCount}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Top Category
          </span>
          <span className="text-base font-extrabold text-slate-900 mt-1 block truncate">
            {topCategory ? `${getCategoryMeta(topCategory.name).icon} ${topCategory.name}` : 'N/A'}
          </span>
          <span className="text-[11px] text-slate-500">
            {topCategory ? formatINR(topCategory.amount) : '0'}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Avg per Expense
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(activeExpenses.length > 0 ? totalExpense / activeExpenses.length : 0)}
          </span>
          <span className="text-[11px] text-slate-500">Across all bills</span>
        </div>
      </div>

      {/* Informational Spender Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Highest Contributor */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shadow-2xs">
              {highestSpender?.avatar || '👑'}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Top Contributor (Paid Most)
              </span>
              <h4 className="text-sm font-bold text-slate-900">{highestSpender?.name || 'N/A'}</h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-700">
              {formatINR(highestSpender?.paid || 0)}
            </span>
            <span className="text-[10px] text-emerald-800/80 block font-medium">
              {(highestSpender?.percent || 0).toFixed(0)}% of total
            </span>
          </div>
        </div>

        {/* Lowest Contributor */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-xl shadow-2xs">
              {lowestSpender?.avatar || '🪙'}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                Lowest Contributor (Paid Least)
              </span>
              <h4 className="text-sm font-bold text-slate-900">{lowestSpender?.name || 'N/A'}</h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-amber-800">
              {formatINR(lowestSpender?.paid || 0)}
            </span>
            <span className="text-[10px] text-amber-800/80 block font-medium">
              {(lowestSpender?.percent || 0).toFixed(0)}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Informational Disclaimer Notice as requested in prompt */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="leading-tight">
          <em>Note:</em> Who paid the most or least is informational only to track rotation of bills, not to judge roommates.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-600" />
            <span>Category Spending Breakdown</span>
          </h3>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No expenses in this period.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([catName, amount]) => {
                const meta = getCategoryMeta(catName);
                const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{meta.icon}</span>
                        <span>{catName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{percent.toFixed(1)}%</span>
                        <span className="font-bold text-slate-900">{formatINR(amount)}</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member-wise Contribution vs Fair Share */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span>Roommate Contribution vs Equal Share</span>
          </h3>

          <div className="space-y-4">
            {memberContributions.map(m => {
              const diff = m.paid - perPersonShare;
              const isAhead = diff > 0.01;
              const isBehind = diff < -0.01;
              const maxVal = Math.max(...memberContributions.map(x => x.paid), perPersonShare, 1);
              const barPercent = (m.paid / maxVal) * 100;

              return (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span>{m.avatar || '👤'}</span>
                      <span>{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${
                        isAhead ? 'text-emerald-700' : isBehind ? 'text-rose-700' : 'text-slate-500'
                      }`}>
                        {isAhead ? `+${formatINR(diff)}` : isBehind ? formatINR(diff) : 'Equal'}
                      </span>
                      <span className="font-bold text-slate-900">{formatINR(m.paid)}</span>
                    </div>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAhead
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : isBehind
                          ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(barPercent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
