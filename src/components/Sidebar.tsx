/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Award, Compass, LayoutDashboard, Sliders, Users, FileSpreadsheet, Percent, CheckSquare, Sparkles, Clipboard } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentTab: string;
  userRole: Role;
  onChangeTab: (tab: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentTab, userRole, onChangeTab, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Statistik & Ringkasan Seleksi'
    },
    {
      id: 'kriteria',
      label: 'Kelola Kriteria',
      icon: Percent,
      description: 'Bobot & Parameter Penilaian'
    },
    {
      id: 'peserta',
      label: 'Kelola Peserta',
      icon: Users,
      description: 'Daftar Calon Peserta Seleksi'
    },
    {
      id: 'nilai',
      label: 'Input Nilai',
      icon: FileSpreadsheet,
      description: 'Koleksi Skor Mentah Peserta'
    },
    {
      id: 'proses',
      label: 'Proses & Pemenang',
      icon: Sparkles,
      description: 'Kalkulasi SAW & Keputusan Final'
    }
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main left side menu drawer / container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-45 w-72 bg-slate-900 text-slate-400 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand Area */}
        <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-sans font-bold text-slate-100 text-sm leading-none tracking-tight">PrestaSelect SPK</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">SAW Decision Engine</p>
            </div>
          </div>
          
          {onClose && (
            <button
              id="sidebar-close-btn"
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* User context quick profile summary */}
        <div className="p-4 mx-4 my-2.5 bg-slate-800/45 border border-slate-800/80 rounded-xl">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Akses Terotorisasi</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
            <p className="text-xs font-bold text-slate-200 capitalize">
              {userRole === 'admin' ? 'Administrator' : 'Guru Penilai'}
            </p>
          </div>
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <button
                id={`sidebar-tab-${item.id}`}
                key={item.id}
                onClick={() => {
                  onChangeTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-left pointer-events-auto cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold'
                    : 'hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}`} />
                <div>
                  <span className="block text-xs uppercase font-bold tracking-wider leading-none">
                    {item.label}
                  </span>
                  <span className={`block text-[10px] font-medium mt-0.5 ${isActive ? 'text-indigo-100/80' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 text-center">
          <p>Status: OK</p>
          <p className="mt-0.5 text-[9px] text-slate-600">PrestaSelect v1.0.0-Beta</p>
        </div>
      </aside>
    </>
  );
}
