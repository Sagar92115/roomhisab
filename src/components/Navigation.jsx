import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Calculator,
  Users,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, onOpenAddExpense }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'hisaab', label: 'Hisaab', icon: Calculator, badge: 'Core' },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION (Fixed at bottom on mobile screens)
         ===================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg safe-bottom">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition duration-150 ${
                  isActive
                    ? 'text-brand-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-5 h-1 bg-brand-600 rounded-full" />
                )}
              </button>
            );
          })}
          {/* Settings tab on mobile */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'settings'
                ? 'text-brand-700 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className={`w-5 h-5 transition ${activeTab === 'settings' ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>
        </div>
      </nav>

      {/* =====================================================================
          DESKTOP SIDEBAR NAVIGATION (Visible on md+ screens)
         ===================================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen shrink-0 p-4 sticky top-0 h-screen justify-between">
        <div>
          {/* App Logo & Title */}
          <div className="flex items-center gap-3 px-3 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/30">
              ₹
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>RoomHisaab</span>
                <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">v1.0</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Bachelors' Expense Hub</p>
            </div>
          </div>

          {/* Quick Add Expense Action */}
          <div className="px-2 mb-6">
            <button
              onClick={onOpenAddExpense}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-sm shadow-brand-600/30 hover:shadow-brand-600/40 active:scale-[0.99] transition text-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Daily Expense</span>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1 px-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 font-semibold border-l-4 border-brand-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[11px] font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & principle quote */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-0.5">Room Rule</p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            All expenses divided equally among all roommates. Zero notebook chaos.
          </p>
        </div>
      </aside>
    </>
  );
}
