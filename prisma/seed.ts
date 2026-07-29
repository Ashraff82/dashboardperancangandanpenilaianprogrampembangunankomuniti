// Seed script for DPPK - Dashboard Perancangan & Penilaian Program Pembangunan Komuniti
// KPKT Malaysia - generates realistic dummy data across all modules
import { db } from "../src/lib/db";

const BAHAGIAN_KPKT = [
  "Bahagian Pembangunan Komuniti",
  "Bahagian Perancangan Strategik & Digital",
  "Bahagian Kewangan",
  "Bahagian Pengurusan Bandar",
  "Bahagian Perumahan",
];

const NEGERI_DAERAH: { negeri: string; daerah: string[]; pbt: string[] }[] = [
  { negeri: "Selangor", daerah: ["Petaling", "Klang", "Gombak", "Hulu Langat"], pbt: ["MBPJ", "MPK", "MP Sepang"] },
  { negeri: "Johor", daerah: ["Johor Bahru", "Muar", "Batu Pahat", "Kluang"], pbt: ["MBJB", "MP Muar", "MP Batu Pahat"] },
  { negeri: "Pulau Pinang", daerah: ["Timur Laut", "Barat Daya", "Seberang Perai Utara", "Seberang Perai Tengah"], pbt: ["MBPP", "MPSP"] },
  { negeri: "Sabah", daerah: ["Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu"], pbt: ["DBKK", "Majlis Sandakan"] },
  { negeri: "Sarawak", daerah: ["Kuching", "Miri", "Sibu", "Bintulu"], pbt: ["DBKU", "MBKS", "Majlis Miri"] },
  { negeri: "Perak", daerah: ["Kinta", "Larut", "Manjung", "Hilir Perak"], pbt: ["MBI", "MP Manjung"] },
  { negeri: "Kedah", daerah: ["Kota Setar", "Kuala Muda", "Kubang Pasu"], pbt: ["MB Alor Setar", "MP Sungai Petani"] },
  { negeri: "Kelantan", daerah: ["Kota Bharu", "Pasir Mas", "Tumpat"], pbt: ["MB Kota Bharu"] },
  { negeri: "Pahang", daerah: ["Kuantan", "Temerloh", "Bentong"], pbt: ["MP Kuantan", "MP Bentong"] },
  { negeri: "Negeri Sembilan", daerah: ["Seremban", "Port Dickson", "Rembau"], pbt: ["MBS", "MP Port Dickson"] },
  { negeri: "Melaka", daerah: ["Melaka Tengah", "Alor Gajah", "Jasin"], pbt: ["MB Melaka"] },
  { negeri: "Terengganu", daerah: ["Kuala Terengganu", "Kemaman", "Dungun"], pbt: ["MBKT", "MP Kemaman"] },
  { negeri: "Perlis", daerah: ["Kangar", "Padang Besar", "Arau"], pbt: ["MP Kangar"] },
  { negeri: "Wilayah Persekutuan Kuala Lumpur", daerah: ["KL Pusat", "KL Utara", "KL Selatan"], pbt: ["DBKL"] },
  { negeri: "Wilayah Persekutuan Putrajaya", daerah: ["Putrajaya"], pbt: ["PPj"] },
  { negeri: "Wilayah Persekutuan Labuan", daerah: ["Labuan"], pbt: ["MPL"] },
];

const KATEGORI = ["Infrastruktur", "Sosioekonomi", "Kesejahteraan Rakyat", "Transformasi Bandar"];
const STATUS_PROGRAM = ["Perancangan", "Diluluskan", "DalamPelaksanaan", "Selesai", "Tergendala"];
const OBJEK_AM = ["Emolumen", "Perkhidmatan & Bekalan", "Aset", "Bantuan & Kebajikan", "Lain-lain"];

