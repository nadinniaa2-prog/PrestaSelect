/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Kriteria, Peserta, Nilai, Instrumen, NilaiInstrumen } from '../types';
import { db } from '../lib/db';
import { Clipboard, HelpCircle, Save, Percent, Plus, Trash2, Edit2, Settings, Check, RefreshCw, AlertCircle, Info, Star } from 'lucide-react';

interface InstrumenTabProps {
  kriteria: Kriteria[];
  peserta: Peserta[];
  nilai: Nilai[];
  onSaveNilai: (items: Nilai[]) => Promise<void>;
  userRole: string;
}

export default function InstrumenTab({ kriteria, peserta, nilai, onSaveNilai, userRole }: InstrumenTabProps) {
  const isAdmin = userRole === 'admin';

  // Live collections from DB/Storage
  const [instrumenList, setInstrumenList] = useState<Instrumen[]>(() => db.getCachedInstrumen());
  const [nilaiInstrumenList, setNilaiInstrumenList] = useState<NilaiInstrumen[]>(() => db.getCachedNilaiInstrumen());

  // Active subview: 'scoring' (Penilaian) or 'questions' (Kelola Pertanyaan)
  const [activeSubTab, setActiveSubTab] = useState<'scoring' | 'questions'>('scoring');

  // Selected participant for scoring
  const [selectedPesertaId, setSelectedPesertaId] = useState<string>('');

  // Form states for creating/editing Instrument Question
  const [isEditingQuestion, setIsEditingQuestion] = useState<boolean>(false);
  const [targetQuestionId, setTargetQuestionId] = useState<string>('');
  const [formKode, setFormKode] = useState<string>('');
  const [formPertanyaan, setFormPertanyaan] = useState<string>('');
  const [formBobot, setFormBobot] = useState<number>(50);
  const [formKriteriaId, setFormKriteriaId] = useState<string>('');

  // Raw temporary score slider/input state: instrument_id -> score
  const [inputScores, setInputScores] = useState<Record<string, number>>({});
  const [savingStatus, setSavingStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto select default participant
  useEffect(() => {
    if (peserta.length > 0 && !selectedPesertaId) {
      setSelectedPesertaId(peserta[0].id);
    }
  }, [peserta, selectedPesertaId]);

  // Load selected participant's existing instrument scores
  useEffect(() => {
    if (selectedPesertaId) {
      const currentScores: Record<string, number> = {};
      instrumenList.forEach(ins => {
        const found = nilaiInstrumenList.find(ni => ni.peserta_id === selectedPesertaId && ni.instrumen_id === ins.id);
        currentScores[ins.id] = found ? found.skor : 80; // default score of 80
      });
      setInputScores(currentScores);
      setSavingStatus(null);
    } else {
      setInputScores({});
    }
  }, [selectedPesertaId, instrumenList, nilaiInstrumenList]);

  // Handler: Change single instrument score
  const handleScoreSliderChange = (insId: string, val: number) => {
    if (!isAdmin) return;
    const bounded = Math.max(0, Math.min(100, val));
    setInputScores(prev => ({
      ...prev,
      [insId]: bounded
    }));
  };

  // Live calculate estimated criterion scores
  const getLiveSummary = () => {
    const summary: Record<string, { current: number; calculated: number; weightSum: number }> = {};
    
    kriteria.forEach(k => {
      // Find current criterion score in Nilai
      const rawNilai = nilai.find(n => n.peserta_id === selectedPesertaId && n.kriteria_id === k.id);
      const currentVal = rawNilai ? rawNilai.skor : 80;

      // Find instruments for this criterion
      const insForK = instrumenList.filter(ins => ins.kriteria_id === k.id);
      
      let weighedSum = 0;
      let totalWeight = 0;

      insForK.forEach(ins => {
        const score = inputScores[ins.id] !== undefined ? inputScores[ins.id] : 80;
        weighedSum += score * ins.bobot;
        totalWeight += ins.bobot;
      });

      const calculatedVal = totalWeight > 0 ? Math.round(weighedSum / totalWeight) : 80;
      summary[k.id] = {
        current: currentVal,
        calculated: calculatedVal,
        weightSum: totalWeight
      };
    });

    return summary;
  };

  const liveSummary = getLiveSummary();

  // Save instrument scores & update main SAW Nilai criteria scores automatically!
  const handleSaveInstrumentScores = async () => {
    if (!isAdmin || !selectedPesertaId) return;

    setLoading(true);
    setSavingStatus(null);

    try {
      // 1. Prepare NilaiInstrumen payload & Save
      const payloadNilaiInstrumen: NilaiInstrumen[] = instrumenList.map(ins => {
        const scoreVal = inputScores[ins.id] !== undefined ? inputScores[ins.id] : 80;
        return {
          id: `NI_${selectedPesertaId}_${ins.id}`,
          peserta_id: selectedPesertaId,
          instrumen_id: ins.id,
          skor: scoreVal
        };
      });

      await db.saveMultipleNilaiInstrumen(payloadNilaiInstrumen);

      // 2. Prepare main Kriteria Nilai payload based on weighted averages of instruments
      const currentLiveSummary = getLiveSummary();
      const payloadNilaiKriteria: Nilai[] = kriteria.map(k => {
        const calcObj = currentLiveSummary[k.id] || { calculated: 80 };
        return {
          id: `N_${selectedPesertaId}_${k.id}`,
          peserta_id: selectedPesertaId,
          kriteria_id: k.id,
          skor: calcObj.calculated !== undefined ? calcObj.calculated : 80
        };
      });

      // Invoke App parent callback to save in memory & synchronize database state
      await onSaveNilai(payloadNilaiKriteria);

      // Refresh local display collections from storage
      setNilaiInstrumenList(db.getCachedNilaiInstrumen());

      setSavingStatus({
        type: 'success',
        text: 'Skor instrumen berhasil disimpan! Nilai kriteria pendukung SAW otomatis dikalkulasikan.'
      });
    } catch (err: any) {
      setSavingStatus({
        type: 'error',
        text: err.message || 'Gagal menyimpan skor instrumen.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Form Operations for managing instrument questions
  const handleResetForm = () => {
    setIsEditingQuestion(false);
    setTargetQuestionId('');
    setFormKode('');
    setFormPertanyaan('');
    setFormBobot(50);
    setFormKriteriaId(kriteria[0]?.id || '');
  };

  const handleOpenAddForm = () => {
    handleResetForm();
    setIsEditingQuestion(true);
  };

  const handleEditQuestionClick = (q: Instrumen) => {
    setTargetQuestionId(q.id);
    setFormKode(q.kode);
    setFormPertanyaan(q.pertanyaan);
    setFormBobot(q.bobot);
    setFormKriteriaId(q.kriteria_id);
    setIsEditingQuestion(true);
  };

  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!formKode.trim() || !formPertanyaan.trim() || !formKriteriaId) {
      alert('Mohon isi semua bidang formulir dengan benar.');
      return;
    }

    const item: Instrumen = {
      id: targetQuestionId || `INS_${Date.now()}`,
      kriteria_id: formKriteriaId,
      kode: formKode.trim().toUpperCase(),
      pertanyaan: formPertanyaan.trim(),
      bobot: Number(formBobot) || 50
    };

    await db.saveInstrumenItem(item);
    const updated = db.getCachedInstrumen();
    setInstrumenList(updated);
    handleResetForm();
  };

  const handleDeleteQuestion = (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirmId(id);
  };

  const executeDeleteQuestion = async (id: string) => {
    await db.deleteInstrumenItem(id);
    setInstrumenList(db.getCachedInstrumen());
    setNilaiInstrumenList(db.getCachedNilaiInstrumen());
    setDeleteConfirmId(null);
  };

  const activePeserta = peserta.find(p => p.id === selectedPesertaId);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Clipboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Nilai Instrumen yang Ditanyakan</h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Menjabarkan kriteria menjadi butir-butir instrumen pertanyaan objektif. Skor dihitung otomatis dengan bobot instrumen.
            </p>
          </div>
        </div>

        {/* Sub-navigation buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 justify-center w-full md:w-auto self-stretch md:self-auto shrink-0 relative z-10 shadow-inner">
          <button
            id="instrumen-tab-scoring"
            onClick={() => setActiveSubTab('scoring')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'scoring'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            Input Skor Instrumen
          </button>
          <button
            id="instrumen-tab-questions"
            onClick={() => setActiveSubTab('questions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'questions'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Kelola Butir Instrumen
          </button>
        </div>
      </div>

      {activeSubTab === 'scoring' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left panel: Participant Selector list */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Pendaftaran Peserta
              </label>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih peserta di bawah ini untuk menilai butir instrumen pertanyaannya secara seksama.
              </p>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {peserta.map(p => {
                const isSelected = selectedPesertaId === p.id;
                // Count completed instrument scores for this participant
                const ratedCount = instrumenList.filter(ins => {
                  return nilaiInstrumenList.some(ni => ni.peserta_id === p.id && ni.instrumen_id === ins.id);
                }).length;

                return (
                  <button
                    id={`ins-p-selector-${p.id}`}
                    key={p.id}
                    onClick={() => setSelectedPesertaId(p.id)}
                    className={`w-full p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-650 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{p.nama}</span>
                      <span className={`text-[10px] font-mono mt-0.5 block truncate ${isSelected ? 'text-indigo-150' : 'text-slate-400'}`}>
                        {p.nisn_nip} &bull; {p.instansi}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/20">
                      <span className={`text-[9px] font-semibold flex items-center gap-1 ${isSelected ? 'text-indigo-150' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-500" />
                        Terisi: {ratedCount} / {instrumenList.length} butir
                      </span>
                      {p.status_keputusan === 'lolos' && (
                        <span className="text-[8px] uppercase tracking-wider bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded">
                          Lolos
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Evaluation Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {activePeserta ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                
                {/* Participant Header summary */}
                <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-bold font-mono uppercase bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-lg">
                      Formulir Penilaian Instrumen Objektif
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">{activePeserta.nama}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {activePeserta.nisn_nip} &bull; {activePeserta.instansi}
                    </p>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-right max-w-xs">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-indigo-500 font-bold block">Status Integrasi SAW</span>
                    <span className="text-xs text-indigo-950 font-bold font-sans mt-1 block">Averages overwrite main scores</span>
                  </div>
                </div>

                {savingStatus && (
                  <div className={`p-4 rounded-xl flex gap-3 text-xs font-medium border ${
                    savingStatus.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{savingStatus.text}</span>
                  </div>
                )}

                {/* Score inputs grouped by Criterion */}
                <div className="space-y-6">
                  {kriteria.map(k => {
                    const insForK = instrumenList.filter(ins => ins.kriteria_id === k.id);
                    const calcObj = liveSummary[k.id] || { current: 80, calculated: 80, weightSum: 0 };

                    return (
                      <div key={k.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        
                        {/* Criterion subheader */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-250/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5.5 h-5.5 rounded-lg bg-indigo-650 text-white flex items-center justify-center text-[10px] font-bold">
                              {k.id}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {k.nama} ({k.jenis === 'benefit' ? 'Benefit' : 'Cost'})
                            </span>
                          </div>

                          <div className="flex gap-4 items-center">
                            <div className="text-right">
                              <span className="block text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Skor Saat Ini</span>
                              <span className="text-xs text-slate-550 font-mono font-semibold line-through">
                                {calcObj.current}
                              </span>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg text-right">
                              <span className="block text-[8px] text-indigo-600 font-mono uppercase tracking-wider font-bold">Kalkulasi Baru</span>
                              <span className="text-xs font-black font-mono text-indigo-700">
                                {calcObj.calculated} / 100
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Instruments under this Criterion */}
                        {insForK.length > 0 ? (
                          <div className="space-y-4 pt-1">
                            {insForK.map(ins => {
                              const scoreVal = inputScores[ins.id] !== undefined ? inputScores[ins.id] : 80;

                              return (
                                <div key={ins.id} className="bg-white p-3.5 border border-slate-200 rounded-lg space-y-2 group hover:border-indigo-150 transition-colors">
                                  <div className="flex items-start justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 font-bold border border-slate-200 py-0.5 px-1.5 rounded">
                                          {ins.kode}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                                          Bobot: {ins.bobot}%
                                        </span>
                                      </div>
                                      <p className="text-slate-700 text-xs leading-relaxed font-sans font-medium">
                                        {ins.pertanyaan}
                                      </p>
                                    </div>

                                    {/* Score display badge */}
                                    <div className="w-16 text-center bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                                      <span className="block text-[8px] text-indigo-500 font-mono font-bold uppercase">Skor</span>
                                      <span className="text-xs font-black font-mono text-indigo-700">{scoreVal}</span>
                                    </div>
                                  </div>

                                  {/* Slider score trigger */}
                                  {isAdmin && (
                                    <div className="flex items-center gap-4 pt-1">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={scoreVal}
                                        onChange={(e) => handleScoreSliderChange(ins.id, Number(e.target.value))}
                                        className="w-full accent-indigo-600 h-1.5 bg-slate-100 group-hover:bg-slate-200 rounded-lg cursor-pointer"
                                      />
                                      <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={scoreVal}
                                        onChange={(e) => handleScoreSliderChange(ins.id, Number(e.target.value))}
                                        className="w-14 bg-slate-50 border border-slate-200 focus:bg-white rounded-md py-1 px-1.5 text-center font-mono text-xs focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 font-mono">
                            Belum ada butir instrumen untuk kriteria {k.id}. Buat baru di tab 'Kelola Butir'.
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Submitting form controls */}
                {isAdmin && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      id="ins-reset-btn"
                      type="button"
                      onClick={() => {
                        // Reset all to default 80
                        const reset: Record<string, number> = {};
                        instrumenList.forEach(ins => {
                          reset[ins.id] = 80;
                        });
                        setInputScores(reset);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-xs font-bold py-3 px-5 rounded-xl transition-all cursor-pointer"
                    >
                      Reset Formulir
                    </button>
                    <button
                      id="ins-save-btn"
                      type="button"
                      onClick={handleSaveInstrumentScores}
                      disabled={loading || instrumenList.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4.5 h-4.5" />
                      )}
                      Simpan Skor & Update SAW
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                <AlertCircle className="w-8 h-8 text-indigo-400 mx-auto" />
                <h4 className="font-bold text-slate-700">Daftar Peserta Kosong</h4>
                <p className="text-xs">Silakan daftarkan atau sinkronkan peserta terlebih dahulu pada tab Kelola Peserta.</p>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ACTIVE VIEW: QUESTIONS (KELOLA BUTIR PERTANYAAN INSTRUMEN) */
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Question Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                {isEditingQuestion ? 'Edit Butir Pertanyaan' : 'Tambah Butir Instrumen Baru'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Tentukan instrumen spesifik untuk ditanyakan pada aspek kriteria. Bobot butir instrumen menentukan kepadatannya saat di-average.
              </p>
            </div>

            {isAdmin ? (
              <form onSubmit={handleSaveQuestionForm} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    Pilih Kriteria Induk
                  </label>
                  <select
                    id="ins-form-kriteria"
                    value={formKriteriaId}
                    onChange={(e) => setFormKriteriaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none"
                  >
                    {kriteria.map(k => (
                      <option key={k.id} value={k.id}>{k.id} - {k.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    Kode Instrumen (Unit)
                  </label>
                  <input
                    id="ins-form-code"
                    type="text"
                    required
                    placeholder="Contoh: INS-104, SK-1"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    Butir Pertanyaan / Deskripsi Evaluasi
                  </label>
                  <textarea
                    id="ins-form-text"
                    required
                    rows={4}
                    placeholder="Contoh: Nilai rata-rata tes simulasi praktek mengajar mikro (guru) atau tes wawasan kebangsaan."
                    value={formPertanyaan}
                    onChange={(e) => setFormPertanyaan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                      Bobot Faktor (%)
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{formBobot}%</span>
                  </div>
                  <input
                    id="ins-form-weight-slider"
                    type="range"
                    min="1"
                    max="100"
                    value={formBobot}
                    onChange={(e) => setFormBobot(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400">Menentukan tingkat penting kueri instrumen ini dalam kriteria induknya.</p>
                </div>

                <div className="pt-2 flex gap-2">
                  {isEditingQuestion && (
                    <button
                      id="ins-cancel-form"
                      type="button"
                      onClick={handleResetForm}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    id="ins-submit-form"
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isEditingQuestion ? 'Perbarui Butir' : 'Tambahkan Butir'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-55 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                Hanya Operator Administrator yang berwenang menambahkan, merubah, atau menghapus butir kueri instrumen penilaian.
              </div>
            )}
          </div>

          {/* Questions Grouped tables */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                Struktur Kuesioner & Instrumen Pertanyaan Terdaftar
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Total terdaftar sebanyak {instrumenList.length} butir instrumen penilaian tersebar pada kriteria pendukung seleksi SAW.
              </p>
            </div>

            <div className="space-y-6">
              {kriteria.map(k => {
                const insForK = instrumenList.filter(ins => ins.kriteria_id === k.id);
                const totalWeightSum = insForK.reduce((acc, current) => acc + current.bobot, 0);

                return (
                  <div key={k.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    
                    {/* Table group header banner */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold font-mono">
                          {k.id}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800">{k.nama}</h4>
                      </div>
                      <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 py-1 px-2.5 rounded-lg font-bold">
                        Kumulatif Bobot: {totalWeightSum}%
                      </span>
                    </div>

                    {/* Table items */}
                    {insForK.length > 0 ? (
                      <div className="divide-y divide-slate-150">
                        {insForK.map(ins => (
                          <div key={ins.id} className="p-4 flex gap-4 items-start hover:bg-slate-50/50 transition-colors">
                            <span className="text-[10px] font-mono bg-slate-100 font-bold border border-slate-200 py-0.5 px-2 rounded text-slate-650 shrink-0">
                              {ins.kode}
                            </span>
                            <div className="flex-1 space-y-1">
                              <p className="text-xs font-medium text-slate-800 leading-relaxed font-sans pr-4">
                                {ins.pertanyaan}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-slate-400">
                                  Sumbangsih Bobot: <strong>{ins.bobot}%</strong> dari {totalWeightSum}% total kriteria ini
                                </span>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                {deleteConfirmId === ins.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-150 p-1 px-2 rounded-lg animate-fade-in text-[10px]">
                                    <span className="text-rose-700 font-bold font-sans">Hapus?</span>
                                    <button
                                      id={`confirm-delete-ins-${ins.id}`}
                                      type="button"
                                      onClick={() => executeDeleteQuestion(ins.id)}
                                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer animate-pulse"
                                    >
                                      Ya
                                    </button>
                                    <button
                                      id={`cancel-delete-ins-${ins.id}`}
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      id={`edit-ins-${ins.id}`}
                                      type="button"
                                      onClick={() => handleEditQuestionClick(ins)}
                                      className="p-1 px-2 text-[10px] text-indigo-650 hover:bg-indigo-50 rounded cursor-pointer"
                                      title="Edit instrumen"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                                      Ubah
                                    </button>
                                    <button
                                      id={`delete-ins-${ins.id}`}
                                      type="button"
                                      onClick={() => handleDeleteQuestion(ins.id)}
                                      className="p-1 px-2 text-[10px] text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                      title="Hapus instrumen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                      Hapus
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white italic font-sans">
                        Belum ada kueri instrumen pertanyaan yang dimasukkan untuk aspek {k.nama}.
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
