/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Kriteria, CriteriaType } from '../types';
import { Percent, ShieldAlert, Plus, Edit2, Trash2, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';

interface KriteriaTabProps {
  kriteria: Kriteria[];
  onSaveKriteria: (item: Kriteria) => Promise<void>;
  onDeleteKriteria: (id: string) => Promise<void>;
  onReset: () => Promise<void>;
  userRole: string;
}

export default function KriteriaTab({ kriteria, onSaveKriteria, onDeleteKriteria, onReset, userRole }: KriteriaTabProps) {
  const isAdmin = userRole === 'admin';

  // State managers
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [bobot, setBobot] = useState<number>(20);
  const [jenis, setJenis] = useState<CriteriaType>('benefit');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Compute total weights
  const totalWeight = kriteria.reduce((sum, item) => sum + item.bobot, 0);

  const startEdit = (item: Kriteria) => {
    if (!isAdmin) return;
    setEditingId(item.id);
    setNama(item.nama);
    setBobot(item.bobot);
    setJenis(item.jenis);
    setShowAddForm(false);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNama('');
    setBobot(20);
    setJenis('benefit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNama = nama.trim();
    if (!trimmedNama) {
      setErrorMsg('Nama kriteria tidak boleh kosong.');
      return;
    }

    if (bobot <= 0 || bobot > 100) {
      setErrorMsg('Bobot kriteria harus bernilai diantara 1% hingga 100%.');
      return;
    }

    // Check potential overflow
    const otherWeights = kriteria
      .filter(item => item.id !== (editingId || 'NEW'))
      .reduce((sum, item) => sum + item.bobot, 0);

    if (otherWeights + bobot > 100) {
      setErrorMsg(`Total bobot keseluruhan tidak boleh melebihi 100%. (Sisa bobot tersedia: ${100 - otherWeights}%)`);
      return;
    }

    // Generate unique ID for new item
    let finalId = editingId;
    if (!finalId) {
      // Find maximum index C
      const maxNum = kriteria.reduce((max, item) => {
        const match = item.id.match(/^C(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      finalId = `C${maxNum + 1}`;
    }

    const newItem: Kriteria = {
      id: finalId,
      nama: trimmedNama,
      bobot,
      jenis,
    };

    try {
      await onSaveKriteria(newItem);
      cancelEdit();
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kriteria.');
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id: string) => {
    try {
      await onDeleteKriteria(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus kriteria.');
    }
  };

  const executeReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
      setShowResetConfirm(false);
    } catch (err: any) {
      setErrorMsg('Gagal melakukan reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Alert status block for weights requirement */}
      <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm leading-none ${
            totalWeight === 100
              ? 'bg-emerald-50 border border-emerald-150 text-emerald-700'
              : 'bg-amber-50 border border-amber-150 text-amber-700 animate-pulse'
          }`}>
            {totalWeight}%
          </div>
          <div>
            <p className="text-slate-800 font-bold">Total Bobot Kriteria Saat Ini</p>
            <p className="text-slate-500 font-mono text-[10px] mt-0.5">
              {totalWeight === 100 
                ? 'Sempurna! Akumulasi bobot sudah tepat 100% untuk formula SAW.' 
                : `Akumulasi bobot kriteria saat ini adalah ${totalWeight}%. Harus tepat 100% untuk akurasi perhitungan.`
              }
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {!showAddForm && !editingId && (
              <button
                id="kriteria-add-toggle"
                onClick={() => {
                  setShowAddForm(true);
                  setErrorMsg(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Kriteria
              </button>
            )}

            {showResetConfirm ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-150 p-1 px-3 rounded-xl animate-fade-in shrink-0">
                <span className="text-[11px] text-rose-700 font-bold font-sans">Mulai ulang database awal?</span>
                <button
                  id="kriteria-reset-confirm"
                  onClick={executeReset}
                  disabled={isResetting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                >
                  {isResetting ? 'Mengulang...' : 'Ya, Reset'}
                </button>
                <button
                  id="kriteria-reset-cancel"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                id="kriteria-reset-db"
                onClick={() => setShowResetConfirm(true)}
                disabled={isResetting}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                Reset Seeding
              </button>
            )}
          </div>
        )}
      </div>

      {/* Weight Budget segmented progress bar */}
      {kriteria.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Distribusi Alokasi Bobot Seleksi</span>
            <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {kriteria.length} Kriteria Aktif
            </span>
          </div>

          {/* Segmented bar */}
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex border border-slate-200/50">
            {kriteria.map((item, index) => {
              const colors = [
                'bg-indigo-600', 'bg-sky-500', 'bg-emerald-500', 
                'bg-amber-500', 'bg-fuchsia-600', 'bg-teal-500', 
                'bg-purple-600', 'bg-rose-500'
              ];
              const color = colors[index % colors.length];
              return (
                <div 
                  key={item.id}
                  className={`${color} h-full transition-all cursor-help relative group`}
                  style={{ width: `${item.bobot}%` }}
                  title={`${item.id} - ${item.nama}: ${item.bobot}%`}
                />
              );
            })}
            {totalWeight < 100 && (
              <div 
                className="bg-amber-100 h-full border-l border-dashed border-amber-300 animate-pulse text-[8px] text-amber-700 font-mono flex items-center justify-center"
                style={{ width: `${100 - totalWeight}%` }}
                title={`Sisa Kuota Bobot: ${100 - totalWeight}%`}
              >
                {100 - totalWeight}% Sisa
              </div>
            )}
          </div>

          {/* Legend labels row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {kriteria.map((item, index) => {
              const colors = [
                'bg-indigo-600', 'bg-sky-500', 'bg-emerald-500', 
                'bg-amber-500', 'bg-fuchsia-600', 'bg-teal-500', 
                'bg-purple-600', 'bg-rose-500'
              ];
              const color = colors[index % colors.length];
              return (
                <div key={item.id} className="flex items-center gap-1.5 text-[10px] font-sans">
                  <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                  <span className="font-bold text-slate-800 font-mono">{item.id}:</span>
                  <span className="text-slate-500 truncate max-w-44">{item.nama}</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded text-[9px]">
                    {item.bobot}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor & Creation Form */}
      {(showAddForm || editingId) && isAdmin && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">
              {editingId ? `Edit Parameter Kriteria: ${editingId}` : 'Tambah Kriteria Penilaian Baru'}
            </h4>
            <button
              id="kriteria-form-cancel"
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
            {/* Name */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Kriteria</label>
              <input
                id="kriteria-input-nama"
                type="text"
                required
                placeholder="Contoh: Kompetensi Sikap & Kepribadian"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Weight */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bobot Nilai (%)</label>
              <input
                id="kriteria-input-bobot"
                type="number"
                required
                min="1"
                max="100"
                value={bobot}
                onChange={(e) => setBobot(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Type Benefit / Cost */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Kriteria</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  id="kriteria-type-benefit"
                  type="button"
                  onClick={() => setJenis('benefit')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                    jenis === 'benefit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Benefit
                </button>
                <button
                  id="kriteria-type-cost"
                  type="button"
                  onClick={() => setJenis('cost')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                    jenis === 'cost' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cost
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase">
              *Benefit = Makin besar makin baik. Cost = Makin kecil makin baik.
            </span>
            <div className="flex gap-2">
              <button
                id="kriteria-form-dismiss"
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
                id="kriteria-form-submit"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm cursor-pointer"
              >
                {editingId ? 'Simpan Perubahan' : 'Tambahkan Kriteria'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Criteria Table List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-sans font-bold text-slate-900 text-sm">Daftar Kriteria Penilaian Terstandarisasi</h4>
          <span className="text-[10px] font-mono text-slate-500 bg-white py-1 px-2.5 border border-slate-150 rounded-lg">
            {kriteria.length} Kriteria Terkonfigurasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Nama Kriteria</th>
                <th className="py-3 px-6 text-center">Bobot Relatif</th>
                <th className="py-3 px-6">Jenis Kriteria</th>
                <th className="py-3 px-6">Formulasi Ideal</th>
                {isAdmin && <th className="py-3 px-6 text-center">Aksi / Kontrol</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {kriteria.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">{item.id}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{item.nama}</td>
                  <td className="py-3.5 px-6 text-center font-bold text-slate-800 font-mono bg-indigo-50/30">
                    {item.bobot}%
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase ${
                      item.jenis === 'benefit'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                        : 'bg-amber-50 text-amber-700 border border-amber-150'
                    }`}>
                      <ArrowRightLeft className="w-3 h-3" />
                      {item.jenis}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[10px] text-slate-500">
                    {item.jenis === 'benefit' 
                      ? 'Skor / Max Skor (Makin tinggi makin optimal)' 
                      : 'Min Skor / Skor (Makin rendah makin optimal)'
                    }
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-6">
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center justify-center gap-1.5 animate-fade-in">
                          <span className="text-[9px] text-rose-600 font-bold font-mono uppercase bg-rose-50 px-1 py-0.5 rounded">Hapus?</span>
                          <button
                            id={`kriteria-btn-delete-confirm-${item.id}`}
                            onClick={() => executeDelete(item.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            id={`kriteria-btn-delete-cancel-${item.id}`}
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-1 px-2 rounded-lg transition-all cursor-pointer border border-slate-200"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`kriteria-btn-edit-${item.id}`}
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ubah Bobot"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`kriteria-btn-delete-${item.id}`}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kriteria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {kriteria.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada kriteria penilaian yang dikonfigurasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