const PROGRAM_TEMPLATES = [
  { nama: "Program Penyelenggaraan Taman Komuniti", kategori: "Infrastruktur", sub: "Infrastruktur Komuniti", obj: "Meningkatkan kemudahan taman komuniti bagi keselesaan penduduk setempat", sasaran: "Penduduk PBT" },
  { nama: "Program Latihan Kemahiran Usahawan B40", kategori: "Sosioekonomi", sub: "Pembangunan Usahawan", obj: "Memperkasa pendapatan komuniti B40 melalui latihan kemahiran", sasaran: "Usahawan B40" },
  { nama: "Program Mesra Rakyat & Kesejahteraan Warga Emas", kategori: "Kesejahteraan Rakyat", sub: "Kebajikan Warga Emas", obj: "Meningkatkan kesejahteraan warga emas dan keluarga", sasaran: "Warga emas & keluarga" },
  { nama: "Program Transformasi Kawasan Setinggan", kategori: "Transformasi Bandar", sub: "Penyahsetinggan", obj: "Menambah baik kawasan setinggan dan menyediakan perumahan transit", sasaran: "Penduduk setinggan" },
  { nama: "Program Kebersihan & Lanskap Bandar Lestari", kategori: "Transformasi Bandar", sub: "Lanskap & Kebersihan", obj: "Mewujudkan persekitaran bandar yang bersih dan lestari", sasaran: "Komuniti bandar" },
  { nama: "Program Bantuan Bekalan Air Komuniti Luar Bandar", kategori: "Kesejahteraan Rakyat", sub: "Utiliti Asas", obj: "Memastikan akses bekalan air bersih kepada komuniti luar bandar", sasaran: "Komuniti luar bandar" },
  { nama: "Program Pemulihan Sosial Belia", kategori: "Sosioekonomi", sub: "Pembangunan Belia", obj: "Memperkasa potensi belia melalui aktiviti sosial dan kemahiran", sasaran: "Belia 15-30 tahun" },
  { nama: "Program Naik Taraf Jalan Komuniti", kategori: "Infrastruktur", sub: "Jalan & Perparitan", obj: "Menambah baik infrastruktur jalan di kawasan komuniti", sasaran: "Penduduk tempatan" },
  { nama: "Program Pusat Transformasi Bandar (RTC)", kategori: "Transformasi Bandar", sub: "Pusat Komuniti", obj: "Menyediakan pusat komuniti bersepadu untuk perkhidmatan rakyat", sasaran: "Komuniti luar bandar" },
  { nama: "Program Kebajikan OKU Inklusif", kategori: "Kesejahteraan Rakyat", sub: "Kebajikan OKU", obj: "Meningkatkan inklusiviti dan aksesibiliti komuniti OKU", sasaran: "OKU & penjaga" },
  { nama: "Program Pemuliharaan Warisan Tempatan", kategori: "Transformasi Bandar", sub: "Warisan & Budaya", obj: "Memelihara dan memulihara warisan tempatan", sasaran: "Komuniti tempatan" },
  { nama: "Program Bank Makanan Komuniti", kategori: "Kesejahteraan Rakyat", sub: "Bantuan Makanan", obj: "Membantu golongan rentan melalui bank makanan komuniti", sasaran: "Golongan rentan" },
];

const NAMA_PELULUS = ["Datin Nor Aishah binti Abdullah", "Dato' Haji Razali bin Idris", "Puan Sarifah binti Taha", "Tuan Haji Kamal bin Yusof"];
const JAWATAN_PELULUS = "Ketua Bahagian";

function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number, decimals = 2): number { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }
function pick<T>(arr: T[], n: number): T[] { const c = [...arr]; const out: T[] = []; while (n-- > 0 && c.length) out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); return out; }

function trafficLight(progress: number, status: string): string {
  if (status === "Tergendala") return "Merah";
  if (status === "Selesai") return "Hijau";
  if (progress < 40) return "Merah";
  if (progress < 70) return "Kuning";
  return "Hijau";
}

function computeOEStatus(pct: number): string {
  if (pct > 95) return "Merah";
  if (pct >= 80) return "Kuning";
  return "Hijau";
}

function gradeFromScore(score: number): string {
  if (score >= 4.5) return "A";
  if (score >= 3.5) return "B";
  if (score >= 2.5) return "C";
  if (score >= 1.5) return "D";
  return "E";
}

