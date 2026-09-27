import React, { useState } from 'react';
import { Plus, Trash2, Key, Sparkles, Upload, ShieldCheck, ArrowRight, Home, Users } from 'lucide-react';

export default function WelcomeView({
  onCreateRoom,
  onJoinRoom,
  onLoadDemo
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
    setMembers(members.filter((_, i) => i !== idx));
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
    } catch (err) {
      setError(err.message || 'Failed to create room');
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
    } catch (err) {
      setError(err.message || 'Failed to join room. Please check the code.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white selection:bg-brand-500">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white font-extrabold text-3xl shadow-xl shadow-brand-500/30">
            ₹
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            RoomHisaab – Shared Expense Manager for Roommates
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Track daily room expenses, split bills equally among roommates and bachelors, calculate your Hisaab and easily settle payments via 1-click UPI.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 text-slate-900 border border-slate-100 space-y-5 animate-in fade-in duration-200">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setTab('create'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'create'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Create Your Room</span>
            </button>
            <button
              onClick={() => { setTab('join'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'join'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Key className="w-4 h-4 text-brand-600" />
              <span>Join with Code</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room / Flat Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room No. 204, Flat 401..."
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              {/* Members Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Add Roommates (Min 2) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addMemberField}
                    className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Person</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">
                          {m.profileImage}
                        </span>
                        <input
                          type="text"
                          placeholder={`Roommate #${idx + 1} Name`}
                          value={m.name}
                          onChange={e => updateMember(idx, 'name', e.target.value)}
                          required
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-brand-500 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden"
                        />
                        {members.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeMemberField(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="UPI ID (e.g. name@upi)"
                          value={m.upiId}
                          onChange={e => updateMember(idx, 'upiId', e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 focus:border-brand-500 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-hidden"
                        />

                        <label className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-dashed border-slate-300 hover:border-brand-500 rounded-xl cursor-pointer text-[10px] font-medium text-slate-600 transition truncate">
                          <Upload className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {m.qrImage ? '✓ QR Added' : 'Upload QR'}
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{submitting ? 'Creating Room...' : 'Create Room & Open Hisaab'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter Room Invite Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. RH-BEST-699F8F"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-2xl text-base font-mono font-bold text-slate-900 tracking-wider focus:outline-hidden transition"
                  />
                  <Key className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter the invite code shared by your roommate to view and manage your shared room hisaab.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{submitting ? 'Joining Room...' : 'Join Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Demo Room Option */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onLoadDemo}
              className="text-xs font-semibold text-slate-500 hover:text-brand-700 transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or explore sample "Room No. 204" demo</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero passwords or banking credentials needed. 100% Private.</span>
        </div>
      </div>
    </div>
  );
}
