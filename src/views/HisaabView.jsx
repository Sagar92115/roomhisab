import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Calendar,
  ArrowRight,
  QrCode as QrIcon,
  ExternalLink,
  CheckCircle2,
  Clock,
  Share2,
  Lock,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters.js';

export default function HisaabView({
  room,
  members = [],
  hisaabData,
  onCalculateHisaab,
  onToggleSettlementStatus,
  onOpenQrModal,
  onCloseMonthRequest
}) {
  // Preset calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Default to current month: e.g. 2026-09-01 to 2026-09-30
  const firstDayThisMonth = `${year}-${month}-01`;
  const lastDayThisMonth = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayThisMonth);
  const [endDate, setEndDate] = useState(lastDayThisMonth);
  const [datePreset, setDatePreset] = useState('this_month');
  const [copiedShare, setCopiedShare] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  // Quick preset handler
  const applyPreset = (presetKey) => {
    setDatePreset(presetKey);
    const curr = new Date();
    const currYear = curr.getFullYear();
    const currMonth = curr.getMonth();

    if (presetKey === 'today') {
      const todayStr = curr.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (presetKey === 'this_week') {
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(first)).toISOString().slice(0, 10);
      const sunday = new Date(curr.setDate(first + 6)).toISOString().slice(0, 10);
      setStartDate(monday);
      setEndDate(sunday);
    } else if (presetKey === 'this_month') {
      const start = `${currYear}-${String(currMonth + 1).padStart(2, '0')}-01`;
      const end = new Date(currYear, currMonth + 1, 0).toISOString().slice(0, 10);
      setStartDate(start);
      setEndDate(end);
    } else if (presetKey === 'last_month') {
      const lastMonthDate = new Date(currYear, currMonth - 1, 1);
      const lmYear = lastMonthDate.getFullYear();
      const lmMonth = lastMonthDate.getMonth();
      const start = `${lmYear}-${String(lmMonth + 1).padStart(2, '0')}-01`;
      const end = new Date(lmYear, lmMonth + 1, 0).toISOString().slice(0, 10);
      setStartDate(start);
      setEndDate(end);
    } else if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleCalculate = async () => {
    setError('');
    if (startDate && endDate && endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }
    setCalculating(true);
    try {
      await onCalculateHisaab(startDate, endDate);
    } catch (err) {
      setError(err.message || 'Failed to calculate Hisaab');
    } finally {
      setCalculating(false);
    }
  };

  // Trigger celebration confetti when payment is marked paid
  const handleStatusChange = async (settlementId, newStatus) => {
    if (newStatus === 'paid') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    await onToggleSettlementStatus(settlementId, newStatus);
  };

  // Generate shareable WhatsApp summary
  const generateShareSummary = () => {
    if (!hisaabData) return '';
    const dateRangeStr = startDate && endDate
      ? `${formatDate(startDate)} to ${formatDate(endDate)}`
      : 'All Recorded Time';

    let text = `🏠 *${(room?.name || 'ROOM NO. 204').toUpperCase()}*\n`;
    text += `💰 *HISAAB / SETTLEMENT SUMMARY*\n`;
    text += `📅 Period: ${dateRangeStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 *Total Room Expense:* ${formatINR(hisaabData.totalExpenseRupees)}\n`;
    text += `👥 *Members:* ${hisaabData.memberCount} | *Per Person:* ${formatINR(hisaabData.fairShareRupees)}\n\n`;

    text += `📊 *Who Paid What:*\n`;
    hisaabData.members.forEach(m => {
      const sign = m.balanceRupees > 0 ? `(+${formatINR(m.balanceRupees)})` : m.balanceRupees < 0 ? `(${formatINR(m.balanceRupees)})` : `(Settled)`;
      text += `• ${m.name}: ${formatINR(m.paidRupees)} ${sign}\n`;
    });

    text += `\n💸 *WHO PAYS WHOM (Settlements):*\n`;
    if (hisaabData.settlements.length === 0) {
      text += `🎉 Everyone is already settled up!\n`;
    } else {
      hisaabData.settlements.forEach((s, idx) => {
        const icon = s.status === 'paid' ? '✅' : '👉';
        text += `${idx + 1}️⃣ ${icon} *${s.fromMemberName}* ➔ *${s.toMemberName}*: ${formatINR(s.amountRupees)} (${s.status.toUpperCase()})\n`;
      });
    }

    text += `\n📱 _Calculated via RoomHisaab App_`;
    return text;
  };

  const handleShare = async () => {
    const text = generateShareSummary();
    if (!text) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${room?.name || 'Room'} Hisaab`,
          text: text
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =====================================================================
          DATE RANGE SELECTOR BAR
         ===================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-600" />
              <span>Calculate Hisaab</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select date range to calculate equal shares and who pays whom.
            </p>
          </div>

          {/* Quick presets pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all', label: 'All Time' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
                  datePreset === p.id
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Date Inputs & Calculate Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setDatePreset('custom'); }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setDatePreset('custom'); }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto pt-1 sm:pt-4">
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-600/30 transition cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>{calculating ? 'Calculating...' : 'Calculate Hisaab'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          HISAAB RESULTS SUMMARY
         ===================================================================== */}
      {hisaabData && (
        <div className="space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Total Expenses
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {formatINR(hisaabData.totalExpenseRupees)}
              </span>
              <span className="text-[11px] text-slate-500">In selected period</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Roommates
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {hisaabData.memberCount}
              </span>
              <span className="text-[11px] text-slate-500">Equal split rule</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Fair Share
              </span>
              <span className="text-xl font-extrabold text-brand-700 mt-1 block">
                {formatINR(hisaabData.fairShareRupees)}
              </span>
              <span className="text-[11px] text-slate-500">Per roommate</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Month Status
              </span>
              <span className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                {hisaabData.isMonthClosed ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700">Closed / Locked</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700">Active</span>
                  </>
                )}
              </span>
              <span className="text-[11px] text-slate-500">
                {hisaabData.isMonthClosed ? 'Records frozen' : 'Can add expenses'}
              </span>
            </div>
          </div>

          {/* =================================================================
              MEMBER BALANCES BREAKDOWN TABLE
             ================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Roommate Contribution & Balance</h3>
                <p className="text-xs text-slate-500">
                  Fair Share = Total / {hisaabData.memberCount} ({formatINR(hisaabData.fairShareRupees)} each)
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {hisaabData.members.map(m => {
                const isCreditor = m.balanceRupees > 0.01;
                const isDebtor = m.balanceRupees < -0.01;

                return (
                  <div
                    key={m.id}
                    className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.profile_image || '👤'}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{m.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{m.upi_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Paid</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {formatINR(m.paidRupees)}
                        </span>
                      </div>

                      <div className="min-w-[90px]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance</span>
                        <span className={`text-xs sm:text-sm font-extrabold ${
                          isCreditor
                            ? 'text-emerald-700'
                            : isDebtor
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}>
                          {isCreditor ? `+${formatINR(m.balanceRupees)}` : isDebtor ? formatINR(m.balanceRupees) : '₹0 Settled'}
                        </span>
                      </div>

                      <div className="hidden sm:block">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isCreditor
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDebtor
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isCreditor ? 'Receives' : isDebtor ? 'Pays' : 'Settled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =================================================================
              WHO PAYS WHOM (MINIMIZED SETTLEMENT TRANSACTIONS)
             ================================================================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Who Pays Whom (Settlements)</span>
                  <span className="text-xs bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded-full font-bold">
                    {hisaabData.settlements.length} payments
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Transactions minimized to settle all balances with the fewest payments.
                </p>
              </div>

              {/* Action Toolbar: Share Hisaab & Close Month */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition"
                  title="Share summary via WhatsApp or copy"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Share Hisaab</span>
                    </>
                  )}
                </button>

                {!hisaabData.isMonthClosed && (
                  <button
                    onClick={onCloseMonthRequest}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                    title="Close and freeze month records"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Close Month</span>
                  </button>
                )}
              </div>
            </div>

            {/* Settlements Cards Grid */}
            {hisaabData.settlements.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-2xl">
                  🎉
                </div>
                <h4 className="text-sm font-bold text-slate-800">Everyone is settled up!</h4>
                <p className="text-xs text-slate-500">
                  No pending payments for this date range.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hisaabData.settlements.map((s, idx) => {
                  const isPaid = s.status === 'paid';

                  return (
                    <div
                      key={s.id || idx}
                      className={`p-5 rounded-2xl border transition relative overflow-hidden space-y-4 ${
                        isPaid
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Top status indicator & amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </div>

                        <span className="text-xl font-black text-slate-900">
                          {formatINR(s.amountRupees)}
                        </span>
                      </div>

                      {/* Direction Flow: FROM -> TO */}
                      <div className="flex items-center justify-between bg-slate-50/90 p-3 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{s.fromMemberAvatar || '👤'}</span>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">FROM (Payer)</span>
                            <span className="font-bold text-slate-900">{s.fromMemberName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center px-2">
                          <span className="text-[10px] text-slate-400 font-bold mb-0.5">PAYS</span>
                          <ArrowRight className="w-4 h-4 text-brand-600 stroke-[2.5]" />
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">TO (Receiver)</span>
                            <span className="font-bold text-slate-900">{s.toMemberName}</span>
                          </div>
                          <span className="text-xl">{s.toMemberAvatar || '👤'}</span>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Direct Pay UPI button */}
                        <a
                          href={s.upiLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Pay {formatINR(s.amountRupees)}</span>
                        </a>

                        {/* Show QR button */}
                        <button
                          onClick={() => onOpenQrModal(s)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition"
                          title="Show receiver QR Code"
                        >
                          <QrIcon className="w-3.5 h-3.5 text-brand-600" />
                          <span>Show QR</span>
                        </button>

                        {/* Mark Paid / Undo button */}
                        <button
                          onClick={() => handleStatusChange(s.id, isPaid ? 'pending' : 'paid')}
                          className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title={isPaid ? 'Undo and mark pending' : 'Mark this settlement as paid'}
                        >
                          {isPaid ? (
                            <>
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Undo</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Mark Paid</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