async function main() {
  console.log("🌱 Seeding DPPK database...");

  // Clean
  await db.perbelanjaanBulanan.deleteMany();
  await db.waranPeruntukan.deleteMany();
  await db.virement.deleteMany();
  await db.peruntukanOE.deleteMany();
  await db.maklumBalasKomuniti.deleteMany();
  await db.penilaian.deleteMany();
  await db.isuRisiko.deleteMany();
  await db.kemajuanProgram.deleteMany();
  await db.aktiviti.deleteMany();
  await db.kPI.deleteMany();
  await db.program.deleteMany();
  await db.auditLog.deleteMany();
  await db.pengguna.deleteMany();

  // ============ USERS ============
  const usersData = [
    { nama: "Ahmad Faizal bin Rahman", email: "faizal@kpkt.gov.my", jawatan: "Pegawai Sistem Maklumat", peranan: "Admin", bahagian: "Bahagian Perancangan Strategik & Digital", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914000" },
    { nama: "Siti Aisyah binti Mohd", email: "aisyah@kpkt.gov.my", jawatan: "Pegawai Pembangunan Komuniti", peranan: "PengurusProgram", bahagian: "Bahagian Pembangunan Komuniti", negeri: "Selangor", telefon: "03-88914100" },
    { nama: "Tan Wei Ming", email: "weiming@kpkt.gov.my", jawatan: "Pegawai Pembangunan Komuniti", peranan: "PengurusProgram", bahagian: "Bahagian Pembangunan Komuniti", negeri: "Pulau Pinang", telefon: "04-88914200" },
    { nama: "Nurul Huda binti Ismail", email: "nurul@kpkt.gov.my", jawatan: "Pegawai Pembangunan Komuniti", peranan: "PengurusProgram", bahagian: "Bahagian Pembangunan Komuniti", negeri: "Johor", telefon: "07-88914300" },
    { nama: "Rajesh a/l Kumar", email: "rajesh@kpkt.gov.my", jawatan: "Pegawai PBT", peranan: "PegawaiPBT", bahagian: "Bahagian Pengurusan Bandar", negeri: "Selangor", telefon: "03-55101234" },
    { nama: "Fatimah binti Osman", email: "fatimah@kpkt.gov.my", jawatan: "Pegawai PBT", peranan: "PegawaiPBT", bahagian: "Bahagian Pengurusan Bandar", negeri: "Johor", telefon: "07-22113456" },
    { nama: "Lee Chong Wei", email: "chongwei@kpkt.gov.my", jawatan: "Pegawai PBT", peranan: "PegawaiPBT", bahagian: "Bahagian Pengurusan Bandar", negeri: "Pulau Pinang", telefon: "04-26912345" },
    { nama: "Wong Mei Ling", email: "meiling@kpkt.gov.my", jawatan: "Penilai Program Kanan", peranan: "Penilai", bahagian: "Bahagian Perancangan Strategik & Digital", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914500" },
    { nama: "Mohd Hafiz bin Ibrahim", email: "hafiz@kpkt.gov.my", jawatan: "Penilai Program", peranan: "Penilai", bahagian: "Bahagian Perancangan Strategik & Digital", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914600" },
    { nama: NAMA_PELULUS[0], email: "aishah@kpkt.gov.my", jawatan: JAWATAN_PELULUS, peranan: "PengurusanAtasan", bahagian: "Bahagian Pembangunan Komuniti", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914700" },
    { nama: NAMA_PELULUS[1], email: "razali@kpkt.gov.my", jawatan: JAWATAN_PELULUS, peranan: "PengurusanAtasan", bahagian: "Bahagian Pengurusan Bandar", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914800" },
    { nama: NAMA_PELULUS[2], email: "sarifah@kpkt.gov.my", jawatan: "Timbalan Ketua Setiausaha", peranan: "PengurusanAtasan", bahagian: "Bahagian Kewangan", negeri: "Wilayah Persekutuan Putrajaya", telefon: "03-88914900" },
  ];
  const users = await Promise.all(usersData.map((u) => db.pengguna.create({ data: u })));
  const pengurusList = users.filter((u) => u.peranan === "PengurusProgram");
  const pelulusList = users.filter((u) => u.peranan === "PengurusanAtasan");
  const pegawaiPBT = users.filter((u) => u.peranan === "PegawaiPBT");
  const penilaiList = users.filter((u) => u.peranan === "Penilai");

  // ============ PROGRAMS ============
  const tahunAktif = [2024, 2025, 2026];
  const programCount = 48;
  const programs = [];

  for (let i = 0; i < programCount; i++) {
    const tmpl = randItem(PROGRAM_TEMPLATES);
    const loc = randItem(NEGERI_DAERAH);
    const daerah = randItem(loc.daerah);
    const pbt = randItem(loc.pbt);
    const status = randItem(STATUS_PROGRAM);
    const tahun = randItem(tahunAktif);
    const mula = new Date(tahun, randInt(0, 8), randInt(1, 28));
    const tamat = new Date(tahun, Math.min(11, mula.getMonth() + randInt(2, 6)), randInt(1, 28));
    const bajet = randItem([50000, 120000, 250000, 500000, 750000, 1200000, 2500000]);

    let progress = 0;
    if (status === "Perancangan") progress = randInt(5, 25);
    else if (status === "Diluluskan") progress = randInt(25, 40);
    else if (status === "DalamPelaksanaan") progress = randInt(40, 85);
    else if (status === "Selesai") progress = 100;
    else if (status === "Tergendala") progress = randInt(20, 60);

    const bajetSebenar = status === "Selesai" ? bajet * randFloat(0.85, 1.05) : (status === "DalamPelaksanaan" ? bajet * (progress / 100) * randFloat(0.9, 1.1) : (status === "Tergendala" ? bajet * (progress / 100) * randFloat(0.8, 1.0) : bajet * randFloat(0.1, 0.3)));

    const kodProgram = `PROG-${tahun}-${String(i + 1).padStart(3, "0")}`;
    const pengurus = randItem(pengurusList);
    const pelulus = status !== "Perancangan" ? randItem(pelulusList) : null;

    const penerima = status === "Selesai" ? randInt(200, 5000) : (status === "DalamPelaksanaan" ? randInt(100, 3000) : randInt(50, 1000));

    const program = await db.program.create({
      data: {
        kodProgram,
        namaProgram: tmpl.nama,
        kategori: tmpl.kategori,
        subKategori: tmpl.sub,
        negeri: loc.negeri,
        daerah,
        pbt,
        status,
        statusLampu: trafficLight(progress, status),
        bajetDianggar: bajet,
        bajetSebenar: Math.round(bajetSebenar),
        tarikhMula: mula,
        tarikhTamat: tamat,
        objektif: tmpl.obj,
        kumpulanSasaran: tmpl.sasaran,
        peratusKemajuan: progress,
        penerimaManfaat: penerima,
        bilanganAktiviti: randInt(3, 8),
        pengurusId: pengurus.id,
        pelulusId: pelulus?.id,
        catatan: status === "Tergendala" ? "Program tergendala menunggu kelulusan virement peruntukan." : null,
      },
    });
    programs.push(program);

    // KPIs
    const kpiCount = randInt(2, 4);
    const kpiTemplates = [
      { nama: "Bilangan penerima manfaat", unit: " orang", jenis: "Output", sasaran: randItem([500, 1000, 2000, 3000]).toString() },
      { nama: "Kadar penyempurnaan aktiviti", unit: "%", jenis: "Output", sasaran: "100" },
      { nama: "Indeks kepuasan komuniti", unit: "/5", jenis: "Outcome", sasaran: "4" },
      { nama: "Peningkatan pendapatan peserta", unit: "%", jenis: "Outcome", sasaran: "20" },
      { nama: "Kadar pengurangan isu sosial", unit: "%", jenis: "Impact", sasaran: "15" },
      { nama: "Kemudahan komuniti dinaik taraf", unit: " unit", jenis: "Output", sasaran: randItem([5, 10, 15]).toString() },
      { nama: "Peratus penggunaan kemudahan", unit: "%", jenis: "Outcome", sasaran: "75" },
    ];
    const chosenKpis = pick(kpiTemplates, kpiCount);
    for (const k of chosenKpis) {
      const sasaran = parseFloat(k.sasaran);
      const sebenar = status === "Selesai" ? sasaran * randFloat(0.85, 1.1) : (status === "DalamPelaksanaan" ? sasaran * (progress / 100) * randFloat(0.9, 1.05) : sasaran * randFloat(0.1, 0.4));
      await db.kPI.create({
        data: {
          programId: program.id,
          nama: k.nama,
          sasaran: k.sasaran,
          nilaiSasaran: sasaran,
          unit: k.unit,
          jenis: k.jenis,
          pencapaianSebenar: parseFloat(sebenar.toFixed(2)),
          tarikhUkur: new Date(),
        },
      });
    }

    // Aktiviti (for Gantt)
    const aktivitiCount = randInt(4, 7);
    let aktStart = new Date(mula);
    for (let a = 0; a < aktivitiCount; a++) {
      const aktEnd = new Date(aktStart);
      aktEnd.setDate(aktEnd.getDate() + randInt(14, 45));
      let aktStatus = "BelumMula";
      let aktProgress = 0;
      if (status === "Selesai") { aktStatus = "Selesai"; aktProgress = 100; }
      else if (status === "Tergendala" && a >= 2) { aktStatus = "Tertangguh"; aktProgress = randInt(20, 60); }
      else if (aktEnd < new Date()) { aktStatus = "Selesai"; aktProgress = 100; }
      else if (aktStart < new Date() && aktEnd > new Date()) { aktStatus = "DalamProgress"; aktProgress = randInt(30, 90); }
      await db.aktiviti.create({
        data: {
          programId: program.id,
          nama: `Aktiviti ${a + 1}: ${randItem(["Perancangan", "Taklimat", "Pelaksanaan", "Pemantauan", "Pelaporan", "Penilaian", "Penutup"])}`,
          tarikhMula: new Date(aktStart),
          tarikhTamat: new Date(aktEnd),
          peratusKemajuan: aktProgress,
          status: aktStatus,
          PIC: randItem(pegawaiPBT).nama,
        },
      });
      aktStart = new Date(aktEnd);
      aktStart.setDate(aktStart.getDate() + randInt(3, 10));
    }

    // Kemajuan (progress updates)
    if (status === "DalamPelaksanaan" || status === "Selesai" || status === "Tergendala") {
      const updateCount = randInt(2, 5);
      for (let k = 0; k < updateCount; k++) {
        await db.kemajuanProgram.create({
          data: {
            programId: program.id,
            penggunaId: randItem(pegawaiPBT).id,
            peratusKemajuan: Math.min(100, Math.round((progress / updateCount) * (k + 1))),
            catatan: randItem(["Kemajuan mengikut jadual.", "Sedikit kelewatan akibat cuaca.", "Pematuhan bajet baik.", "Menunggu kelulusan tambahan.", "Aktiviti berjalan lancar."]),
            tarikh: new Date(mula.getTime() + (k + 1) * 14 * 86400000),
          },
        });
      }
    }

    // Isu & Risiko
    if (Math.random() > 0.55) {
      const isuCount = randInt(1, 3);
      for (let j = 0; j < isuCount; j++) {
        await db.isuRisiko.create({
          data: {
            programId: program.id,
            jenis: randItem(["Isu", "Risiko"]),
            tajuk: randItem(["Kekurangan peruntukan", "Kelewatan kontraktor", "Bantahan komuniti", "Kemas kini data lewat", "Kerosakan peralatan", "Pergantungan musim hujan"]),
            penerangan: "Penerangan terperinci isu/risiko yang dihadapi semasa pelaksanaan program di lokasi lapangan.",
            keutamaan: randItem(["Rendah", "Sederhana", "Tinggi", "Kritikal"]),
            status: status === "Selesai" ? "Selesai" : randItem(["Terbuka", "DalamTindakan", "Selesai"]),
            pelaporId: randItem(pegawaiPBT).id,
            penyelesaiId: status === "Selesai" ? randItem(pengurusList).id : null,
            tindakan: "Tindakan pemulihan sedang dijalankan bersama pihak berkenaan.",
            tarikhSelesai: status === "Selesai" ? new Date() : null,
          },
        });
      }
    }

    // Penilaian (for completed programs)
    if (status === "Selesai") {
      const skorOutput = randFloat(3.0, 5.0, 1);
      const skorOutcome = randFloat(2.8, 4.8, 1);
      const skorImpact = randFloat(2.5, 4.5, 1);
      const skorKeseluruhan = parseFloat(((skorOutput + skorOutcome + skorImpact) / 3).toFixed(2));
      const gred = gradeFromScore(skorKeseluruhan);
      const penilaian = await db.penilaian.create({
        data: {
          programId: program.id,
          penilaiId: randItem(penilaiList).id,
          skorOutput,
          skorOutcome,
          skorImpact,
          skorKeseluruhan,
          gred,
          pencapaianKPI: randFloat(70, 105, 1),
          pengajaran: "Pengajaran penting: penglibatan komuniti awal meningkatkan kadar penerimaan program.",
          cadangan: "Cadangan: tambah masa pelaksanaan untuk aktiviti penglibatan komuniti pada program akan datang.",
        },
      });
      // update program with score
      await db.program.update({ where: { id: program.id }, data: { skorPenilaian: skorKeseluruhan, gredPenilaian: gred } });

      // Maklum balas komuniti
      const mbCount = randInt(3, 8);
      for (let m = 0; m < mbCount; m++) {
        await db.maklumBalasKomuniti.create({
          data: {
            programId: program.id,
            namaResponden: `Responden ${m + 1}`,
            skorKepuasan: randFloat(3, 5, 1),
            komen: randItem(["Program sangat membantu", "Cukup baik tetapi boleh dibaiki", "Aktiviti menarik", "Memerlukan lebih promosi", "Penglibatan komuniti perlu dipertingkatkan"]),
          },
        });
      }
    }
  }

  // ============ PERUNTUKAN OE (Modul 3 + 5.3.1) ============
  const tahunKewanganList = [2024, 2025, 2026];
  let waranCounter = 1;

  for (const tahun of tahunKewanganList) {
    for (const bahagian of BAHAGIAN_KPKT) {
      for (const objekAm of OBJEK_AM) {
        const siling = randItem([500000, 1000000, 2500000, 5000000, 8000000, 12000000]);
        // burn rate scaled by recency of year
        const tahunFactor = tahun === 2026 ? randFloat(0.35, 0.75) : (tahun === 2025 ? randFloat(0.85, 1.05) : randFloat(0.92, 1.0));
        const dibelanjakan = Math.round(siling * tahunFactor * randFloat(0.9, 1.0));
        const komited = Math.round(siling * randFloat(0.02, 0.12));
        const baki = Math.max(0, siling - dibelanjakan - komited);
        const peratus = siling > 0 ? parseFloat(((dibelanjakan + komited) / siling * 100).toFixed(2)) : 0;
        const statusPenggunaan = computeOEStatus(peratus);

        const peruntukan = await db.peruntukanOE.create({
          data: {
            tahunKewangan: tahun,
            bahagian,
            objekAm,
            kodVot: `${randInt(10000, 99999)}`,
            kodAktiviti: `AKT-${randInt(100, 999)}`,
            silingPeruntukan: siling,
            jumlahDibelanjakan: dibelanjakan,
            jumlahKomited: komited,
            bakiPeruntukan: baki,
            peratusPenggunaan: peratus,
            statusPenggunaan,
            kemaskiniOlehId: randItem(users).id,
          },
        });

        // Waran Peruntukan (1-3 per allocation)
        const waranCount = randInt(1, 3);
        for (let w = 0; w < waranCount; w++) {
          await db.waranPeruntukan.create({
            data: {
              nomborWaran: `WARAN/${tahun}/${String(waranCounter++).padStart(4, "0")}`,
              tahunKewangan: tahun,
              bahagian,
              objekAm,
              jumlah: Math.round(siling / waranCount * randFloat(0.8, 1.1)),
              tarikhWaran: new Date(tahun, randInt(0, 10), randInt(1, 28)),
              dikeluarkanOleh: "Kementerian Kewangan Malaysia",
              status: "BerkuatKuasa",
              peruntukanOEId: peruntukan.id,
              dikeluarkanKepadaId: randItem(pelulusList).id,
            },
          });
        }

        // Perbelanjaan bulanan (12 months burn rate)
        const monthlyBurn = dibelanjakan / 12;
        for (let m = 0; m < 12; m++) {
          const factor = randFloat(0.5, 1.6);
          await db.perbelanjaanBulanan.create({
            data: {
              peruntukanOEId: peruntukan.id,
              tahun,
              bulan: m + 1,
              jumlahDibelanjakan: Math.round(monthlyBurn * factor),
              jumlahKomited: Math.round(monthlyBurn * factor * 0.15),
              unjuran: Math.round(monthlyBurn * randFloat(0.9, 1.1)),
            },
          });
        }
      }
    }
  }

  // Virement records
  const virementStatuses = ["Mohon", "Disemak", "Diluluskan", "Ditolak"];
  for (let v = 0; v < 8; v++) {
    await db.virement.create({
      data: {
        nomborRujukan: `VIR/2026/${String(v + 1).padStart(3, "0")}`,
        tahunKewangan: 2026,
        bahagian: randItem(BAHAGIAN_KPKT),
        objekAmAsal: randItem(OBJEK_AM),
        objekAmDestinasi: randItem(OBJEK_AM),
        jumlah: randItem([50000, 100000, 250000, 500000]),
        justifikasi: "Pindahan peruntukan untuk menampung keperluan operasi kritikal program komuniti.",
        status: randItem(virementStatuses),
        dimohonOleh: randItem(pengurusList).nama,
        tarikhLulus: Math.random() > 0.5 ? new Date() : null,
      },
    });
  }

  // Link some PeruntukanOE to Programs
  const allPeruntukan = await db.peruntukanOE.findMany({ where: { tahunKewangan: 2026 } });
  for (const prog of programs.slice(0, 20)) {
    const p = randItem(allPeruntukan);
    await db.peruntukanOE.update({ where: { id: p.id }, data: { programId: prog.id } });
  }

  // Audit logs
  const aksiList = ["Cipta", "Kemaskini", "Lulus", "Hantar", "Padam", "Eksport", "Log Masuk"];
  const modulList = ["PapanPemuka", "Perancangan", "Bajet", "Pelaksanaan", "Penilaian", "Pelaporan", "Pentadbiran"];
  for (let i = 0; i < 50; i++) {
    await db.auditLog.create({
      data: {
        penggunaId: randItem(users).id,
        modul: randItem(modulList),
        aksi: randItem(aksiList),
        entiti: randItem(["Program", "PeruntukanOE", "Pengguna", "KPI", "Penilaian"]),
        entitiId: randItem(programs).id,
        butiran: "Tindakan pengguna direkodkan untuk tujuan audit.",
        ipAlamat: `10.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
        tarikh: new Date(Date.now() - randInt(0, 30) * 86400000),
      },
    });
  }

  console.log(`✅ Seeding complete!`);
  console.log(`   - ${users.length} pengguna`);
  console.log(`   - ${programs.length} program`);
  console.log(`   - ${(await db.kPI.count())} KPI`);
  console.log(`   - ${(await db.aktiviti.count())} aktiviti`);
  console.log(`   - ${(await db.kemajuanProgram.count())} kemajuan`);
  console.log(`   - ${(await db.isuRisiko.count())} isu/risiko`);
  console.log(`   - ${(await db.penilaian.count())} penilaian`);
  console.log(`   - ${(await db.maklumBalasKomuniti.count())} maklum balas`);
  console.log(`   - ${(await db.peruntukanOE.count())} peruntukan OE`);
  console.log(`   - ${(await db.waranPeruntukan.count())} waran peruntukan`);
  console.log(`   - ${(await db.perbelanjaanBulanan.count())} rekod perbelanjaan bulanan`);
  console.log(`   - ${(await db.virement.count())} virement`);
  console.log(`   - ${(await db.auditLog.count())} audit log`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
