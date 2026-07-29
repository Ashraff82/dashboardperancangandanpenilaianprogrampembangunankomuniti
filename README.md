# DPPK — Dashboard Perancangan & Penilaian Program Pembangunan Komuniti

**Kementerian Perumahan dan Kerajaan Tempatan (KPKT), Malaysia**

Sistem dashboard bersepadu untuk merancang, melaksana, memantau, dan menilai program pembangunan komuniti di peringkat Pihak Berkuasa Tempatan (PBT) dan negeri.

> Dibangunkan mengikut Dokumen Keperluan Produk (PRD) v1.0 — Fasa 1 (MVP) dengan pangkalan data dummy/simulasi.

---

## Ciri Utama

Tujuh (7) modul berfungsi penuh mengikut keperluan fungsian PRD:

| # | Modul | Penerangan |
|---|-------|------------|
| 1 | **Papan Pemuka Utama** | Ringkasan eksekutif: KPI, status program, peruntukan OE, kadar perbelanjaan, trend tahunan |
| 2 | **Perancangan Program** | CRUD cadangan program, penetapan KPI, aliran kelulusan (Draf → Semakan → Kelulusan), carta Gantt |
| 3 | **Bajet & Peruntukan OE** | Pemantauan Siling OE (iGFMAS), waran peruntukan, virement, burn rate, status lampu isyarat |
| 4 | **Pelaksanaan & Pemantauan** | Kemas kini kemajuan, log isu/risiko, penunjuk traffic-light, amaran automatik |
| 5 | **Penilaian Program** | Skor 3-dimensi (Output/Outcome/Impact), gred A-E, maklum balas komuniti, pengajaran |
| 6 | **Pelaporan & Analitik** | Laporan standard/custom, eksport CSV & PDF, analitik trend multi-tahun, benchmarking |
| 7 | **Pentadbiran Pengguna** | CRUD pengguna, RBAC (6 peranan), matriks kebenaran, log audit |

## Tindanan Teknologi

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York) — reka bentuk **glassmorphism** dengan warna korporat KPKT (navy `#0f2a66` + emas `#f5b82e`)
- **Database**: Prisma ORM + SQLite (pangkalan data dummy/simulasi)
- **Carta**: Recharts
- **Ikone**: Lucide React

## Struktur Data

13 model Prisma menyokong keseluruhan kitaran hayat program:

```
Pengguna, AuditLog, Program, KPI, Aktiviti, KemajuanProgram,
IsuRisiko, Penilaian, MaklumBalasKomuniti, PeruntukanOE,
WaranPeruntukan, Virement, PerbelanjaanBulanan
```

Sub-modul **Pemantauan Peruntukan OE (5.3.1)** direka selari dengan struktur iGFMAS (Objek Am: Emolumen, Perkhidmatan & Bekalan, Aset, Bantuan & Kebajikan) bagi memudahkan integrasi masa depan dengan sistem kewangan Kerajaan.

## Arahan Pemasangan & Penjalanan

```bash
# 1. Pasang dependencies
bun install

# 2. Konfigurasi pangkalan data (DATABASE_URL telah ditetapkan dalam .env)
#    Skema: prisma/schema.prisma

# 3. Cipta skema pangkalan data
bun run db:push

# 4. Isi pangkalan data dengan data dummy
bun prisma/seed.ts

# 5. Jalankan pelayan pembangunan
bun run dev
```

Buka `http://localhost:3000` dalam pelayar.

### Arahan Lain

```bash
bun run lint        # Semakan kualiti kod (ESLint)
bun run db:generate # Jana semula Prisma Client
bun run db:reset    # Reset pangkalan data (hapus semua data)
```

## Reka Bentuk UI/UX

- **Glassmorphism**: Kad frosted glass dengan `backdrop-blur`, sempadan halus, dan bayangan lembut
- **Skema Warna KPKT**: Navy `#0f2a66` (utama) + Emas `#f5b82e` (aksen)
- **Penunjuk Status Lampu Isyarat**: Hijau (On-Track) / Kuning (Perhatian) / Merah (Kritikal) — konsisten di semua modul
- **Responsif**: Reka bentuk mobile-first dengan sidebar boleh lipat
- **Bahasa Malaysia**: Antara muka utama dalam Bahasa Malaysia

## Peranan Pengguna (RBAC)

| Peranan | Contoh Pengguna | Skop Capaian |
|---------|-----------------|--------------|
| Pentadbir Sistem | Bahagian ICT KPKT | Semua modul (penuh) |
| Pengurus Program | Pegawai Pembangunan Komuniti | Perancangan, Pelaksanaan |
| Pegawai PBT | Pegawai Majlis Daerah/Perbandaran | Kemas kini data lapangan |
| Penilai Program | Bahagian Perancangan Strategik | Penilaian & impak |
| Pengurusan Atasan | Ketua Setiausaha, Ketua Bahagian | Dashboard eksekutif (baca) |
| Orang Awam | Rakyat, NGO, media | Ringkasan (baca sahaja) |

## Nota

- Data yang dipaparkan adalah **data dummy/simulasi** untuk tujuan MVP dan pengesahan konsep.
- Integrasi dengan sistem sebenar KPKT (eSPEKS, MyLocalStat) dan MOF (iGFMAS) akan dilaksanakan pada Fasa 2.
- Pengesahan pengguna sebenar (SSO/MyDigital ID) di luar skop Fasa 1.

## Lesen

Kegunaan dalaman KPKT sahaja. Terhad.

---

Disediakan oleh Bahagian Perancangan Strategik & Digital, KPKT · v1.0
