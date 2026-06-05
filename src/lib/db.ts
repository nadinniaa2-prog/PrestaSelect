/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Kriteria, Peserta, Nilai, Role, UserSession, Instrumen, NilaiInstrumen } from '../types';

// Let's retrieve potential Supabase environment configurations
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

export let supabase: SupabaseClient | null = null;
export let isUsingSupabase = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isUsingSupabase = true;
    console.log('Successfully connected to Supabase Cloud Client!');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Initial seed data for Criteria
const DEFAULT_KRITERIA: Kriteria[] = [
  { id: 'C1', nama: 'Prestasi Akademik / Kompetensi Teknis', bobot: 35, jenis: 'benefit' },
  { id: 'C2', nama: 'Nilai Wawancara & Gagasan', bobot: 30, jenis: 'benefit' },
  { id: 'C3', nama: 'Presentasi Karya & Portofolio', bobot: 20, jenis: 'benefit' },
  { id: 'C4', nama: 'Etika, Kedisiplinan & Absensi', bobot: 15, jenis: 'benefit' },
];

// Initial seed data for Participants (Students and Teachers)
const DEFAULT_PESERTA: Peserta[] = [
  {
    id: 'P1',
    nama: 'Ahmad Fauzi, M.Pd (Guru)',
    nisn_nip: '198504122010011004',
    instansi: 'SMAN 1 Jakarta (Matematika)',
    deskripsi: 'Guru Matematika berprestasi dengan inovasi pembelajaran digital menggunakan AR/VR.',
    status_keputusan: null,
  },
  {
    id: 'P2',
    nama: 'Riska Amalia (Siswa)',
    nisn_nip: '0067483920',
    instansi: 'SMAN 3 Bandung - Kelas XII IPA 1',
    deskripsi: 'Juara 2 Olimpiade Fisika Nasional, aktif dalam LKTI (Lomba Karya Tulis Ilmiah).',
    status_keputusan: 'lolos',
    selected_at: new Date().toISOString(),
  },
  {
    id: 'P3',
    nama: 'Dian Nugraha, S.T (Guru)',
    nisn_nip: '199003152015031002',
    instansi: 'SMK Negeri 2 Surabaya (Informatika)',
    deskripsi: 'Guru TIK yang membimbing siswa memenangkan lomba hackathon nasional.',
    status_keputusan: null,
  },
  {
    id: 'P4',
    nama: 'Siti Rahmawati (Siswa)',
    nisn_nip: '0078392019',
    instansi: 'SMA Al-Azhar Yogyakarta - Kelas XI IPS 2',
    deskripsi: 'Finalis Debat Bahasa Inggris Nasional, memiliki kecakapan komunikasi luar biasa.',
    status_keputusan: null,
  },
  {
    id: 'P5',
    nama: 'Budi Hartono (Siswa)',
    nisn_nip: '0054839201',
    instansi: 'SMAN 1 Surabaya - Kelas XII Bahasa',
    deskripsi: 'Penulis cerpen yang telah menerbitkan 2 antologi mandiri dan memenangkan loma cipta puisi.',
    status_keputusan: null,
  },
];

