/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Lock, Mail, ShieldAlert, User, ArrowLeft, Key, Sparkles } from 'lucide-react';
import { UserSession, Role } from '../types';
import { supabase, isUsingSupabase } from '../lib/db';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onNavigate: (path: string) => void;
}

export default function LoginPage({ onLoginSuccess, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick Account Auto-fill helpers to improve AI Studio feedback
  const handleAutoFill = () => {
    setEmail('admin@gmail.com');
    setPassword('admin123');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    // Fast-path local demo credential bypass to eliminate any network/Supabase lag (ALWAY enabled for demo convenience)
    if (
      (trimmedEmail === 'admin@example.com' || trimmedEmail === 'admin@gmail.com') && 
      password === 'admin123'
    ) {
      setTimeout(() => {
        const adminSession: UserSession = {
          email: trimmedEmail,
          role: 'admin',
          name: 'Administrator (Sistem)'
        };
        localStorage.setItem('presta_session', JSON.stringify(adminSession));
        onLoginSuccess(adminSession);
        onNavigate('/app');
        setLoading(false);
      }, 150);
      return;
    }

    if (
      (trimmedEmail === 'guru@example.com' && password === 'guru123') ||
      (trimmedEmail === 'guru@gmail.com' && password === 'gururpl')
    ) {
      setTimeout(() => {
        const guruSession: UserSession = {
          email: trimmedEmail,
          role: 'guru',
          name: 'Dewan Guru / Penilai'
        };
        localStorage.setItem('presta_session', JSON.stringify(guruSession));
        onLoginSuccess(guruSession);
        onNavigate('/app');
        setLoading(false);
      }, 150);
      return;
    }

    if (isUsingSupabase && supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (authError) {
          setError(`Gagal masuk ke Supabase: ${authError.message}`);
          setLoading(false);
          return;
        }

        if (data && data.user) {
          // Determine the role dynamically based on metdata role or email pattern
          let userRole: Role = 'admin';
          const metaRole = data.user.user_metadata?.role?.toLowerCase();
          const emailLower = (data.user.email || trimmedEmail).toLowerCase();
          
          if (metaRole === 'guru' || metaRole === 'teacher' || emailLower.includes('guru')) {
            userRole = 'guru';
          }

          const adminSession: UserSession = {
            email: data.user.email || trimmedEmail,
            role: userRole,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || (userRole === 'admin' ? 'Administrator' : 'Dewan Guru')
          };
          localStorage.setItem('presta_session', JSON.stringify(adminSession));
          onLoginSuccess(adminSession);
          onNavigate('/app');
        } else {
          setError('Gagal mendapatkan rincian sesi dari Supabase.');
        }
      } catch (err: any) {
        setError(`Kesalahan koneksi atau kegagalan sistem: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline fallback: any other credentials will fail fast (150ms)
      setTimeout(() => {
        setError('Kombinasi email atau kata sandi salah. Silakan periksa kembali kredensial Anda.');
        setLoading(false);
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative font-sans">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          id="login-back-home"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-all cursor-pointer font-semibold bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Kembali ke Beranda
        </button>
      </div>

      {/* Grid wrapper */}
      <div className="grid lg:grid-cols-12 w-full min-h-screen">
        
        {/* Column Left (Promo banner side) - Hidden on mobile, visible on lg screens */}
        <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
          {/* Ambient Glow */}
          <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-650/30 rounded-full blur-3xl opacity-80" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-600/20 rounded-full blur-3xl opacity-60" />
          
          {/* Decorative Grid Line Graphics */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:28px_28px]" />

          {/* Logo Area */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 border border-indigo-505/30">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg tracking-tight text-white block">PrestaSelect</span>
              <span className="text-[10px] font-mono tracking-wider text-indigo-400 font-bold uppercase block -mt-0.5">SPK Seleksi Lomba</span>
            </div>
          </div>

          {/* Slogan */}
          <div className="my-auto relative z-10 space-y-6">
            <span className="bg-indigo-950/80 text-indigo-300 font-bold font-mono tracking-wider text-[10px] uppercase px-3 py-1.5 rounded-lg border border-indigo-900 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Sains & Keputusan Objektif
            </span>
            <h3 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white leading-[1.15]">
              Normalisasi Terbaik <br />
              untuk Potensi Hebat.
            </h3>
            <p className="text-slate-405 text-xs sm:text-sm leading-relaxed max-w-sm font-sans">
              Menghilangkan keraguan subjektif melalui implementasi hitungan matematis <strong>Simple Additive Weighting (SAW)</strong>. Penanggung jawab berhak memandu kriteria benefit/cost secara transparan.
            </p>
          </div>

          {/* Footer of Left Column */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>PrestaSelect Platform Suite</span>
            <span className="text-slate-600">Ver. 2026</span>
          </div>
        </div>

        {/* Column Right (Form Login) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-50/50 sm:p-12 relative animate-fadeIn">
          
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              {/* Show logo on mobile only */}
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto lg:mx-0 mb-4 lg:hidden">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                Masuk Administrator
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-1.5 font-sans">
                Gunakan kredensial yang Anda miliki untuk mengakses kendali SPK secara penuh.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8"
            >
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="login-input-email"
                      type="email"
                      required
                      placeholder="Masukkan alamat email terdaftar"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl py-3 pl-10.5 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-sans text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide">
                    Kata Sandi Akun
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="login-input-password"
                      type="password"
                      required
                      placeholder="Masukkan sandi minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl py-3 pl-10.5 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-sans text-slate-800"
                    />
                  </div>
                </div>

                <button
                  id="login-btn-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Masuk'
                  )}
                </button>
              </form>




            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
