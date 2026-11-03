<div align="center">

# 🧠 CorpusSiteler

### 50 ücretsiz, gizlilik odaklı tarayıcı aracı

**PDF, OCR, güvenlik, üretkenlik ve daha fazlası — kurulum yok, hesap yok, izleme yok.**

[![MIT License](https://img.shields.io/badge/license-MIT-7c3aed.svg)](LICENSE)
![Araçlar](https://img.shields.io/badge/araçlar-50-8b5cf6)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)

[🇹🇷 Türkçe](#-türkçe) · [🇬🇧 English](#-english) · [🧰 Araçlar](#-araçlar)

⭐ Beğendiysen depoya yıldız vermeyi unutma! ⭐

</div>

---

## 🇹🇷 Türkçe

**CorpusSiteler**, günlük işler için hazırlanmış bağımsız web araçları koleksiyonudur. PDF ve belge düzenlemeden OCR taramaya, parola kasasından proje panolarına kadar farklı araçları tek depoda buluşturur.

### Neden CorpusSiteler?

- 🔒 **Gizlilik öncelikli:** Araçlar tarayıcıda çalışacak şekilde tasarlanmıştır; proje sunucu, hesap ve izleme gerektirmemeyi hedefler.
- ⚡ **Hızlı ve erişilebilir:** React, TypeScript ve Vite ile geliştirilmiştir.
- 🧩 **Bağımsız uygulamalar:** Her `corpus-*` klasörü kendi başına çalıştırılabilen bir uygulamadır.
- 🆓 **Ücretsiz ve açık kaynak:** MIT lisansı ile yayımlanır.

> **Gizlilik notu:** Araçların işleyişi farklılık gösterebilir. Hassas verilerle çalışmadan önce ilgili aracın davranışını ve tarayıcı izinlerini kontrol edin. P2P dosya aktarımı gibi özellikler başka bir cihazla bağlantı kurabilir.

### 🚀 Hızlı başlangıç

Önce depoyu klonlayın, ardından kullanmak istediğiniz uygulamanın klasörüne geçin:

```bash
git clone https://github.com/corpusproject/CorpusSiteler.git
cd CorpusSiteler/corpus-qr
npm install
npm run dev
```

Diğer bir aracı çalıştırmak için `corpus-qr` yerine aşağıdaki listeden ilgili klasör adını kullanın. Üretim derlemesi için uygulama klasöründe `npm run build` komutunu çalıştırın; çıktı `dist/` klasörüne yazılır.

### 🧰 Araçlar

| Kategori | Uygulamalar |
|---|---|
| 📄 **Belge ve ofis** | [PDF](corpus-pdf) · [Tarama / OCR](corpus-scan) · [CV](corpus-cv) · [Fatura](corpus-invoice) · [Sözleşme](corpus-contract) · [İmza](corpus-sign) · [Etiket](corpus-label) · [Sertifika](corpus-cert) |
| 🎨 **Medya ve tasarım** | [Ses](corpus-audio) · [Görsel](corpus-image) · [Ekran stüdyosu](corpus-screen) · [Mockup](corpus-mockup) · [İnfografik](corpus-infographic) · [Marka](corpus-brand) |
| 🔐 **Güvenlik ve gizlilik** | [Parola kasası](corpus-vault) · [Gizlilik](corpus-privacy) · [Pentest araçları](corpus-pentest) · [Güvenlik denetimi](corpus-audit) · [P2P aktarım](corpus-transfer) |
| 🧑‍💻 **Geliştirici araçları** | [DevTools](corpus-devtools) · [Diff](corpus-diff) · [Şema](corpus-schema) · [Yük testi](corpus-loadtest) · [Yerelleştirme](corpus-i18n) · [QR kod](corpus-qr) · [Prompt](corpus-prompt) |
| 📊 **Proje ve iş** | [Gantt](corpus-gantt) · [Kanban](corpus-kanban) · [Zihin haritası](corpus-mind) · [Etkinlik](corpus-event) · [Sunum taslağı](corpus-pitch) · [Cap table](corpus-captable) · [RFP](corpus-rfp) · [Postmortem](corpus-postmortem) |
| 💰 **Finans ve analiz** | [Hesap makinesi](corpus-calc) · [Kredi](corpus-credit) · [Bordro](corpus-payroll) · [Fiyatlandırma](corpus-pricing) · [BI](corpus-bi) · [A/B testi](corpus-abtest) |
| 🌍 **Operasyon ve sürdürülebilirlik** | [Filo](corpus-fleet) · [Lojistik](corpus-logistics) · [OEE](corpus-oee) · [Enerji](corpus-energy) · [Karbon](corpus-carbon) · [Bulut](corpus-cloud) · [Patent](corpus-patent) |
| 📣 **Pazarlama** | [SEO](corpus-seo) · [Sosyal medya](corpus-social) |

### 🛠️ Teknoloji

React 19 · TypeScript · Vite · Tailwind CSS · Lucide Icons · Oxlint

### 🗂️ Depo yapısı

```text
CorpusSiteler/
├── corpus-<araç>/       # Uygulama kaynak kodu ve package.json
│   ├── src/
│   ├── public/
│   └── dist/            # Üretim derlemesi
└── LICENSE
```

### 🤝 Katkıda bulunma

Hata bildirimleri ve fikirler için [issue açabilir](https://github.com/corpusproject/CorpusSiteler/issues), değişikliklerinizi pull request olarak gönderebilirsiniz.

### 📄 Lisans

[MIT](LICENSE)

---

## 🇬🇧 English

**CorpusSiteler** is a collection of independent browser-based tools for everyday work—from PDF and document tasks to OCR, privacy, development, and project planning.

### Why CorpusSiteler?

- 🔒 **Privacy-minded:** The tools are designed to run in your browser; the project aims to avoid requiring a backend, accounts, or tracking.
- ⚡ **Modern stack:** Built with React, TypeScript, and Vite.
- 🧩 **Independent apps:** Each `corpus-*` folder is a standalone application.
- 🆓 **Free and open source:** Released under the MIT license.

> **Privacy note:** Behavior can vary by tool. Review an app's behavior and browser permissions before using sensitive data. Features such as peer-to-peer file transfer may connect to another device.

### 🚀 Quick start

```bash
git clone https://github.com/corpusproject/CorpusSiteler.git
cd CorpusSiteler/corpus-qr
npm install
npm run dev
```

Replace `corpus-qr` with the folder for another app listed above. To create a production build, run `npm run build` inside that app's directory; the output is written to `dist/`.

### 🤝 Contributing

Bug reports and ideas are welcome via [GitHub Issues](https://github.com/corpusproject/CorpusSiteler/issues). Pull requests are welcome too.

### 📄 License

[MIT](LICENSE)

<div align="center">

**⭐ CorpusSiteler işinizi kolaylaştırıyorsa depoya yıldız vererek destek olabilirsiniz!**

</div>
