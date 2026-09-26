import React, { useState } from 'react';
import { X, Plus, Trash2, Home, Key, Upload, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function RoomCreateJoinModal({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onResetDemo
}) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState([
    { name: '', upiId: '', qrImage: null, profileImage: '👨‍💼' },
    { name: '', upiId: '', qrImage: null, profileImage: '👨‍💻' },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const avatarOptions = ['👨‍💼', '👨‍💻', '🧑‍🎨', '🧑‍🍳', '👩‍🔬', '👨‍🚀', '🧕', '🧔', '🦁', '🚀'];

  const addMemberField = () => {
    const nextAvatar = avatarOptions[members.length % avatarOptions.length];
    setMembers([...members, { name: '', upiId: '', qrImage: null, profileImage: nextAvatar }]);
  };

  const removeMemberField = (idx) => {
    if (members.length <= 2) {
      setError('A room must have at least 2 members');
      return;
    }
    const updated = members.filter((_, i) => i !== idx);
    setMembers(updated);
  };

  const updateMember = (idx, field, value) => {
    const updated = [...members];
    updated[idx][field] = value;
    setMembers(updated);
  };

  const handleQrUpload = async (idx, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('qrImage', file);
      const res = await fetch('/api/upload-qr', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        updateMember(idx, 'qrImage', data.qrImageUrl);
      } else {
        setError(data.error || 'Failed to upload QR code');
      }
    } catch (err) {
      setError('Failed to upload QR image file');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomName.trim()) {
      setError('Please provide a Room/Group Name');
      return;
    }
    if (members.length < 2) {
      setError('At least 2 members are required');
      return;
    }
    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setError(`Member #${i + 1} name cannot be empty`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await onCreateRoom(roomName.trim(), members);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      setSubmitting(true);
      await onJoinRoom(inviteCode.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Tabs */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTab('create'); setError(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'create'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Create Your Room
            </button>
            <button
              onClick={() => { setTab('join'); setError(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'join'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Join by Code
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room / Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room No. 204, Sector 62 Bachelors"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Roommates (Minimum 2) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addMemberField}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          {/* Avatar selector */}
                          <div className="relative group">
                            <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs cursor-pointer">
                              {m.profileImage}
                            </span>
                          </div>
                          {/* Name Input */}
                          <input
                            type="text"
                            placeholder={`Member ${idx + 1} Name (e.g. ${['Sagar', 'Rahul', 'Amit', 'Rohit'][idx] || 'Roommate'})`}
                            value={m.name}
                            onChange={e => updateMember(idx, 'name', e.target.value)}
                            required
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-brand-500 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden"
                          />
                        </div>

                        {members.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeMemberField(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* UPI ID & QR Upload row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="UPI ID (e.g. sagar@upi)"
                          value={m.upiId}
                          onChange={e => updateMember(idx, 'upiId', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 focus:border-brand-500 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-hidden"
                        />

                        <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 hover:border-brand-500 rounded-xl cursor-pointer text-[11px] font-medium text-slate-600 transition truncate">
                          <Upload className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {m.qrImage ? '✓ QR Uploaded' : 'Upload QR Code'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleQrUpload(idx, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-600/30 transition"
                >
                  {submitting ? 'Creating Room...' : 'Create Room & Open Dashboard'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter Room Invite Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. RH-204-DEMO"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-2xl text-base font-mono font-bold text-slate-900 tracking-wider focus:outline-hidden transition"
                  />
                  <Key className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Ask your room creator or roommate for the 8-character invite code.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-600/30 transition"
                >
                  {submitting ? 'Joining Room...' : 'Join Room'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Loader Pill */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  setSubmitting(true);
                  await onResetDemo();
                  onClose();
                } catch (err) {
                  setError('Failed to load demo data');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Demo "Room No. 204" (Sagar, Rahul, Amit, Rohit)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
