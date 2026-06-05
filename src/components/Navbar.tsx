/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogOut, User, Menu, Database, Cloud } from 'lucide-react';
import { UserSession } from '../types';
import { isUsingSupabase } from '../lib/db';

interface NavbarProps {
  session: UserSession | null;
  currentTab: string;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export default function Navbar({ session, currentTab, onLogout, onToggleSidebar }: NavbarProps) {
  // Map tab keys to nice Indonesian title names
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Utama';
      case 'kriteria': return 'Kelola Kriteria & Parameter';
      case 'peserta': return 'Kelola Data Peserta Seleksi';
      case 'nilai': return 'Input Nilai Peserta';
      case 'proses': return 'Perhitungan SPK SAW & Pengambilan Keputusan';
      default: return 'Aplikasi Seleksi Lomba';
    }
  };

  return (
    <header className="sticky top-0 z-35 bg-white border-b border-slate-200">
      <div className="mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Mobile sidebar toggle & title */}
        <div className="flex items-center gap-4">
          <button
            id="navbar-toggle-sidebar"
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden pointer-events-auto cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
              {getTabTitle(currentTab)}
            </h1>
            <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider hidden sm:block">
              PrestaSelect / Panel / {currentTab}
            </span>
          </div>
        </div>

        {/* Right Side: Account state layout & Logout */}
        <div className="flex items-center gap-4">
          {/* Supabase Status Indicator */}
          <div className="flex items-center gap-1.5 hidden md:flex text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-slate-150 bg-slate-50">
            {isUsingSupabase ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-indigo-700">Supabase Connected</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-600">LocalDB Fallback</span>
              </>
            )}
          </div>

          {/* User Info & Badge */}
          {session && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {session.name}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    session.role === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-teal-500 text-white'
                  }`}>
                    {session.role === 'admin' ? 'Admin' : 'Guru'}
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-inner">
                <User className="w-4.5 h-4.5" />
              </div>
            </div>
          )}

          {/* Logout Button in Upper Right */}
          <button
            id="navbar-logout-btn"
            onClick={onLogout}
            title="Keluar dari Akun"
            className="flex items-center justify-center p-2.5 rounded-xl border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span className="text-xs font-semibold ml-1.5 hidden lg:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
