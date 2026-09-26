import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Lock,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, formatINR, formatDate, getCategoryMeta } from '../utils/formatters.js';

export default function ExpenseManagerView({
  expenses = [],
  members = [],
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMember, setSelectedMember] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering logic
  const filteredExpenses = expenses.filter(exp => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = (exp.description || '').toLowerCase().includes(q);
      const matchPayer = (exp.paid_by_name || '').toLowerCase().includes(q);
      if (!matchDesc && !matchPayer) return false;
    }
    // Category
    if (selectedCategory !== 'All') {
      if ((exp.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }
    // Member
    if (selectedMember !== 'All') {
      if (exp.paid_by_id !== selectedMember) return false;
    }
    // Date
    if (startDate && exp.date < startDate) return false;
    if (endDate && exp.date > endDate) return false;

    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Expenses History</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filteredExpenses.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total for filtered view: <strong className="text-brand-800 font-bold">{formatINR(totalFiltered)}</strong>
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-sm shadow-brand-600/30 transition text-xs sm:text-sm active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description or paid by..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
            />
          </div>

          {/* Member Filter */}
          <select
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Roommates</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Date Range quick inputs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              title="Filter from date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              title="Filter to date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[11px] text-brand-700 font-semibold hover:underline px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-brand-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
            🔍
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No matching expenses found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query, member filter, or date filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header for Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Paid By</div>
            <div className="col-span-2 text-right">Amount / Share</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map(exp => {
              const meta = getCategoryMeta(exp.category);
              const isLocked = exp.isClosedMonth;

              return (
                <div
                  key={exp.id}
                  className="p-4 sm:px-6 sm:py-3.5 flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 hover:bg-slate-50/60 transition"
                >
                  {/* Date & Mobile Top Row */}
                  <div className="md:col-span-2 flex items-center justify-between md:block">
                    <span className="text-xs font-semibold text-slate-700">
                      {formatDate(exp.date)}
                    </span>
                    {/* Mobile category badge */}
                    <span className={`md:hidden px-2 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 ${meta.color}`}>
                      <span>{meta.icon}</span>
                      <span>{exp.category}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex w-7 h-7 rounded-lg bg-slate-100 items-center justify-center text-sm shrink-0">
                        {meta.icon}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {exp.description}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Category */}
                  <div className="hidden md:block md:col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${meta.color}`}>
                      <span>{meta.icon}</span>
                      <span>{exp.category}</span>
                    </span>
                  </div>

                  {/* Paid By */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-2">
                    <span className="md:hidden text-xs text-slate-400">Paid By:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{exp.paid_by_avatar || '👤'}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {exp.paid_by_name}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Share */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end md:text-right">
                    <span className="md:hidden text-xs text-slate-400">Total & Per Head:</span>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatINR(exp.amountRupees)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatINR(exp.perPersonShareRupees)} / share
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex items-center justify-end gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {isLocked ? (
                      <span
                        className="p-1.5 text-slate-400 cursor-not-allowed"
                        title="Month is closed. Cannot edit or delete."
                      >
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
