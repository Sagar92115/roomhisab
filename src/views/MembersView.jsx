import React, { useState } from 'react';
import {
  Users,
  Plus,
  QrCode as QrIcon,
  Upload,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatINR, formatDate, getCategoryMeta } from '../utils/formatters.js';

export default function MembersView({
  room,
  members = [],
  expenses = [],
  onAddMember,
  onUpdateMember,
  onRemoveMember
}) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUpiId, setNewUpiId] = useState('');
  const [newQrImage, setNewQrImage] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [error, setError] = useState('');

  // Overall totals for share calculation
  const totalRoomExpenses = expenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);
  const memberCount = members.length || 1;
  const fairShare = totalRoomExpenses / memberCount;

  // Fetch deep details for clicked member
  const handleOpenMemberDetails = async (m) => {
    setSelectedMember(m);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/members/${m.id}/details`);
      const data = await res.json();
      if (data.success) {
        setMemberDetails(data);
      }
    } catch (err) {
      console.error('Failed to load member details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) {
      setError('Member name is required');
      return;
    }
    try {
      await onAddMember({
        name: newName.trim(),
        upiId: newUpiId.trim(),
        qrImage: newQrImage
      });
      setAddModalOpen(false);
      setNewName('');
      setNewUpiId('');
      setNewQrImage(null);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await onUpdateMember(editingMember.id, {
        name: editName.trim(),
        upiId: editUpiId.trim()
      });
      setEditingMember(null);
    } catch (err) {
      setError(err.message || 'Failed to update member');
    }
  };

  const handleQrUpload = async (memberId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('qrImage', file);
      const res = await fetch('/api/upload-qr', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        await onUpdateMember(memberId, { qrImage: data.qrImageUrl });
        if (selectedMember?.id === memberId) {
          handleOpenMemberDetails({ ...selectedMember, qr_image: data.qrImageUrl });
        }
      }
    } catch (err) {
      console.error('Failed to upload QR:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Roommates & Profiles</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {members.length} members
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage UPI IDs, QR codes, and view personal ledgers.
          </p>
        </div>

        <button
          onClick={() => { setError(''); setAddModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-sm shadow-brand-600/30 transition text-xs sm:text-sm active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Roommate</span>
        </button>
      </div>

      {/* Grid of Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {members.map(m => {
          const mExpenses = expenses.filter(e => e.paid_by_id === m.id);
          const totalPaid = mExpenses.reduce((sum, e) => sum + (e.amountRupees || 0), 0);
          const balance = totalPaid - fairShare;
          const isCreditor = balance > 0.01;
          const isDebtor = balance < -0.01;

          return (
            <div
              key={m.id}
              onClick={() => handleOpenMemberDetails(m)}
              className="p-5 bg-white border border-slate-200 rounded-3xl shadow-2xs hover:shadow-md hover:border-brand-300 transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition shadow-2xs">
                    {m.profile_image || '👤'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {m.is_admin ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                        Admin
                      </span>
                    ) : null}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      m.qr_image ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.qr_image ? 'QR ✓' : 'Auto QR'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition truncate">
                    {m.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                    {m.upi_id || 'No UPI ID registered'}
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Total Paid:</span>
                  <span className="font-bold text-slate-900">{formatINR(totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Balance:</span>
                  <span className={`font-extrabold ${
                    isCreditor ? 'text-emerald-700' : isDebtor ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {isCreditor ? `+${formatINR(balance)}` : isDebtor ? formatINR(balance) : 'Settled'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          MEMBER DETAILS MODAL
         ===================================================================== */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedMember.profile_image || '👤'}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedMember.name}</span>
                    {selectedMember.is_admin ? (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-medium">Admin</span>
                    ) : null}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{selectedMember.upi_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {loadingDetails || !memberDetails ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading member ledger...</div>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Paid</span>
                      <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                        {formatINR(memberDetails.summary.totalPaidRupees)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fair Share</span>
                      <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                        {formatINR(memberDetails.summary.fairShareRupees)}
                      </span>
                    </div>

                    <div className={`p-3 border rounded-2xl text-center ${
                      memberDetails.summary.status === 'receives'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : memberDetails.summary.status === 'pays'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <span className="text-[10px] uppercase font-semibold block opacity-75">Net Balance</span>
                      <span className="text-sm font-black mt-0.5 block">
                        {memberDetails.summary.status === 'receives' ? `+${formatINR(memberDetails.summary.balanceRupees)}` : formatINR(memberDetails.summary.balanceRupees)}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        {selectedMember.qr_image ? (
                          <img src={selectedMember.qr_image} alt="QR" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <QrIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">UPI QR Code</h4>
                        <p className="text-[11px] text-slate-500">
                          {selectedMember.qr_image ? 'Custom QR uploaded' : 'Dynamic UPI QR used'}
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{selectedMember.qr_image ? 'Replace QR' : 'Upload QR'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleQrUpload(selectedMember.id, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Expenses paid by this member */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Expenses Paid by {selectedMember.name} ({memberDetails.expenses.length})
                    </h4>

                    {memberDetails.expenses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No expenses paid yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-200/80 p-2">
                        {memberDetails.expenses.map(e => {
                          const meta = getCategoryMeta(e.category);
                          return (
                            <div key={e.id} className="py-2 px-2 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <span>{meta.icon}</span>
                                <span className="font-semibold text-slate-800 truncate">{e.description}</span>
                                <span className="text-[10px] text-slate-400">({formatDate(e.date)})</span>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                {formatINR(e.amountRupees)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action buttons: Edit member info or remove */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setEditingMember(selectedMember);
                        setEditName(selectedMember.name);
                        setEditUpiId(selectedMember.upi_id || '');
                        setSelectedMember(null);
                      }}
                      className="flex items-center gap-1.5 text-brand-700 hover:text-brand-800 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Name / UPI</span>
                    </button>

                    {members.length > 2 && (
                      <button
                        onClick={async () => {
                          try {
                            await onRemoveMember(selectedMember.id);
                            setSelectedMember(null);
                          } catch (err) {
                            alert(err.message || 'Cannot remove member');
                          }
                        }}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Member</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ADD MEMBER MODAL
         ===================================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Roommate</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikas, Priya..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-slate-900 font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. vikas@okaxis"
                  value={newUpiId}
                  onChange={e => setNewUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-slate-900 font-mono focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Roommate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MEMBER MODAL
         ===================================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Roommate</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">UPI ID</label>
                <input
                  type="text"
                  value={editUpiId}
                  onChange={e => setEditUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
