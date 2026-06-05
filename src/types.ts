/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'guru';

export interface UserSession {
  email: string;
  role: Role;
  name: string;
}

export type CriteriaType = 'benefit' | 'cost';

export interface Kriteria {
  id: string; // e.g., "K1", "K2"
  nama: string;
  bobot: number; // percentage (e.g., 25 or 0.25)
  jenis: CriteriaType;
}

export interface Peserta {
  id: string;
  nama: string;
  nisn_nip: string; // Student NISN or Teacher NIP
  instansi: string; // School/Class
  deskripsi: string; // Biography / reasons for entering
  status_keputusan: 'lolos' | 'tidak_lolos' | null;
  selected_at?: string;
}

export interface Nilai {
  id: string;
  peserta_id: string;
  kriteria_id: string;
  skor: number; // range scale 1-100 or 1-5
}

export interface SAWResult {
  peserta: Peserta;
  skorAwal: Record<string, number>; // kriteria_id -> skor
  skorNormalisasi: Record<string, number>; // kriteria_id -> normalized_skor
  nilaiPreferensi: number; // total preference score
  ranking: number;
}

export interface Instrumen {
  id: string;
  kriteria_id: string;
  kode: string;
  pertanyaan: string;
  bobot: number; // percentage/weight relative to other instruments in this criterion
}

export interface NilaiInstrumen {
  id: string;
  peserta_id: string;
  instrumen_id: string;
  skor: number;
}

