import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import ExpenseModal from './components/ExpenseModal.jsx';
import QrPaymentModal from './components/QrPaymentModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import RoomCreateJoinModal from './components/RoomCreateJoinModal.jsx';

import DashboardView from './views/DashboardView.jsx';
import ExpenseManagerView from './views/ExpenseManagerView.jsx';
import HisaabView from './views/HisaabView.jsx';
import MembersView from './views/MembersView.jsx';
import AnalyticsView from './views/AnalyticsView.jsx';
import SettingsView from './views/SettingsView.jsx';
import WelcomeView from './views/WelcomeView.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [hisaabData, setHisaabData] = useState(null);
  const [closedMonths, setClosedMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeSettlementForQr, setActiveSettlementForQr] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

  // Toast message
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch all rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success && data.rooms) {
        setRooms(data.rooms);
        return data.rooms;
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
    return [];
  };

  // 2. Fetch full room details
  const loadRoomDetails = useCallback(async (roomId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();

      if (data.success) {
        setActiveRoom(data.room);
        setMembers(data.members);
        setClosedMonths(data.closedMonths || []);

        // Default current member to first or preserved member
        setCurrentMember(prev => {
          if (prev && data.members.some(m => m.id === prev.id)) {
            return data.members.find(m => m.id === prev.id);
          }
          return data.members[0] || null;
        });

        // Fetch expenses
        const expRes = await fetch(`/api/rooms/${roomId}/expenses`);
        const expData = await expRes.json();
        if (expData.success) {
          setExpenses(expData.expenses);
        }

        // Fetch initial Hisaab for current month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);

        const hisaabRes = await fetch(`/api/rooms/${roomId}/hisaab?startDate=${startDate}&endDate=${endDate}`);
        const hisaabJson = await hisaabRes.json();
        if (hisaabJson.success) {
          setHisaabData(hisaabJson.hisaab);
        }
      }
    } catch (err) {
      console.error('Failed to load room:', err);
      showToast('Failed to load room details', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: Only load room if stored in user's browser or invite link in URL!
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');

    if (joinCode) {
      handleJoinRoom(joinCode);
      return;
    }

    const storedRoomId = localStorage.getItem('roomhisaab_active_room_id');
    if (storedRoomId) {
      fetch(`/api/rooms/${storedRoomId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.room) {
            loadRoomDetails(storedRoomId);
          } else {
            localStorage.removeItem('roomhisaab_active_room_id');
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      // New visitor: Show Welcome screen, DO NOT load anyone else's hisaab!
      setLoading(false);
    }
  }, [loadRoomDetails]);

  // Handle Create Room
  const handleCreateRoom = async (name, newMembers) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, members: newMembers })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    localStorage.setItem('roomhisaab_active_room_id', data.room.id);
    await fetchRooms();
    await loadRoomDetails(data.room.id);
    showToast(`Room "${data.room.name}" created successfully!`);
    setActiveTab('dashboard');
  };

  // Handle Join Room
  const handleJoinRoom = async (inviteCode) => {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    localStorage.setItem('roomhisaab_active_room_id', data.room.id);
    await fetchRooms();
    await loadRoomDetails(data.room.id);
    showToast(`Joined "${data.room.name}"!`);
  };

  // Handle Reset Demo
  const handleResetDemo = async () => {
    const res = await fetch('/api/rooms/reset-demo', { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    localStorage.setItem('roomhisaab_active_room_id', data.roomId);
    await fetchRooms();
    await loadRoomDetails(data.roomId);
    showToast('Demo Room No. 204 loaded!');
    setActiveTab('dashboard');
  };

  // Handle Exit / Switch Room
  const handleExitRoom = () => {
    localStorage.removeItem('roomhisaab_active_room_id');
    setActiveRoom(null);
    setMembers([]);
    setExpenses([]);
    setHisaabData(null);
    showToast('Switched to Welcome screen');
  };

  // Add / Edit Expense
  const handleSaveExpense = async (expenseData) => {
    if (!activeRoom) return;

    if (editingExpense) {
      const res = await fetch(`/api/rooms/${activeRoom.id}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Expense updated successfully');
    } else {
      const res = await fetch(`/api/rooms/${activeRoom.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Expense recorded successfully');
    }

    setEditingExpense(null);
    await loadRoomDetails(activeRoom.id);
  };

  // Delete Expense
  const handleDeleteExpense = (exp) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Expense?',
      message: `Are you sure you want to delete "${exp.description}" (₹${exp.amountRupees})? This cannot be undone.`,
      confirmText: 'Delete Expense',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rooms/${activeRoom.id}/expenses/${exp.id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          showToast('Expense deleted');
          await loadRoomDetails(activeRoom.id);
        } catch (err) {
          showToast(err.message || 'Failed to delete expense', 'error');
        }
      }
    });
  };

  // Calculate Hisaab for date range
  const handleCalculateHisaab = async (startDate, endDate) => {
    if (!activeRoom) return;
    const url = `/api/rooms/${activeRoom.id}/hisaab?startDate=${startDate || ''}&endDate=${endDate || ''}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setHisaabData(data.hisaab);
    showToast('Hisaab calculated successfully!');
  };

  // Toggle settlement status
  const handleToggleSettlementStatus = async (settlementId, newStatus) => {
    try {
      const res = await fetch(`/api/settlements/${settlementId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update local settlement state
        setHisaabData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            settlements: prev.settlements.map(s => s.id === settlementId ? { ...s, status: newStatus } : s)
          };
        });
        showToast(newStatus === 'paid' ? 'Payment marked as Paid! 🎉' : 'Payment marked as Pending');
      }
    } catch (err) {
      showToast('Failed to update settlement status', 'error');
    }
  };

  // Close Month Request
  const handleCloseMonthRequest = () => {
    if (!hisaabData?.startDate) {
      showToast('Please select a specific month range first', 'error');
      return;
    }
    const monthKey = hisaabData.startDate.slice(0, 7);

    setConfirmConfig({
      isOpen: true,
      title: `Close Month ${monthKey}?`,
      message: `Closing this month will freeze all ${hisaabData.memberCount} roommates' expenses for ${monthKey} and lock them against editing or accidental deletion. You can reopen it later from Settings if needed.`,
      confirmText: 'Yes, Finalize & Close',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rooms/${activeRoom.id}/months/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monthKey,
              closedByMemberId: currentMember?.id,
              notes: `Finalized hisaab for ${monthKey}`
            })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          showToast(`Month ${monthKey} closed and records frozen!`);
          await loadRoomDetails(activeRoom.id);
        } catch (err) {
          showToast(err.message || 'Failed to close month', 'error');
        }
      }
    });
  };

  // Reopen Month
  const handleReopenMonth = async (monthKey) => {
    try {
      const res = await fetch(`/api/rooms/${activeRoom.id}/months/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast(`Month ${monthKey} reopened!`);
      await loadRoomDetails(activeRoom.id);
    } catch (err) {
      showToast(err.message || 'Failed to reopen month', 'error');
    }
  };

  // Add Member
  const handleAddMember = async (memberData) => {
    const res = await fetch(`/api/rooms/${activeRoom.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast(`Added ${memberData.name} to room!`);
    await loadRoomDetails(activeRoom.id);
  };

  // Update Member
  const handleUpdateMember = async (memberId, memberData) => {
    const res = await fetch(`/api/rooms/${activeRoom.id}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast('Member profile updated');
    await loadRoomDetails(activeRoom.id);
  };

  // Remove Member
  const handleRemoveMember = async (memberId) => {
    const res = await fetch(`/api/rooms/${activeRoom.id}/members/${memberId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast('Member removed');
    await loadRoomDetails(activeRoom.id);
  };

  // Update Room Name
  const handleUpdateRoomName = async (name) => {
    const res = await fetch(`/api/rooms/${activeRoom.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast('Room name updated');
    await loadRoomDetails(activeRoom.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading RoomHisaab...</p>
      </div>
    );
  }

  if (!activeRoom) {
    return (
      <>
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-brand-700'
          }`}>
            <span>{toast.message}</span>
          </div>
        )}
        <WelcomeView
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLoadDemo={handleResetDemo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-brand-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Desktop Sidebar & Mobile Bottom Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setExpenseModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          room={activeRoom}
          members={members}
          currentMember={currentMember}
          setCurrentMember={setCurrentMember}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setExpenseModalOpen(true);
          }}
          onOpenRoomModal={() => setRoomModalOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
                <DashboardView
                  room={activeRoom}
                  members={members}
                  currentMember={currentMember}
                  expenses={expenses}
                  hisaabSummary={hisaabData}
                  onOpenAddExpense={() => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  }}
                  onNavigateToHisaab={() => setActiveTab('hisaab')}
                  onNavigateToExpenses={() => setActiveTab('expenses')}
                  onEditExpense={(exp) => {
                    setEditingExpense(exp);
                    setExpenseModalOpen(true);
                  }}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpenseManagerView
                  expenses={expenses}
                  members={members}
                  onOpenAddExpense={() => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  }}
                  onEditExpense={(exp) => {
                    setEditingExpense(exp);
                    setExpenseModalOpen(true);
                  }}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'hisaab' && (
                <HisaabView
                  room={activeRoom}
                  members={members}
                  hisaabData={hisaabData}
                  onCalculateHisaab={handleCalculateHisaab}
                  onToggleSettlementStatus={handleToggleSettlementStatus}
                  onOpenQrModal={(settlement) => {
                    setActiveSettlementForQr(settlement);
                    setQrModalOpen(true);
                  }}
                  onCloseMonthRequest={handleCloseMonthRequest}
                />
              )}

              {activeTab === 'members' && (
                <MembersView
                  room={activeRoom}
                  members={members}
                  expenses={expenses}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onRemoveMember={handleRemoveMember}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  room={activeRoom}
                  members={members}
                  expenses={expenses}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  room={activeRoom}
                  rooms={rooms}
                  members={members}
                  closedMonths={closedMonths}
                  onSwitchRoom={(id) => loadRoomDetails(id)}
                  onOpenCreateRoomModal={() => setRoomModalOpen(true)}
                  onResetDemo={handleResetDemo}
                  onReopenMonth={handleReopenMonth}
                  onUpdateRoomName={handleUpdateRoomName}
                  onExitRoom={handleExitRoom}
                />
              )}
        </main>
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        members={members}
        currentMember={currentMember}
      />

      {/* QR Payment Modal */}
      <QrPaymentModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setActiveSettlementForQr(null);
        }}
        settlement={activeSettlementForQr}
        onMarkPaid={(id, status) => handleToggleSettlementStatus(id, status)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
      />

      {/* Create / Join Room Modal */}
      <RoomCreateJoinModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onResetDemo={handleResetDemo}
      />
    </div>
  );
}
