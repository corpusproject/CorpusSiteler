<div align="center">

# 🧠 Corpus — 50 Free, Private, In-Browser Pro Tools

**50 modern web apps. Zero backend. Zero tracking. Your data never leaves your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
![Apps](https://img.shields.io/badge/apps-50-8b5cf6)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-10b981)

[🇹🇷 Türkçe](#-türkçe) · [🇬🇧 English](#-english) · [📦 Uygulamalar / Apps](#-uygulamalar--apps)

⭐ **Beğendiysen repoya yıldız vermeyi unutma! / If you like it, give it a star!** ⭐

</div>

---

## 🇬🇧 English

**Corpus** is a collection of 50 production-grade, single-purpose web tools — from a PDF studio and OCR scanner to an encrypted password vault, P2P file transfer, Gantt/Kanban boards, invoice and contract generators. Every app shares one dark, Linear/Raycast-inspired [design system](CORPUS_DESIGN_SYSTEM.md) and runs **entirely client-side**.

### ✨ Why Corpus?
- 🔒 **Privacy-first** – no servers, no accounts, no analytics. Files are processed locally.
- ⚡ **Blazing fast** – Vite + React 19, static output, deploy anywhere.
- 🎨 **Consistent design** – one unified dark-mode design language across all 50 apps.
- 🧩 **Independent** – every app is a standalone Vite project; take one or take all.
- 🆓 **Free & open source** – MIT licensed.

### 🚀 Quick start
```bash
git clone https://github.com/corpusproject/corpus.git
cd corpus/corpus-qr      # pick any app
npm install
npm run dev              # http://localhost:5173
```
Build for production: `npm run build` (output in `dist/`).
Build every app at once: `./build-all.sh` (macOS/Linux) or `./build-all.ps1` (Windows).

### 🌐 Deploy
Each app is a static site — deploy a folder to **Vercel**, **Netlify**, **Cloudflare Pages** or **GitHub Pages** (build command `npm run build`, output dir `dist`).

---

## 🇹🇷 Türkçe

**Corpus**, 50 adet profesyonel, tek amaçlı web aracından oluşan bir koleksiyondur: PDF stüdyosu, OCR tarayıcı, şifreli parola kasası, P2P dosya transferi, Gantt/Kanban panoları, fatura ve sözleşme oluşturucular ve daha fazlası. Tüm uygulamalar aynı koyu temalı, Linear/Raycast esintili [tasarım sistemini](CORPUS_DESIGN_SYSTEM.md) kullanır ve **tamamen tarayıcınızda** çalışır.

### ✨ Neden Corpus?
- 🔒 **Gizlilik öncelikli** – sunucu yok, hesap yok, takip yok. Dosyalar yerelde işlenir.
- ⚡ **Çok hızlı** – Vite + React 19, statik çıktı, her yere yüklenebilir.
- 🎨 **Tutarlı tasarım** – 50 uygulamada ortak koyu tema.
- 🧩 **Bağımsız** – her uygulama kendi başına bir Vite projesidir.
- 🆓 **Ücretsiz ve açık kaynak** – MIT lisanslı.

### 🚀 Hızlı başlangıç
```bash
git clone https://github.com/<kullanici-adin>/corpus.git
cd corpus/corpus-qr      # istediğin uygulamayı seç
npm install
npm run dev
```

---

## 📦 Uygulamalar / Apps

| Kategori | Uygulamalar |
|---|---|
| 📄 **Belge & Ofis** | [`pdf`](corpus-pdf) · [`scan`](corpus-scan) (OCR) · [`cv`](corpus-cv) (CV/Resume) · [`invoice`](corpus-invoice) · [`contract`](corpus-contract) · [`sign`](corpus-sign) (E-imza) · [`rfp`](corpus-rfp) · [`cert`](corpus-cert) · [`patent`](corpus-patent) · [`label`](corpus-label) |
| 🎬 **Medya** | [`audio`](corpus-audio) · [`image`](corpus-image) · [`screen`](corpus-screen) · [`mockup`](corpus-mockup) · [`infographic`](corpus-infographic) · [`brand`](corpus-brand) · [`qr`](corpus-qr) |
| 🔐 **Güvenlik & Gizlilik** | [`vault`](corpus-vault) · [`privacy`](corpus-privacy) · [`pentest`](corpus-pentest) · [`audit`](corpus-audit) · [`transfer`](corpus-transfer) (P2P) |
| 🧑‍💻 **Geliştirici** | [`devtools`](corpus-devtools) · [`diff`](corpus-diff) · [`schema`](corpus-schema) · [`diagram`](corpus-diagram) · [`loadtest`](corpus-loadtest) · [`i18n`](corpus-i18n) · [`prompt`](corpus-prompt) · [`cloud`](corpus-cloud) · [`postmortem`](corpus-postmortem) |
| 📊 **Proje & İş** | [`gantt`](corpus-gantt) · [`kanban`](corpus-kanban) · [`mind`](corpus-mind) (zihin haritası) · [`event`](corpus-event) · [`pitch`](corpus-pitch) · [`captable`](corpus-captable) |
| 💰 **Finans & Analiz** | [`calc`](corpus-calc) · [`credit`](corpus-credit) · [`payroll`](corpus-payroll) · [`pricing`](corpus-pricing) · [`bi`](corpus-bi) · [`abtest`](corpus-abtest) |
| 🌍 **Operasyon & Sürdürülebilirlik** | [`fleet`](corpus-fleet) · [`logistics`](corpus-logistics) · [`oee`](corpus-oee) · [`energy`](corpus-energy) · [`carbon`](corpus-carbon) |
| 📣 **Pazarlama** | [`seo`](corpus-seo) · [`social`](corpus-social) |

## 🛠️ Tech Stack
React 19 · TypeScript · Vite · Tailwind CSS 4 · Lucide Icons · Oxlint

## 🗂️ Repo Structure
```
corpus/
├── corpus-<app>/          # each app: src/, public/, index.html, package.json
├── CORPUS_DESIGN_SYSTEM.md
├── build-all.sh / .ps1
└── LICENSE
```

## 🤝 Contributing
Contributions are welcome! Open an issue for bugs/ideas, or send a PR. 

## 📄 License
[MIT](LICENSE)

<div align="center">

**⭐ If Corpus saves you time, please star the repo — it helps others find it! ⭐**

</div>