// Initial scores for default participants
const DEFAULT_NILAI: Nilai[] = [
  // Ahmad Fauzi (P1)
  { id: 'N1_1', peserta_id: 'P1', kriteria_id: 'C1', skor: 85 },
  { id: 'N1_2', peserta_id: 'P1', kriteria_id: 'C2', skor: 90 },
  { id: 'N1_3', peserta_id: 'P1', kriteria_id: 'C3', skor: 80 },
  { id: 'N1_4', peserta_id: 'P1', kriteria_id: 'C4', skor: 95 },

  // Riska Amalia (P2)
  { id: 'N2_1', peserta_id: 'P2', kriteria_id: 'C1', skor: 95 },
  { id: 'N2_2', peserta_id: 'P2', kriteria_id: 'C2', skor: 85 },
  { id: 'N2_3', peserta_id: 'P2', kriteria_id: 'C3', skor: 90 },
  { id: 'N2_4', peserta_id: 'P2', kriteria_id: 'C4', skor: 88 },

  // Dian Nugraha (P3)
  { id: 'N3_1', peserta_id: 'P3', kriteria_id: 'C1', skor: 88 },
  { id: 'N3_2', peserta_id: 'P3', kriteria_id: 'C2', skor: 80 },
  { id: 'N3_3', peserta_id: 'P3', kriteria_id: 'C3', skor: 85 },
  { id: 'N3_4', peserta_id: 'P3', kriteria_id: 'C4', skor: 90 },

  // Siti Rahmawati (P4)
  { id: 'N4_1', peserta_id: 'P4', kriteria_id: 'C1', skor: 80 },
  { id: 'N4_2', peserta_id: 'P4', kriteria_id: 'C2', skor: 95 },
  { id: 'N4_3', peserta_id: 'P4', kriteria_id: 'C3', skor: 78 },
  { id: 'N4_4', peserta_id: 'P4', kriteria_id: 'C4', skor: 92 },

  // Budi Hartono (P5)
  { id: 'N5_1', peserta_id: 'P5', kriteria_id: 'C1', skor: 75 },
  { id: 'N5_2', peserta_id: 'P5', kriteria_id: 'C2', skor: 82 },
  { id: 'N5_3', peserta_id: 'P5', kriteria_id: 'C3', skor: 88 },
  { id: 'N5_4', peserta_id: 'P5', kriteria_id: 'C4', skor: 85 },
];

export const DEFAULT_INSTRUMEN: Instrumen[] = [
  { id: 'I1_1', kriteria_id: 'C1', kode: 'INS-101', pertanyaan: 'Rata-rata nilai rapor / nilai asesmen kognitif berkas pendaftaran', bobot: 40 },
  { id: 'I1_2', kriteria_id: 'C1', kode: 'INS-102', pertanyaan: 'Skor portofolio sertifikat kompetensi / juara kejuaraan sains', bobot: 30 },
  { id: 'I1_3', kriteria_id: 'C1', kode: 'INS-103', pertanyaan: 'Nilai ujian saringan masuk komputer atau tes kognitif dasar', bobot: 30 },
  
  { id: 'I2_1', kriteria_id: 'C2', kode: 'INS-201', pertanyaan: 'Artikulasi berbicara, postur, kemandirian serta visi kontribusi', bobot: 50 },
  { id: 'I2_2', kriteria_id: 'C2', kode: 'INS-202', pertanyaan: 'Kemampuan menyelesaikan masalah tak terduga secara langsung', bobot: 50 },
  
  { id: 'I3_1', kriteria_id: 'C3', kode: 'INS-301', pertanyaan: 'Kesesuaian karya orisinal dengan tema & keindahan estetika', bobot: 50 },
  { id: 'I3_2', kriteria_id: 'C3', kode: 'INS-302', pertanyaan: 'Kejelasan presentasi slide dan kelancaran tanya-jawab penguji', bobot: 50 },
  
  { id: 'I4_1', kriteria_id: 'C4', kode: 'INS-401', pertanyaan: 'Tingkat keaktifan, kesopanan (attitude), serta kedisiplinan berkas', bobot: 60 },
  { id: 'I4_2', kriteria_id: 'C4', kode: 'INS-402', pertanyaan: 'Presensi / kehadiran pembekalan fisik tepat waktu', bobot: 40 }
];

