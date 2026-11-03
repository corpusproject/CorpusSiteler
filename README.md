<div align="center">

# 🧠 CorpusSiteler

### A privacy-first toolkit for everyday work

**50 free browser tools for documents, design, security, productivity, and development.**

No account required · No backend required · Built with React, TypeScript, and Vite

[![MIT License](https://img.shields.io/badge/license-MIT-8b5cf6?style=for-the-badge)](LICENSE)
![Tools](https://img.shields.io/badge/tools-50-6d5efc?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=white)

[🇹🇷 Türkçe](#-türkçe) · [🇬🇧 English](#-english) · [🧰 Tool directory](#-tool-directory) · [🚀 Quick start](#-quick-start)

**If CorpusSiteler is useful to you, consider giving the repo a ⭐**

</div>

---

## 🇹🇷 Türkçe

CorpusSiteler; belge düzenleme, tasarım, güvenlik, analiz ve üretkenlik işleri için **50 bağımsız web aracını** bir araya getirir. Her araç kendi `corpus-*` klasöründe yer alır ve ayrı ayrı geliştirilebilir, çalıştırılabilir ve derlenebilir.

### ✨ Öne çıkanlar

- **PDF Studio:** PDF düzenleme ve imzalama; sayfa sıralama, filigran, birleştirme ve sayfa ayıklama; ayrıca görsel, Word, PowerPoint ve tablo dosyalarından PDF oluşturma.
- **QR Studio:** vCard, Wi-Fi, web bağlantısı, WhatsApp, IBAN ve konum için QR üretme; tasarım düzenleme ve PNG, SVG ya da PDF dışa aktarma.
- **Geniş araç koleksiyonu:** OCR, görsel ve ses araçları, parola kasası, P2P dosya aktarımı, geliştirici araçları, finans ve proje yönetimi.
- **Bağımsız uygulamalar:** İhtiyacınız olan aracı seçip yalnızca onu çalıştırabilirsiniz.
- **Modern web teknolojileri:** React, TypeScript, Vite ve Lucide ikonları.
- **MIT lisansı:** Ücretsiz ve açık kaynak.

> **Gizlilik hakkında:** Araçlar istemci tarafında çalışacak şekilde tasarlanmıştır; ancak özellikler araca göre değişebilir. Hassas verilerle kullanmadan önce ilgili aracın davranışını ve tarayıcı izinlerini inceleyin. P2P dosya aktarımı, örneğin, başka bir cihazla bağlantı kurar.

### 🖼️ Görsel önizleme

Depoda bulunan QR Studio görseli:

<p align="center">
  <img src="corpus-qr/src/assets/hero.png" alt="Corpus QR Studio görsel önizlemesi" width="360" />
</p>

> Gerçek arayüz ekran görüntüsü eklemek için uygulamayı çalıştırıp ekran görüntüsünü `docs/screenshots/` altında saklayın ve bu görseli o dosyaya yönlendirin.

### 🚀 Hızlı başlangıç

```bash
git clone https://github.com/corpusproject/CorpusSiteler.git
cd CorpusSiteler/corpus-pdf
npm install
npm run dev
```

Başka bir aracı çalıştırmak için `corpus-pdf` yerine [araç dizinindeki](#-tool-directory) klasör adını kullanın. Üretim derlemesini ilgili uygulama klasöründe alın:

```bash
npm run build
```

Derleme çıktısı uygulamanın `dist/` klasörüne yazılır. Geliştirme ve derleme komutları her uygulamanın kendi `package.json` dosyasından yürütülür.

### 🧰 Tool directory

| Kategori | Araçlar |
|---|---|
| 📄 **Belge ve ofis** | [PDF](corpus-pdf) · [Tarama / OCR](corpus-scan) · [CV](corpus-cv) · [Fatura](corpus-invoice) · [Sözleşme](corpus-contract) · [İmza](corpus-sign) · [Etiket](corpus-label) · [Sertifika](corpus-cert) |
| 🎨 **Medya ve tasarım** | [Ses](corpus-audio) · [Görsel](corpus-image) · [Ekran stüdyosu](corpus-screen) · [Mockup](corpus-mockup) · [İnfografik](corpus-infographic) · [Marka](corpus-brand) |
| 🔐 **Güvenlik ve gizlilik** | [Parola kasası](corpus-vault) · [Gizlilik](corpus-privacy) · [Pentest](corpus-pentest) · [Denetim](corpus-audit) · [P2P aktarım](corpus-transfer) |
| 🧑‍💻 **Geliştirici araçları** | [DevTools](corpus-devtools) · [Diff](corpus-diff) · [Şema](corpus-schema) · [Yük testi](corpus-loadtest) · [Yerelleştirme](corpus-i18n) · [QR](corpus-qr) · [Prompt](corpus-prompt) |
| 📊 **Proje ve iş** | [Gantt](corpus-gantt) · [Kanban](corpus-kanban) · [Zihin haritası](corpus-mind) · [Etkinlik](corpus-event) · [Sunum taslağı](corpus-pitch) · [Cap table](corpus-captable) · [RFP](corpus-rfp) · [Postmortem](corpus-postmortem) |
| 💰 **Finans ve analiz** | [Hesap makinesi](corpus-calc) · [Kredi](corpus-credit) · [Bordro](corpus-payroll) · [Fiyatlandırma](corpus-pricing) · [BI](corpus-bi) · [A/B testi](corpus-abtest) |
| 🌍 **Operasyon ve sürdürülebilirlik** | [Filo](corpus-fleet) · [Lojistik](corpus-logistics) · [OEE](corpus-oee) · [Enerji](corpus-energy) · [Karbon](corpus-carbon) · [Bulut](corpus-cloud) · [Patent](corpus-patent) |
| 📣 **Pazarlama** | [SEO](corpus-seo) · [Sosyal medya](corpus-social) |

### 🗂️ Depo yapısı

```text
CorpusSiteler/
├── corpus-<tool>/       # bağımsız uygulama
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── dist/            # üretim derlemesi
└── LICENSE
```

### 🤝 Katkıda bulunma

Hata bildirimleri ve geliştirme fikirleri için [issue açın](https://github.com/corpusproject/CorpusSiteler/issues); katkılarınızı pull request olarak gönderebilirsiniz.

### 📄 Lisans

[MIT](LICENSE)

---

## 🇬🇧 English

CorpusSiteler brings together **50 independent browser tools** for documents, design, security, analytics, and productivity. Each app lives in its own `corpus-*` directory and can be developed, run, and built independently.

### ✨ Highlights

- **PDF Studio:** Edit and sign PDFs, manage pages, add watermarks, merge or extract pages, and convert images, Word, PowerPoint, and spreadsheet files to PDF.
- **QR Studio:** Create QR codes for vCards, Wi-Fi, URLs, WhatsApp, IBANs, and locations; customize the design and export to PNG, SVG, or PDF.
- **A broad toolkit:** OCR, image and audio tools, a password vault, P2P file transfer, developer utilities, finance, and project planning.
- **Choose what you need:** Each app is a separate project you can run on its own.
- **Modern stack:** React, TypeScript, Vite, and Lucide icons.
- **MIT licensed:** Free and open source.

> **Privacy note:** Apps are designed to run client-side, but behavior varies by tool. Review an app's behavior and browser permissions before using sensitive data. P2P file transfer, for example, connects with another device.

### 🖼️ Visual preview

The QR Studio visual asset included in this repository:

<p align="center">
  <img src="corpus-qr/src/assets/hero.png" alt="Corpus QR Studio visual preview" width="360" />
</p>

> To add an actual UI screenshot, capture the app while running, save it under `docs/screenshots/`, and update the image path above.

### 🚀 Quick start

```bash
git clone https://github.com/corpusproject/CorpusSiteler.git
cd CorpusSiteler/corpus-pdf
npm install
npm run dev
```

Replace `corpus-pdf` with another app directory from the [tool directory](#-tool-directory). To create a production build, run this inside the selected app's directory:

```bash
npm run build
```

The build output is written to that app's `dist/` directory. Run development and build commands from the individual app folder; each app has its own `package.json`.

### 🤝 Contributing

Open a [GitHub Issue](https://github.com/corpusproject/CorpusSiteler/issues) to report bugs or suggest improvements. Pull requests are welcome.

### 📄 License

[MIT](LICENSE)

<div align="center">

**⭐ Beğendiysen yıldız ver · Star the repo if you find it useful ⭐**

</div>
