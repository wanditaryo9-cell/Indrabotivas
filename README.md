
# 🤖 Indra Bot IVAS

Telegram Bot untuk mengelola SMS dari IVAS dengan mudah. Bot ini memungkinkan Anda mengambil daftar nomor dan SMS yang masuk langsung dari IVAS melalui Telegram.

## ✨ Fitur

- 📱 Ambil daftar nomor dari IVAS
- 📨 Lihat SMS yang masuk (termasuk OTP)
- 🔔 Notifikasi real-time untuk SMS baru
- 🔐 Login otomatis dengan Puppeteer
- 🌐 Handle Cloudflare secara otomatis

## 🚀 Instalasi

### Prerequisites
- Node.js v14 atau lebih tinggi
- npm atau yarn
- Akun IVAS dengan username & password
- Telegram Bot Token (dari @botfather)

### Steps

1. **Clone repository**
```bash
git clone https://github.com/wanditaryo9-cell/Indrabotivas.git
cd Indrabotivas
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

4. **Edit .env dengan kredensial Anda**
```bash
nano .env
```

Isi:
```
IVAS_EMAIL=your_email@gmail.com
IVAS_PASSWORD=your_password
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
POLLING_INTERVAL=30000
HEADLESS=true
```

5. **Jalankan bot**
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

## 📖 Cara Mendapatkan Credentials

### Telegram Bot Token
1. Buka Telegram → cari `@botfather`
2. Ketik `/newbot`
3. Ikuti instruksi
4. Copy token yang diberikan

### Telegram Chat ID
1. Buka Telegram → cari `@userinfobot`
2. Ketik `/start`
3. Bot akan menampilkan Chat ID Anda

## 💬 Perintah Bot

```
/start    - Tampilkan pesan sambutan
/help     - Tampilkan bantuan
/status   - Cek status koneksi
/getnumbers - Ambil daftar nomor dari "My Numbers"
/getsms   - Ambil SMS terbaru dari "SMS Received"
```

## 🔧 Cara Kerja

1. **Login** - Bot login ke IVAS menggunakan Puppeteer
2. **Scrape** - Mengambil data dari halaman IVAS
3. **Send** - Mengirim data ke Telegram
4. **Poll** - Otomatis cek SMS baru setiap 30 detik

## 📝 Struktur Projek

```
Indrabotivas/
├── bot.js          - Main bot file
├── scraper.js      - IVAS scraper dengan Puppeteer
├── package.json    - Dependencies
├── .env.example    - Template environment
├── .gitignore      - Git ignore rules
└── README.md       - Dokumentasi
```

## 🐛 Troubleshooting

### Bot tidak bisa login
- Cek username & password di `.env`
- Pastikan akun IVAS aktif
- Coba manual login ke https://ivassms.com

### Tidak ada SMS terdeteksi
- Halaman IVAS mungkin berubah struktur
- Edit selector di `scraper.js` sesuai struktur HTML terbaru

### Bot timeout
- Naikkan `POLLING_INTERVAL` di `.env`
- Cek koneksi internet

## 🔒 Security

- ⚠️ **Jangan share .env file Anda**
- Gunakan `.gitignore` untuk exclude sensitive files
- Ganti password IVAS secara berkala

## 📞 Support

Jika ada error atau pertanyaan, buka issue di repository ini.

## 📄 License

MIT License - Bebas digunakan untuk keperluan personal dan komersial

---

**Dibuat dengan ❤️ oleh wanditaryo9-cell**

Last Updated: 2026-06-08
