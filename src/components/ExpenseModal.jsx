import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Tag, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { CATEGORIES, formatINR } from '../utils/formatters.js';

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  members = [],
  currentMember
}) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date || '');
        setAmount(initialData.amountRupees ? String(initialData.amountRupees) : '');
        setPaidById(initialData.paid_by_id || '');
        setDescription(initialData.description || '');
        setCategory(initialData.category || 'Grocery');
      } else {
        // Default to today in YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        setDate(today);
        setAmount('');
        setPaidById(currentMember?.id || members[0]?.id || '');
        setDescription('');
        setCategory('Grocery');
      }
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, initialData, members, currentMember]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const memberCount = members.length || 1;
  const perPersonShare = numAmount > 0 ? (numAmount / memberCount) : 0;
  const selectedPayer = members.find(m => m.id === paidById);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!date) {
      setError('Date is required');
      return;
    }
    if (!amount || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!paidById) {
      setError('Please select who paid this expense');
      return;
    }
    if (!description.trim()) {
      setError('Expense description is required');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        date,
        amount: numAmount,
        paidById,
        description: description.trim(),
        category
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-slate-500">
              All expenses are split equally among all {memberCount} roommates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus={!initialData}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-2xl text-2xl font-bold text-slate-900 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          {numAmount > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200/80 rounded-2xl text-xs text-brand-950 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-brand-800">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Equal Split Preview</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Divided among <strong>{memberCount} members</strong>
                  {selectedPayer ? ` • Paid by ${selectedPayer.name}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Per Person Share</span>
                <span className="text-base font-extrabold text-brand-700">
                  {formatINR(perPersonShare)}
                </span>
              </div>
            </div>
          )}

          {/* Paid By & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Paid By */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid By <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={paidById}
                  onChange={e => setPaidById(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden transition cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Roommate</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.profile_image || '👤'} {m.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden transition cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expense Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Grocery, Milk, Cooking Gas, WiFi Bill..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'bg-brand-50 border-brand-500 text-brand-900 font-semibold ring-1 ring-brand-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm shadow-brand-600/30 transition"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