export const DEFAULT_NILAI_INSTRUMEN: NilaiInstrumen[] = [
  { id: 'NI_P1_I1_1', peserta_id: 'P1', instrumen_id: 'I1_1', skor: 85 },
  { id: 'NI_P1_I1_2', peserta_id: 'P1', instrumen_id: 'I1_2', skor: 80 },
  { id: 'NI_P1_I1_3', peserta_id: 'P1', instrumen_id: 'I1_3', skor: 90 },
  
  { id: 'NI_P1_I2_1', peserta_id: 'P1', instrumen_id: 'I2_1', skor: 90 },
  { id: 'NI_P1_I2_2', peserta_id: 'P1', instrumen_id: 'I2_2', skor: 90 },
  
  { id: 'NI_P1_I3_1', peserta_id: 'P1', instrumen_id: 'I3_1', skor: 80 },
  { id: 'NI_P1_I3_2', peserta_id: 'P1', instrumen_id: 'I3_2', skor: 80 },
  
  { id: 'NI_P1_I4_1', peserta_id: 'P1', instrumen_id: 'I4_1', skor: 95 },
  { id: 'NI_P1_I4_2', peserta_id: 'P1', instrumen_id: 'I4_2', skor: 95 },

  { id: 'NI_P2_I1_1', peserta_id: 'P2', instrumen_id: 'I1_1', skor: 96 },
  { id: 'NI_P2_I1_2', peserta_id: 'P2', instrumen_id: 'I1_2', skor: 92 },
  { id: 'NI_P2_I1_3', peserta_id: 'P2', instrumen_id: 'I1_3', skor: 90 },
  
  { id: 'NI_P2_I2_1', peserta_id: 'P2', instrumen_id: 'I2_1', skor: 88 },
  { id: 'NI_P2_I2_2', peserta_id: 'P2', instrumen_id: 'I2_2', skor: 82 },
  
  { id: 'NI_P2_I3_1', peserta_id: 'P2', instrumen_id: 'I3_1', skor: 90 },
  { id: 'NI_P2_I3_2', peserta_id: 'P2', instrumen_id: 'I3_2', skor: 90 },
  
  { id: 'NI_P2_I4_1', peserta_id: 'P2', instrumen_id: 'I4_1', skor: 86 },
  { id: 'NI_P2_I4_2', peserta_id: 'P2', instrumen_id: 'I4_2', skor: 91 }
];


/**
 * Local Data Engine (LocalStorage fallback)
 */
