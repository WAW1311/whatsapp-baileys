import { Link } from 'react-router-dom'
import {
  Bot, QrCode, Send, Users, MessageSquareReply, KeyRound,
  Image, FileText, Mic, ShieldCheck, Zap, ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: KeyRound,
    title: 'Auth multi-user + API key',
    desc: 'Daftar, login, dan dapatkan API key pribadi. Tiap pengguna punya sesi WhatsApp-nya sendiri.',
    color: 'bg-neo-yellow',
  },
  {
    icon: QrCode,
    title: 'Konek via QR realtime',
    desc: 'Mulai sesi lalu scan QR. Status dan log tersambung langsung lewat socket, tanpa refresh.',
    color: 'bg-neo-violet',
  },
  {
    icon: Send,
    title: 'Kirim pesan personal',
    desc: 'Kirim teks ke nomor mana pun lewat satu endpoint. Nomor Indonesia dinormalkan otomatis.',
    color: 'bg-neo-red',
  },
  {
    icon: Users,
    title: 'Pesan & daftar grup',
    desc: 'Ambil daftar grup yang kamu ikuti dan kirim pesan ke grup lewat API.',
    color: 'bg-neo-yellow',
  },
  {
    icon: MessageSquareReply,
    title: 'Bot auto-reply keyword',
    desc: 'Definisikan perintah dan tanggapannya. Aktifkan bot, WhatsApp membalas pesan masuk otomatis.',
    color: 'bg-neo-violet',
  },
  {
    icon: ShieldCheck,
    title: 'Anti-ban Baileys',
    desc: 'Dibangun di atas Baileys dengan lapisan anti-ban untuk menjaga sesi tetap stabil.',
    color: 'bg-neo-red',
  },
]

const steps = [
  { n: '01', title: 'Daftar & ambil API key', desc: 'Buat akun, lalu salin API key dari dashboard untuk dipakai di setiap request.' },
  { n: '02', title: 'Scan QR WhatsApp', desc: 'Klik Start Session di dashboard, scan QR dari HP, sesi langsung aktif.' },
  { n: '03', title: 'Kirim pesan / nyalakan bot', desc: 'Panggil endpoint kirim pesan, atau aktifkan bot auto-reply berbasis keyword.' },
]

const mediaTypes = [
  { icon: Image, label: 'Gambar' },
  { icon: FileText, label: 'Dokumen' },
  { icon: Mic, label: 'Audio' },
  { icon: Send, label: 'Teks' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-neo-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-4 border-neo-ink bg-neo-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center border-2 border-neo-ink bg-neo-yellow shadow-neo-xs">
              <Bot strokeWidth={3} className="h-5 w-5" />
            </span>
            <span className="font-display text-xl tracking-tight">WAWBOT</span>
          </a>
          <nav className="hidden items-center gap-5 md:flex">
            <a href="#fitur" className="font-bold uppercase text-sm tracking-wide hover:bg-neo-yellow px-1">Fitur</a>
            <a href="#cara-kerja" className="font-bold uppercase text-sm tracking-wide hover:bg-neo-yellow px-1">Cara Kerja</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-sm">Masuk</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden border-b-4 border-neo-ink bg-neo-dots">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 border-2 border-neo-ink bg-neo-violet px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-neo-xs">
              <Zap strokeWidth={3} className="h-4 w-4" /> WhatsApp API + Bot
            </span>
            <h1 className="mt-5 font-display text-4xl leading-none tracking-tight sm:text-5xl md:text-6xl">
              Otomasikan WhatsApp lewat API-mu sendiri
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium">
              Hubungkan WhatsApp lewat QR, kirim pesan personal & grup, dan jalankan bot balas-otomatis berbasis keyword. Semua dari satu API.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary">
                Mulai Sekarang <ArrowRight strokeWidth={3} className="h-4 w-4" />
              </Link>
              <a href="#cara-kerja" className="btn">Lihat Cara Kerja</a>
            </div>
          </div>

          {/* Visual: mock request card */}
          <div className="relative">
            <div className="card rotate-1">
              <div className="mb-3 flex items-center gap-2 border-b-2 border-neo-ink pb-2">
                <span className="h-3 w-3 border-2 border-neo-ink bg-neo-red" />
                <span className="h-3 w-3 border-2 border-neo-ink bg-neo-yellow" />
                <span className="h-3 w-3 border-2 border-neo-ink bg-neo-violet" />
                <span className="ml-2 font-bold text-xs uppercase tracking-wide">POST /api/send-message</span>
              </div>
              <pre className="overflow-x-auto bg-neo-ink p-3 text-xs leading-relaxed text-neo-white"><code>{`{
  "number": "081234567890",
  "message": "Halo dari WAWBOT 👋"
}`}</code></pre>
              <div className="mt-3 flex items-center gap-2 border-2 border-neo-ink bg-neo-yellow px-3 py-2 text-sm font-extrabold">
                <ShieldCheck strokeWidth={3} className="h-4 w-4" /> 200 · status: true
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 -rotate-3 border-2 border-neo-ink bg-neo-red px-3 py-1 text-xs font-extrabold uppercase shadow-neo-xs">
              Realtime QR
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="border-b-4 border-neo-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Yang bisa kamu lakukan</h2>
            <p className="max-w-sm font-medium">Semua fitur di bawah ini benar-benar tersedia di API — bukan janji kosong.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="card transition-transform duration-100 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg"
              >
                <span className={`grid h-12 w-12 place-items-center border-[3px] border-neo-ink ${color} shadow-neo-xs`}>
                  <Icon strokeWidth={3} className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl tracking-tight">{title}</h3>
                <p className="mt-2 font-medium text-[0.95rem] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Media types strip */}
          <div className="mt-10 border-[3px] border-neo-ink bg-neo-white p-5 shadow-neo-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-display text-lg tracking-tight">Kirim beragam media:</span>
              <div className="flex flex-wrap gap-3">
                {mediaTypes.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 border-2 border-neo-ink bg-neo-cream px-3 py-1.5 text-sm font-bold uppercase tracking-wide">
                    <Icon strokeWidth={3} className="h-4 w-4" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="border-b-4 border-neo-ink bg-neo-violet bg-neo-grid">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Cara kerja, 3 langkah</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="border-[3px] border-neo-ink bg-neo-cream p-6 shadow-neo-sm">
                <span className="font-display text-4xl">{n}</span>
                <h3 className="mt-3 font-display text-xl tracking-tight">{title}</h3>
                <p className="mt-2 font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b-4 border-neo-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">
            Siap menyambungkan WhatsApp-mu?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg font-medium">
            Buat akun, ambil API key, dan kirim pesan pertamamu dalam hitungan menit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn btn-primary">
              Daftar Sekarang <ArrowRight strokeWidth={3} className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn">Sudah punya akun? Masuk</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neo-ink text-neo-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center border-2 border-neo-white bg-neo-yellow">
              <Bot strokeWidth={3} className="h-4 w-4 text-neo-ink" />
            </span>
            <span className="font-display text-lg">WAWBOT</span>
          </div>
          <p className="text-sm font-medium text-neo-white/80">
            WhatsApp API & bot auto-reply. Dibangun dengan Baileys.
          </p>
        </div>
      </footer>
    </div>
  )
}
