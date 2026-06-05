/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserSession, Kriteria, Peserta, Nilai } from './types';
import { db, getStoredSession } from './lib/db';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import KriteriaTab from './components/KriteriaTab';
import PesertaTab from './components/PesertaTab';
import NilaiTab from './components/NilaiTab';
import InstrumenTab from './components/InstrumenTab';
import ProsesTab from './components/ProsesTab';

export default function App() {
  // Routes & Session states
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [session, setSession] = useState<UserSession | null>(getStoredSession());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Database core state
  const [kriteria, setKriteria] = useState<Kriteria[]>(() => db.getCachedKriteria());
  const [peserta, setPeserta] = useState<Peserta[]>(() => db.getCachedPeserta());
  const [nilai, setNilai] = useState<Nilai[]>(() => db.getCachedNilai());
  
  // App initialization & synchronization state
  const [loading, setLoading] = useState(false);

  // Sync data from database/local storage
  const syncDatabaseState = async () => {
    try {
      const [kRes, pRes, nRes] = await Promise.all([
        db.fetchKriteria(),
        db.fetchPeserta(),
        db.fetchNilai(),
      ]);
      setKriteria(kRes);
      setPeserta(pRes);
      setNilai(nRes);
    } catch (err) {
      console.error('Failed to synchronize database state models:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & URL Hash routing handler
  useEffect(() => {
    syncDatabaseState();

    // Basic hash-based router listener to maintain refresh states elegantly in the iframe preview
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/app')) {
        // Guarantee user is logged in
        const stored = getStoredSession();
        if (stored) {
          setSession(stored);
          setCurrentPath('/app');
          // Parse sub-tab from hash if present, e.g., #/app/kriteria
          const parts = hash.split('/');
          if (parts[2]) {
            setCurrentTab(parts[2]);
          } else {
            setCurrentTab('dashboard');
          }
        } else {
          window.location.hash = '#/login';
          setCurrentPath('/login');
        }
      } else if (hash === '#/login') {
        setCurrentPath('/login');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial parse of URL hashes on bootstrap
    const initialHash = window.location.hash;
    if (initialHash) {
      handleHashChange();
    } else {
      // Sync state back to index
      const stored = getStoredSession();
      if (stored) {
        setSession(stored);
        setCurrentPath('/app');
        window.location.hash = '#/app';
      } else {
        setCurrentPath('/');
        window.location.hash = '#/';
      }
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple navigate function
  const navigateTo = (path: string) => {
    if (path.startsWith('/app')) {
      const stored = getStoredSession();
      if (!stored) {
        setCurrentPath('/login');
        window.location.hash = '#/login';
        return;
      }
      
      setCurrentPath('/app');
      const parts = path.split('/');
      const selectedTab = parts[2] || 'dashboard';
      setCurrentTab(selectedTab);
      window.location.hash = `#/app/${selectedTab}`;
    } else {
      setCurrentPath(path);
      window.location.hash = `#${path}`;
    }
  };

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    navigateTo('/app/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('presta_session');
    setSession(null);
    navigateTo('/');
  };

  // Save changes to database
  const handleSaveKriteria = async (item: Kriteria) => {
    await db.saveKriteriaItem(item);
    await syncDatabaseState();
  };

  const handleDeleteKriteria = async (id: string) => {
    await db.deleteKriteriaItem(id);
    await syncDatabaseState();
  };

  const handleSavePeserta = async (item: Peserta) => {
    await db.savePesertaItem(item);
    await syncDatabaseState();
  };

  const handleDeletePeserta = async (id: string) => {
    await db.deletePesertaItem(id);
    await syncDatabaseState();
  };

  const handleSaveNilai = async (items: Nilai[]) => {
    await db.saveMultipleNilai(items);
    await syncDatabaseState();
  };

  const handleDecideWinner = async (pesertaId: string, status: 'lolos' | 'tidak_lolos' | null) => {
    if (!pesertaId) {
      await syncDatabaseState();
      return;
    }
    const item = peserta.find(p => p.id === pesertaId);
    if (item) {
      const updatedItem: Peserta = {
        ...item,
        status_keputusan: status,
        selected_at: status === 'lolos' ? new Date().toISOString() : undefined
      };
      await db.savePesertaItem(updatedItem);
      await syncDatabaseState();
    }
  };

  const handleFactoryReset = async () => {
    await db.resetDatabase();
    await syncDatabaseState();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-indigo-200 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wide">Memuat Enjin PrestaSelect...</p>
      </div>
    );
  }

  // RENDER SELECTION ROUTER SWITCH

  if (currentPath === '/login') {
    return (
      <LoginPage 
        onLoginSuccess={handleLogin} 
        onNavigate={navigateTo} 
      />
    );
  }

  if (currentPath === '/') {
    return (
      <LandingPage 
        onNavigate={navigateTo} 
      />
    );
  }

  // APP WORKSPACE: Dashboard, criteria, participants, scores, SAW processes
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Side Menu (Left sidebar) */}
      <Sidebar
        currentTab={currentTab}
        userRole={session?.role || 'admin'}
        onChangeTab={(tab) => navigateTo(`/app/${tab}`)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Frame container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Upper Right Action Bar Navbar & Logout */}
        <Navbar
          session={session}
          currentTab={currentTab}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dynamic inner content workspace viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardTab
              kriteria={kriteria}
              peserta={peserta}
              nilai={nilai}
              onNavigateTab={(tab) => navigateTo(`/app/${tab}`)}
              userRole={session?.role || 'admin'}
            />
          )}

          {currentTab === 'kriteria' && (
            <KriteriaTab
              kriteria={kriteria}
              onSaveKriteria={handleSaveKriteria}
              onDeleteKriteria={handleDeleteKriteria}
              onReset={handleFactoryReset}
              userRole={session?.role || 'admin'}
            />
          )}

          {currentTab === 'peserta' && (
            <PesertaTab
              peserta={peserta}
              onSavePeserta={handleSavePeserta}
              onDeletePeserta={handleDeletePeserta}
              userRole={session?.role || 'admin'}
            />
          )}

          {currentTab === 'instrumen' && (
            <InstrumenTab
              kriteria={kriteria}
              peserta={peserta}
              nilai={nilai}
              onSaveNilai={handleSaveNilai}
              userRole={session?.role || 'admin'}
            />
          )}

          {currentTab === 'nilai' && (
            <NilaiTab
              kriteria={kriteria}
              peserta={peserta}
              nilai={nilai}
              onSaveNilai={handleSaveNilai}
              userRole={session?.role || 'admin'}
            />
          )}

          {currentTab === 'proses' && (
            <ProsesTab
              kriteria={kriteria}
              peserta={peserta}
              nilai={nilai}
              onDecideWinner={handleDecideWinner}
              userRole={session?.role || 'admin'}
            />
          )}
        </main>
      </div>

    </div>
  );
}