class LocalDB {
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return new Promise<T>((resolve) => {
      const timer = setTimeout(() => {
        console.warn(`Supabase query timed out after ${timeoutMs}ms. Falling back to local index.`);
        resolve(fallback);
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          console.error("Supabase query rejected:", error);
          resolve(fallback);
        });
    });
  }

  private getKriteria(): Kriteria[] {
    try {
      const data = localStorage.getItem('presta_kriteria');
      if (!data) {
        localStorage.setItem('presta_kriteria', JSON.stringify(DEFAULT_KRITERIA));
        return DEFAULT_KRITERIA;
      }
      let list: Kriteria[] = JSON.parse(data);
      if (list.some(k => k.id === 'C5')) {
        list = list.filter(k => k.id !== 'C5');
        const currentSum = list.reduce((sum, item) => sum + item.bobot, 0);
        if (currentSum === 90) {
          list = list.map(k => {
            if (k.id === 'C1') return { ...k, bobot: 35 };
            if (k.id === 'C2') return { ...k, bobot: 30 };
            return k;
          });
        }
        localStorage.setItem('presta_kriteria', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to parse kriteria JSON from local storage:', e);
      return DEFAULT_KRITERIA;
    }
  }

  private saveKriteria(kriteria: Kriteria[]) {
    try {
      localStorage.setItem('presta_kriteria', JSON.stringify(kriteria));
    } catch (e) {
      console.error('Failed to save kriteria to local storage:', e);
    }
  }

  private getPeserta(): Peserta[] {
    try {
      const data = localStorage.getItem('presta_peserta');
      if (!data) {
        localStorage.setItem('presta_peserta', JSON.stringify(DEFAULT_PESERTA));
        return DEFAULT_PESERTA;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse peserta JSON from local storage:', e);
      return DEFAULT_PESERTA;
    }
  }

  private savePeserta(peserta: Peserta[]) {
    try {
      localStorage.setItem('presta_peserta', JSON.stringify(peserta));
    } catch (e) {
      console.error('Failed to save peserta to local storage:', e);
    }
  }

  private getNilai(): Nilai[] {
    try {
      const data = localStorage.getItem('presta_nilai');
      if (!data) {
        localStorage.setItem('presta_nilai', JSON.stringify(DEFAULT_NILAI));
        return DEFAULT_NILAI;
      }
      let list: Nilai[] = JSON.parse(data);
      if (list.some(n => n.kriteria_id === 'C5')) {
        list = list.filter(n => n.kriteria_id !== 'C5');
        localStorage.setItem('presta_nilai', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to parse nilai JSON from local storage:', e);
      return DEFAULT_NILAI;
    }
  }

  private saveNilai(nilai: Nilai[]) {
    try {
      localStorage.setItem('presta_nilai', JSON.stringify(nilai));
    } catch (e) {
      console.error('Failed to save nilai to local storage:', e);
    }
  }

  getCachedKriteria(): Kriteria[] {
    return this.getKriteria();
  }

  getCachedPeserta(): Peserta[] {
    return this.getPeserta();
  }

  getCachedNilai(): Nilai[] {
    return this.getNilai();
  }

  getInstrumen(): Instrumen[] {
    try {
      const data = localStorage.getItem('presta_instrumen');
      if (!data) {
        localStorage.setItem('presta_instrumen', JSON.stringify(DEFAULT_INSTRUMEN));
        return DEFAULT_INSTRUMEN;
      }
      let list: Instrumen[] = JSON.parse(data);
      if (list.some(i => i.kriteria_id === 'C5')) {
        list = list.filter(i => i.kriteria_id !== 'C5');
        localStorage.setItem('presta_instrumen', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to parse instrumen JSON:', e);
      return DEFAULT_INSTRUMEN;
    }
  }

  saveInstrumenList(list: Instrumen[]) {
    try {
      localStorage.setItem('presta_instrumen', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save instrumen list:', e);
    }
  }

  getNilaiInstrumen(): NilaiInstrumen[] {
    try {
      const data = localStorage.getItem('presta_nilai_instrumen');
      if (!data) {
        localStorage.setItem('presta_nilai_instrumen', JSON.stringify(DEFAULT_NILAI_INSTRUMEN));
        return DEFAULT_NILAI_INSTRUMEN;
      }
      let list: NilaiInstrumen[] = JSON.parse(data);
      const currentInstrumenObj = new Set(this.getInstrumen().map(i => i.id));
      if (list.some(ni => !currentInstrumenObj.has(ni.instrumen_id))) {
        list = list.filter(ni => currentInstrumenObj.has(ni.instrumen_id));
        localStorage.setItem('presta_nilai_instrumen', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to parse nilai instrumen:', e);
      return DEFAULT_NILAI_INSTRUMEN;
    }
  }

  saveNilaiInstrumenList(list: NilaiInstrumen[]) {
    try {
      localStorage.setItem('presta_nilai_instrumen', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save nilai instrumen list:', e);
    }
  }

  getCachedInstrumen(): Instrumen[] {
    return this.getInstrumen();
  }

  getCachedNilaiInstrumen(): NilaiInstrumen[] {
    return this.getNilaiInstrumen();
  }

  async saveInstrumenItem(item: Instrumen): Promise<void> {
    const list = this.getInstrumen();
    const idx = list.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveInstrumenList(list);
  }

  async deleteInstrumenItem(id: string): Promise<void> {
    const list = this.getInstrumen().filter(i => i.id !== id);
    this.saveInstrumenList(list);

    const scores = this.getNilaiInstrumen().filter(s => s.instrumen_id !== id);
    this.saveNilaiInstrumenList(scores);
  }

  async saveMultipleNilaiInstrumen(items: NilaiInstrumen[]): Promise<void> {
    const list = this.getNilaiInstrumen();
    for (const item of items) {
      const idx = list.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        list[idx] = item;
      } else {
        list.push(item);
      }
    }
    this.saveNilaiInstrumenList(list);
  }

  // API wrappers
  async fetchKriteria(): Promise<Kriteria[]> {
    if (isUsingSupabase && supabase) {
      try {
        const queryPromise = (async () => {
          const { data, error } = await supabase!.from('kriteria').select('*').order('id', { ascending: true });
          if (error) {
            console.warn('Supabase error on fetchKriteria, using cache:', error.message);
            return this.getKriteria();
          }
          const list = (data || []) as Kriteria[];
          // Only update local storage cache if list is not empty or if it represents a valid empty state
          if (list.length > 0) {
            this.saveKriteria(list);
          }
          return list.length === 0 ? this.getKriteria() : list;
        })();
        return await this.withTimeout(queryPromise, 2500, this.getKriteria());
      } catch (err) {
        console.error('Exception on fetchKriteria:', err);
        return this.getKriteria();
      }
    }
    return this.getKriteria();
  }

  async saveKriteriaItem(item: Kriteria): Promise<void> {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase.from('kriteria').upsert({
          id: item.id,
          nama: item.nama,
          bobot: item.bobot,
          jenis: item.jenis
        });
        if (error) {
          console.warn('Supabase save error kriteria:', error.message);
        }
      } catch (err) {
        console.error('Exception in saveKriteriaItem Supabase:', err);
      }
    }
    const list = this.getKriteria();
    const idx = list.findIndex(k => k.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveKriteria(list);
  }

  async deleteKriteriaItem(id: string): Promise<void> {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase.from('kriteria').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete error kriteria:', error.message);
        }
      } catch (err) {
        console.error('Exception in deleteKriteriaItem Supabase:', err);
      }
    }
    const list = this.getKriteria().filter(k => k.id !== id);
    this.saveKriteria(list);

    // Also clean up associated scores
    const currentNilai = this.getNilai().filter(n => n.kriteria_id !== id);
    this.saveNilai(currentNilai);
  }

  async fetchPeserta(): Promise<Peserta[]> {
    if (isUsingSupabase && supabase) {
      try {
        const queryPromise = (async () => {
          const { data, error } = await supabase!.from('peserta').select('*').order('id', { ascending: true });
          if (error) {
            console.warn('Supabase error on fetchPeserta, using cache:', error.message);
            return this.getPeserta();
          }
          const list = (data || []) as Peserta[];
          if (list.length > 0) {
            this.savePeserta(list);
          }
          return list.length === 0 ? this.getPeserta() : list;
        })();
        return await this.withTimeout(queryPromise, 2500, this.getPeserta());
      } catch (err) {
        console.error('Exception on fetchPeserta:', err);
        return this.getPeserta();
      }
    }
    return this.getPeserta();
  }

  async savePesertaItem(item: Peserta): Promise<void> {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase.from('peserta').upsert({
          id: item.id,
          nama: item.nama,
          nisn_nip: item.nisn_nip,
          instansi: item.instansi,
          deskripsi: item.deskripsi,
          status_keputusan: item.status_keputusan,
          selected_at: item.selected_at
        });
        if (error) {
          console.warn('Supabase save error peserta:', error.message);
        }
      } catch (err) {
        console.error('Exception in savePesertaItem Supabase:', err);
      }
    }
    const list = this.getPeserta();
    const idx = list.findIndex(p => p.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.savePeserta(list);
  }

  async deletePesertaItem(id: string): Promise<void> {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase.from('peserta').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete error peserta:', error.message);
        }
      } catch (err) {
        console.error('Exception in deletePesertaItem Supabase:', err);
      }
    }
    const list = this.getPeserta().filter(p => p.id !== id);
    this.savePeserta(list);

    // Clean up associated scores
    const currentNilai = this.getNilai().filter(n => n.peserta_id !== id);
    this.saveNilai(currentNilai);
  }

  async fetchNilai(): Promise<Nilai[]> {
    if (isUsingSupabase && supabase) {
      try {
        const queryPromise = (async () => {
          const { data, error } = await supabase!.from('nilai').select('*');
          if (error) {
            console.warn('Supabase error on fetchNilai, using cache:', error.message);
            return this.getNilai();
          }
          const list = (data || []) as Nilai[];
          if (list.length > 0) {
            this.saveNilai(list);
          }
          return list.length === 0 ? this.getNilai() : list;
        })();
        return await this.withTimeout(queryPromise, 2500, this.getNilai());
      } catch (err) {
        console.error('Exception on fetchNilai:', err);
        return this.getNilai();
      }
    }
    return this.getNilai();
  }

  async saveNilaiItem(item: Nilai): Promise<void> {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase.from('nilai').upsert({
          id: item.id,
          peserta_id: item.peserta_id,
          kriteria_id: item.kriteria_id,
          skor: item.skor
        });
        if (error) {
          console.warn('Supabase save error nilai:', error.message);
        }
      } catch (err) {
        console.error('Exception in saveNilaiItem Supabase:', err);
      }
    }
    const list = this.getNilai();
    const idx = list.findIndex(n => n.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.saveNilai(list);
  }

  async saveMultipleNilai(items: Nilai[]): Promise<void> {
    for (const item of items) {
      await this.saveNilaiItem(item);
    }
  }

  // Wipe and reset state
  async resetDatabase(): Promise<void> {
    localStorage.removeItem('presta_kriteria');
    localStorage.removeItem('presta_peserta');
    localStorage.removeItem('presta_nilai');
    localStorage.removeItem('presta_instrumen');
    localStorage.removeItem('presta_nilai_instrumen');
    this.getKriteria();
    this.getPeserta();
    this.getNilai();
    this.getInstrumen();
    this.getNilaiInstrumen();
  }
}

