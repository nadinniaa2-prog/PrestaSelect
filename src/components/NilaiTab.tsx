/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Kriteria, Peserta, Nilai } from '../types';
import { Save, Clipboard, Star, CheckSquare, Sparkles, Database, HelpCircle, AlertCircle, Search } from 'lucide-react';

interface NilaiTabProps {
  kriteria: Kriteria[];
  peserta: Peserta[];
  nilai: Nilai[];
  onSaveNilai: (items: Nilai[]) => Promise<void>;
  userRole: string;
}

export default function NilaiTab({ kriteria, peserta, nilai, onSaveNilai, userRole }: NilaiTabProps) {
  const isAdmin = userRole === 'admin';

  // Selection state
  const [selectedPesertaId, setSelectedPesertaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Temporary score fields dictionary: criterion_id -> score
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Sync state when selected user changes
  useEffect(() => {
    if (selectedPesertaId) {
      // Find matching scores already in database
      const userScores: Record<string, number> = {};
      kriteria.forEach(k => {
        const found = nilai.find(n => n.peserta_id === selectedPesertaId && n.kriteria_id === k.id);
        userScores[k.id] = found ? found.skor : 80; // Default score is 80 if not defined
      });
      setScores(userScores);
      setStatusMessage(null);
    } else {
      setScores({});
    }
  }, [selectedPesertaId, kriteria, nilai]);

  // Set selected default participant if exists
  useEffect(() => {
    if (peserta.length > 0 && !selectedPesertaId) {
      setSelectedPesertaId(peserta[0].id);
    }
  }, [peserta]);

  const handleScoreChange = (kriteriaId: string, value: number) => {
    if (!isAdmin) return;
    
    // Bounds check
    let scoreVal = Math.max(0, Math.min(100, value));
    setScores(prev => ({
      ...prev,
      [kriteriaId]: scoreVal
    }));
  };

  const handleSaveAllScores = async () => {
    if (!isAdmin) return;
    if (!selectedPesertaId) return;

    setSaving(true);
    setStatusMessage(null);

    // Formulate scores payload
    const payload: Nilai[] = kriteria.map(k => {
      const scoreId = `N_${selectedPesertaId}_${k.id}`;
      return {
        id: scoreId,
        peserta_id: selectedPesertaId,
        kriteria_id: k.id,
        skor: scores[k.id] !== undefined ? scores[k.id] : 80
      };
    });

    try {
      await onSaveNilai(payload);
      setStatusMessage({ type: 'success', text: `Berhasil menyimpan ${payload.length} nilai kriteria peserta!` });
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message || 'Gagal menyimpan nilai.' });
    } finally {
      setSaving(false);
    }
  };

  const currentPeserta = peserta.find(p => p.id === selectedPesertaId);

  // Filter participants based on search keyword
  const filteredPeserta = peserta.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.nama.toLowerCase().includes(term) ||
      (p.nisn_nip && p.nisn_nip.toLowerCase().includes(term)) ||
      (p.instansi && p.instansi.toLowerCase().includes(term))
    );
  });

  // Statistics counters
  const totalCompletedScoringCount = peserta.filter(p => {
    const pScores = nilai.filter(n => n.peserta_id === p.id);
    return pScores.length >= kriteria.length && kriteria.length > 0;
  }).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Status Penilaian Kolektif Mandiri</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {totalCompletedScoringCount} dari {peserta.length} peserta telah selesai diinput skor kriteria sepenuhnya.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 flex gap-3 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping" />
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Admin Input Mode</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left pane: Participant Selector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
              Pilih Peserta Seleksi
            </label>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Klik pada baris nama peserta di bawah untuk memuat formulir input nilainya.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-peserta-input"
              type="text"
              placeholder="Cari nama atau instansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredPeserta.map(p => {
              const matchedScores = nilai.filter(n => n.peserta_id === p.id);
              const isCompleted = matchedScores.length >= kriteria.length && kriteria.length > 0;
              const isSelected = selectedPesertaId === p.id;

              return (
                <button
                  id={`nilai-select-peserta-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedPesertaId(p.id)}
                  className={`w-full p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{p.nama}</span>
                    <span className={`text-[10px] font-mono mt-0.5 block truncate ${isSelected ? 'text-indigo-150' : 'text-slate-400'}`}>
                      {p.nisn_nip} &bull; {p.instansi}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10">
                    <span className={`text-[9px] font-mono ${isSelected ? 'text-indigo-150' : 'text-slate-400'}`}>
                      Skor: {matchedScores.length}/{kriteria.length} kriteria
                    </span>

                    {isCompleted ? (
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        Lengkap
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-indigo-750 text-indigo-200' : 'bg-amber-50 text-amber-700'
                      }`}>
                        Belum Lengkap
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filteredPeserta.length === 0 && peserta.length > 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada peserta yang cocok.</p>
            )}
            {peserta.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Kandidat kosong.</p>
            )}
          </div>
        </div>

        {/* Right pane: Entry scores form */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">Formulir Input Nilai Aktif</span>
                <h4 className="font-bold text-slate-900 text-sm font-sans mt-0.5">
                  {currentPeserta ? currentPeserta.nama : 'Pilih satu peserta'}
                </h4>
              </div>

              {currentPeserta && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 py-1 px-2.5 border border-slate-150 rounded-lg">
                  NISN/NIP: {currentPeserta.nisn_nip}
                </span>
              )}
            </div>

            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-medium mb-4 flex gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                  : 'bg-rose-50 border-rose-150 text-rose-700'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {currentPeserta && kriteria.length > 0 ? (
              <div className="space-y-5">
                {kriteria.map((k) => {
                  const currentValue = scores[k.id] !== undefined ? scores[k.id] : 80;
                  return (
                    <div key={k.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5 group hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-lg">
                            {k.id}
                          </span>
                          <span className="text-xs font-bold text-slate-800 ml-2 font-sans">{k.nama}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
                          Bobot {k.bobot}% &bull; {k.jenis}
                        </span>
                      </div>

                      {/* Score slider & input controller */}
                      <div className="flex items-center gap-4">
                        <input
                          id={`slider-nilai-${k.id}`}
                          type="range"
                          min="0"
                          max="100"
                          value={currentValue}
                          onChange={(e) => handleScoreChange(k.id, Number(e.target.value))}
                          disabled={!isAdmin}
                          className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="w-18 shrink-0 flex items-center justify-between border border-slate-250 bg-white rounded-lg px-2 py-1 select-none">
                          <input
                            id={`input-nilai-${k.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={currentValue}
                            onChange={(e) => handleScoreChange(k.id, Number(e.target.value))}
                            disabled={!isAdmin}
                            className="w-full text-center text-xs font-mono font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <p className="text-sm">Tidak ada kriteria atau peserta yang dimuat.</p>
                <p className="text-xs font-mono mt-1">Harap buat kriteria terlebih dahulu di tab Kelola Kriteria.</p>
              </div>
            )}
          </div>

          {currentPeserta && kriteria.length > 0 && (
            <div className="pt-6 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] text-slate-400 font-mono leading-relaxed">
                *Skor berskala 1 sampai 100. Simpan skor dengan hati-hati untuk mempertahankan akurasi ranking SAW.
              </span>
              
              {isAdmin && (
                <button
                  id="nilai-save-scores-btn"
                  onClick={handleSaveAllScores}
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Seluruh Skor
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
