// Currency formatting for Indian Rupee (₹)
export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(absNum) ? 0 : 2
  }).format(absNum);

  return isNegative ? `-${formatted}` : formatted;
}

// Format date into human readable "26 Sep 2026"
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Category badges and icons
export const CATEGORIES = [
  { name: 'Grocery', icon: '🛒', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Food', icon: '🍲', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Milk', icon: '🥛', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Electricity', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Gas', icon: '🔥', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Internet', icon: '📶', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Rent', icon: '🏠', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Water', icon: '💧', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'Other', icon: '📦', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export function getCategoryMeta(catName) {
  return CATEGORIES.find(c => c.name.toLowerCase() === (catName || '').toLowerCase()) || {
    name: catName || 'Other',
    icon: '🧾',
    color: 'bg-slate-50 text-slate-700 border-slate-200'
  };
}