export const db = new LocalDB();

// Mock Auth system
export interface AuthState {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
}

export const getStoredSession = (): UserSession | null => {
  const session = localStorage.getItem('presta_session');
  if (session) {
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }
  return null;
};

// SQL Schema for the user to paste directly in Supabase console
export const SUPABASE_SQL_SCHEMA = `-- RAW SQL SCRIPTS FOR SUPABASE SQL EDITOR --

-- 1. Create Profile / Role enumeration table
CREATE TABLE IF NOT EXISTS kriteria (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  bobot DOUBLE PRECISION NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('benefit', 'cost'))
);

-- 2. Create Peserta Table
CREATE TABLE IF NOT EXISTS peserta (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  nisn_nip TEXT UNIQUE NOT NULL,
  instansi TEXT NOT NULL,
  deskripsi TEXT,
  status_keputusan TEXT CHECK (status_keputusan IN ('lolos', 'tidak_lolos')) DEFAULT NULL,
  selected_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create Nilai Table
CREATE TABLE IF NOT EXISTS nilai (
  id TEXT PRIMARY KEY,
  peserta_id TEXT REFERENCES peserta(id) ON DELETE CASCADE,
  kriteria_id TEXT REFERENCES kriteria(id) ON DELETE CASCADE,
  skor INT NOT NULL CHECK (skor BETWEEN 0 AND 100),
  UNIQUE(peserta_id, kriteria_id)
);

-- Optional: Seed first data
INSERT INTO kriteria (id, nama, bobot, jenis) VALUES
('C1', 'Prestasi Akademik / Kompetensi Teknis', 35, 'benefit'),
('C2', 'Nilai Wawancara & Gagasan', 30, 'benefit'),
('C3', 'Presentasi Karya & Portofolio', 20, 'benefit'),
('C4', 'Etika, Kedisiplinan & Absensi', 15, 'benefit')
ON CONFLICT (id) DO NOTHING;
`;
