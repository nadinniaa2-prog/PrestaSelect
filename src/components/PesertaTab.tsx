/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Peserta } from '../types';
import { Plus, Edit2, Trash2, Search, Users, Clipboard, Sparkles, BookOpen, UserCheck, UserPlus, ShieldAlert, Award } from 'lucide-react';

interface PesertaTabProps {
  peserta: Peserta[];
  onSavePeserta: (item: Peserta) => Promise<void>;
  onDeletePeserta: (id: string) => Promise<void>;
  userRole: string;
}

export default function PesertaTab({ peserta, onSavePeserta, onDeletePeserta, userRole }: PesertaTabProps) {
  const isAdmin = userRole === 'admin';

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for forms
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [nisnNip, setNisnNip] = useState('');
  const [instansi, setInstansi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredPeserta = peserta.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.nama.toLowerCase().includes(term) ||
      p.nisn_nip.includes(term) ||
      p.instansi.toLowerCase().includes(term)
    );
  });

  // Sort participants so those who are marked as "Lolos" (selected/final) appear at the very top of the list
  const sortedPeserta = [...filteredPeserta].sort((a, b) => {
    const aLolos = a.status_keputusan === 'lolos' ? 1 : 0;
    const bLolos = b.status_keputusan === 'lolos' ? 1 : 0;
    return bLolos - aLolos; // Lolos/chosen participants (1) come before others (0)
  });

  const startEdit = (p: Peserta) => {
    if (!isAdmin) return;
    setEditingId(p.id);
    setNama(p.nama);
    setNisnNip(p.nisn_nip);
    setInstansi(p.instansi);
    setDeskripsi(p.deskripsi);
    setShowAddForm(false);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNama('');
    setNisnNip('');
    setInstansi('');
    setDeskripsi('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNama = nama.trim();
    const trimmedNip = nisnNip.trim();
    const trimmedInstansi = instansi.trim();

    if (!trimmedNama || !trimmedNip || !trimmedInstansi) {
      setErrorMsg('Semua kolom form wajib diisi kecuali deskripsi tambahan.');
      return;
    }

    // Check duplicate NISN/NIP (only if creating a new one or modifying)
    const duplicate = peserta.find(
      p => p.id !== (editingId || 'NEW') && p.nisn_nip === trimmedNip
    );
    if (duplicate) {
      setErrorMsg(`No Induk / NISN / NIP "${trimmedNip}" sudah digunakan oleh peserta lain (${duplicate.nama}).`);
      return;
    }

    let finalId = editingId;
    if (!finalId) {
      // Find max number in ID (e.g. P1, P2)
      const maxNum = peserta.reduce((max, item) => {
        const match = item.id.match(/^P(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      finalId = `P${maxNum + 1}`;
    }

    // Merge existing status atau parameters if editing
    const currentItem = peserta.find(p => p.id === finalId);

    const newPeserta: Peserta = {
      id: finalId,
      nama: trimmedNama,
      nisn_nip: trimmedNip,
      instansi: trimmedInstansi,
      deskripsi: deskripsi.trim(),
      status_keputusan: currentItem ? currentItem.status_keputusan : null,
      selected_at: currentItem ? currentItem.selected_at : undefined,
    };

    try {
      await onSavePeserta(newPeserta);
      cancelEdit();
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data peserta.');
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id: string) => {
    try {
      await onDeletePeserta(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus data peserta.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Visual Statistics Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Pendaftar Terdaftar</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">{peserta.length}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Siswa & Guru Terdaftar</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Instansi / Sekolah Asal</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">
              {new Set(peserta.map(p => p.instansi.split(' - ')[0].trim())).size}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Lembaga Terverifikasi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Pemenang Lolos Seleksi</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">
              {peserta.filter(p => p.status_keputusan === 'lolos').length}
            </p>
            <p className="text-[10px] mt-1 text-emerald-600 font-bold font-mono">Tunjuk Finalis SAW</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      {/* Search and Tool Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            id="peserta-search-input"
            type="text"
            placeholder="Cari peserta, NISN/NIP, atau instansi sekolah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
          />
        </div>

        {isAdmin && !showAddForm && !editingId && (
          <button
            id="peserta-add-btn"
            onClick={() => {
              setShowAddForm(true);
              setErrorMsg(null);
            }}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Peserta Seleksi
          </button>
        )}
      </div>

      {/* Editor or Creation Form */}
      {(showAddForm || editingId) && isAdmin && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">
              {editingId ? `Ubah Data Peserta: ${editingId}` : 'Daftarkan Peserta Penilaian Baru'}
            </h4>
            <button
              id="peserta-form-cancel"
              type="button"
              onClick={cancelEdit}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Batal
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl font-medium flex gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-12 gap-4">
            
            {/* Nama Lengkap */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap Peserta (Gelar/Status)</label>
              <input
                id="peserta-input-nama"
                type="text"
                required
                placeholder="Contoh: Sarah Azhari (Siswa) atau Ahmad Fauzi, S.Pd"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* NISN / NIP */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Induk Siswa (NISN) / Pegawai (NIP)</label>
              <input
                id="peserta-input-nip"
                type="text"
                required
                placeholder="Contoh: 0054839201 atau 19851122..."
                value={nisnNip}
                onChange={(e) => setNisnNip(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Instansi / Kelas */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">Instansi Sekolah / Jenjang & Kelas</label>
              <input
                id="peserta-input-instansi"
                type="text"
                required
                placeholder="Contoh: SMAN 1 Jakarta Barat - Kelas XII MIPA 4"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keterangan / Deskripsi Prestasi / Riwayat Singkat</label>
              <textarea
                id="peserta-input-deskripsi"
                rows={3}
                placeholder="Ceritakan singkat latar belakang atau prestasi miring yang dimiliki oleh peserta ini..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-sans"
              />
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono">
              *Peserta baru otomatis didaftarkan ke status keputusan "Belum Ditentukan"
            </span>
            <div className="flex gap-2">
              <button
                id="peserta-form-close"
                type="button"
                onClick={() => {
                  cancelEdit();
                  setShowAddForm(false);
                }}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                id="peserta-form-submit"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm cursor-pointer"
              >
                {editingId ? 'Simpan Model Peserta' : 'Daftarkan Peserta'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Directory Contestants View */}
      <div className="grid md:grid-cols-2 gap-4">
        {sortedPeserta.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-5 shadow-sm transition-all relative flex flex-col justify-between min-h-48 group">
            <div>
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center border border-slate-200 font-bold font-mono text-xs">
                    {p.id}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm font-sans">{p.nama}</h5>
                    <p className="text-[10px] font-mono text-indigo-600 mt-0.5 font-bold uppercase tracking-wider">
                      NISN/NIP: {p.nisn_nip}
                    </p>
                  </div>
                </div>

                {/* Status Lolos Badge / Indicator */}
                {p.status_keputusan === 'lolos' ? (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-1 rounded-full animate-pulse">
                    🏆 Terpilih Final
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-medium tracking-wide bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full">
                    Kandidat
                  </span>
                )}
              </div>

              {/* Bio Details */}
              <div className="mt-4 text-xs text-slate-600 space-y-2">
                <p className="flex items-center gap-1.5 font-medium text-slate-850">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.instansi}</span>
                </p>
                {p.deskripsi && (
                  <p className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-500 break-words text-[11px] leading-relaxed">
                    "{p.deskripsi}"
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons inside cards (only for Admin) */}
            {isAdmin && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4 h-9">
                {deleteConfirmId === p.id ? (
                  <div className="flex items-center gap-1.5 animation-fade-in">
                    <span className="text-[10px] text-rose-600 font-bold font-mono uppercase tracking-wider animate-pulse">Yakin hapus?</span>
                    <button
                      id={`peserta-btn-delete-confirm-${p.id}`}
                      onClick={() => executeDelete(p.id)}
                      className="p-1 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold tracking-wider uppercase font-mono rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      id={`peserta-btn-delete-cancel-${p.id}`}
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold tracking-wider uppercase font-mono border border-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      id={`peserta-btn-edit-${p.id}`}
                      onClick={() => startEdit(p)}
                      className="p-1 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase font-mono border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      id={`peserta-btn-delete-${p.id}`}
                      onClick={() => handleDelete(p.id)}
                      className="p-1 px-3 bg-rose-50 hover:bg-rose-100/80 text-rose-600 text-[10px] font-bold tracking-wider uppercase font-mono border border-rose-150 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredPeserta.length === 0 && (
          <div className="col-span-2 bg-white border border-dashed border-slate-200 py-16 text-center text-slate-400 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-semibold">Tidak ada peserta yang cocok dengan pencarian Anda.</p>
            <p className="text-[11px] text-slate-400 font-mono">Daftarkan peserta baru atau modifikasi kueri Anda.</p>
          </div>
        )}
      </div>

    </div>
  );
}
