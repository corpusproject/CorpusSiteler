import * as XLSX from 'xlsx';

export type LegalDocType =
  | 'kvkk-aydinlatma'
  | 'acik-riza'
  | 'gdpr-privacy'
  | 'cookie-policy'
  | 'terms-of-service'
  | 'retention-policy';

export type DataCategoryId =
  | 'identity'
  | 'contact'
  | 'financial'
  | 'transaction'
  | 'security_log'
  | 'marketing'
  | 'location'
  | 'biometric'
  | 'ai_prompts';

export type CookieCategory = 'strictly_necessary' | 'analytics' | 'functional' | 'marketing';

export interface DataInventoryRow {
  id: string;
  categoryId: DataCategoryId;
  categoryName: string;
  dataFields: string;
  dataSubjectGroup: string;
  processingPurpose: string;
  legalBasisKvkk: string;
  legalBasisGdpr: string;
  retentionPeriod: string;
  destructionMethod: string;
  recipients: string;
  crossBorderTransfer: boolean;
  encryptionStandard: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
}

export interface CookieItem {
  id: string;
  name: string;
  provider: string;
  category: CookieCategory;
  duration: string;
  purpose: string;
  firstParty: boolean;
  enabled: boolean;
}

export interface SubProcessor {
  id: string;
  name: string;
  serviceType: string;
  country: string;
  transferMechanism: 'SCC (Standard Contractual Clauses)' | 'EU-US Data Privacy Framework' | 'Yurt İçi (TR) Sunucu' | 'Açık Rıza / Taahhütname';
  dpaSigned: boolean;
  soc2IsoCertified: boolean;
}

export interface CookieBannerConfig {
  position: 'bottom-bar' | 'bottom-right-card' | 'center-modal';
  theme: 'obsidian-dark' | 'clean-light' | 'emerald-trust' | 'royal-indigo';
  brandColor: string;
  headline: string;
  description: string;
  acceptAllLabel: string;
  rejectAllLabel: string;
  customizeLabel: string;
  googleConsentModeV2: boolean;
  iysIntegration: boolean;
  autoBlockScripts: boolean;
  consentExpiryDays: number;
}

export interface PrivacyProject {
  id: string;
  companyName: string;
  tradeRegistryNo: string;
  mersisNo: string;
  taxOfficeAndNo: string;
  headquartersAddress: string;
  websiteUrl: string;
  appName: string;
  dpoName: string;
  dpoEmail: string;
  kepAddress: string;
  verbisRegistered: boolean;
  jurisdictionCity: string;
  effectiveDate: string;
  version: string;
  inventory: DataInventoryRow[];
  cookies: CookieItem[];
  subProcessors: SubProcessor[];
  bannerConfig: CookieBannerConfig;
}

export const COOKIE_CATEGORY_META: Record<
  CookieCategory,
  { label: string; badgeColor: string; mandatory: boolean; desc: string }
> = {
  strictly_necessary: {
    label: 'Zorunlu (Kesinlikle Gerekli)',
    badgeColor: '#10b981',
    mandatory: true,
    desc: 'Oturum güvenliği, CSRF koruması, yük dengeleme ve çerez tercihlerinin saklanması için zorunludur.',
  },
  functional: {
    label: 'İşlevsel & Tercih Çerezleri',
    badgeColor: '#38bdf8',
    mandatory: false,
    desc: 'Dil seçimi, karanlık tema tercihi ve bölgesel saat dilimi ayarlarını hatırlar.',
  },
  analytics: {
    label: 'Performans & Analitik Çerezler',
    badgeColor: '#8b5cf6',
    mandatory: false,
    desc: 'Ziyaretçi trafiğini, sayfa kalma sürelerini ve hata oranlarını anonim olarak ölçer.',
  },
  marketing: {
    label: 'Hedefleme & Pazarlama Çerezleri',
    badgeColor: '#f59e0b',
    mandatory: false,
    desc: 'Reklam kampanya dönüşümlerini (ROI) ve yeniden hedefleme (Retargeting) kitlelerini yönetir.',
  },
};

export const PRIVACY_PRESETS: Record<string, PrivacyProject> = {
  'b2b-ai-saas': {
    id: 'b2b-ai-saas',
    companyName: 'Corpus Bulut Bilişim ve Yapay Zeka Teknolojileri A.Ş.',
    tradeRegistryNo: 'İstanbul Ticaret Sicili - 984120-5',
    mersisNo: '0215098412000018',
    taxOfficeAndNo: 'Maslak V.D. - 2150984120',
    headquartersAddress: 'Büyükdere Cad. No: 199 Levent Loft Kat: 14 Şişli / İstanbul',
    websiteUrl: 'https://corpus.suite',
    appName: 'Corpus Enterprise Cloud & AI Studio',
    dpoName: 'Av. Elif T. (Veri Koruma Görevlisi / DPO)',
    dpoEmail: 'kvkk@corpus.suite',
    kepAddress: 'corpusbilisim@hs01.kep.tr',
    verbisRegistered: true,
    jurisdictionCity: 'İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri',
    effectiveDate: '2026-10-18',
    version: 'v5.4 Kurumsal Uyumluluk Sürümü',
    inventory: [
      {
        id: 'inv-1',
        categoryId: 'identity',
        categoryName: 'Kimlik Bilgileri (01)',
        dataFields: 'Ad, Soyad, TCKN (Kurumsal Yetkili), İmza Sirküleri, Doğum Tarihi',
        dataSubjectGroup: 'Müşteri Yetkilileri, Son Kullanıcılar, Tedarikçiler',
        processingPurpose: 'Sözleşme süreçlerinin yürütülmesi, elektronik imza ve kullanıcı hesabı doğrulaması',
        legalBasisKvkk: 'KVKK m.5/2-(c) Sözleşmenin kurulması veya ifası',
        legalBasisGdpr: 'GDPR Art. 6(1)(b) Performance of a contract',
        retentionPeriod: 'Sözleşme bitiminden itibaren 10 Yıl (TBK m.146 / TTK m.82)',
        destructionMethod: 'Kriptografik Silme (Crypto-Shredding) + Periyodik Veritabanı Purge',
        recipients: 'Gelir İdaresi Başkanlığı (e-Fatura), Yetkili Kamu Kurumları',
        crossBorderTransfer: false,
        encryptionStandard: 'AES-256-GCM (HSM KMS)',
        riskLevel: 'MEDIUM',
        enabled: true,
      },
      {
        id: 'inv-2',
        categoryId: 'contact',
        categoryName: 'İletişim Bilgileri (02)',
        dataFields: 'Kurumsal E-Posta, Cep Telefonu (2FA SMS), Şirket Adresi, KEP Adresi',
        dataSubjectGroup: 'Abone Kullanıcılar, Potansiyel Müşteriler, İş Ortakları',
        processingPurpose: 'Müşteri destek süreçleri, 2FA güvenlik doğrulaması, sistem bildirimleri',
        legalBasisKvkk: 'KVKK m.5/2-(c) ve m.5/2-(f) Meşru Menfaat',
        legalBasisGdpr: 'GDPR Art. 6(1)(f) Legitimate interests',
        retentionPeriod: '10 Yıl (Ticari İlişki Süresince + Zamanaşımı)',
        destructionMethod: 'Otomatik Anonimleştirme & Maskeleme',
        recipients: 'İleti Yönetim Sistemi (İYS A.Ş.), Kurumsal E-Posta Altyapısı',
        crossBorderTransfer: false,
        encryptionStandard: 'TLS 1.3 + AES-256',
        riskLevel: 'LOW',
        enabled: true,
      },
      {
        id: 'inv-3',
        categoryId: 'security_log',
        categoryName: 'İşlem Güvenliği & SIEM Logları (05)',
        dataFields: 'IP Adresi, Oturum Jetonu (JWT Hash), Giriş/Çıkış Zaman Damgası, API Erişim Kayıtları',
        dataSubjectGroup: 'Web Ziyaretçileri, Uygulama Kullanıcıları, Sistem Yöneticileri',
        processingPurpose: '5651 sayılı Kanun uyumu, siber saldırı tespiti, SOC2 denetim izi oluşturulması',
        legalBasisKvkk: 'KVKK m.5/2-(a) Kanunlarda açıkça öngörülmesi ve m.5/2-(ç) Hukuki yükümlülük',
        legalBasisGdpr: 'GDPR Art. 6(1)(c) Legal obligation & Art. 32 Security',
        retentionPeriod: '2 Yıl (5651 Sayılı Kanun Zorunlu Süresi)',
        destructionMethod: 'WORM Süresi Sonunda Otomatik S3 Object Imha',
        recipients: 'BTK, Siber Olaylara Müdahale Ekibi (USOM / SOME)',
        crossBorderTransfer: false,
        encryptionStandard: 'SHA-256 Zaman Damgalı WORM Depolama',
        riskLevel: 'HIGH',
        enabled: true,
      },
      {
        id: 'inv-4',
        categoryId: 'financial',
        categoryName: 'Finans & Ödeme Verileri (08)',
        dataFields: 'IBAN, Vergi No, Maskelenmiş Kart Bilgisi (İlk 6 / Son 4 Hane), Fatura Geçmişi',
        dataSubjectGroup: 'Kurumsal Müşteriler, Aboneler',
        processingPurpose: 'Abonelik tahsilatı, e-Fatura/e-Arşiv düzenlenmesi, muhasebe mutabakatı',
        legalBasisKvkk: 'KVKK m.5/2-(ç) Hukuki yükümlülük (VUK m.253)',
        legalBasisGdpr: 'GDPR Art. 6(1)(c) Tax & Accounting compliance',
        retentionPeriod: '10 Yıl (TTK m.82 / VUK m.253)',
        destructionMethod: 'PCI-DSS Token İptali + Mali Arşiv İmhası',
        recipients: 'BDDK Lisanslı Ödeme Kuruluşu, Mali Müşavirlik, GİB',
        crossBorderTransfer: false,
        encryptionStandard: 'PCI-DSS Level 1 Tokenization',
        riskLevel: 'CRITICAL',
        enabled: true,
      },
      {
        id: 'inv-5',
        categoryId: 'ai_prompts',
        categoryName: 'Yapay Zeka İstem (Prompt) & Doküman Verileri (14)',
        dataFields: 'Kullanıcı Sorguları, Yüklenen Doküman Vektörleri (Embeddings), AI Çıktıları',
        dataSubjectGroup: 'Uygulama Kullanıcıları',
        processingPurpose: 'RAG tabanlı kurumsal arama ve üretken yapay zeka asistanı hizmetinin sunulması',
        legalBasisKvkk: 'KVKK m.5/1 Açık Rıza ve m.9 Yurt Dışı Standart Sözleşme',
        legalBasisGdpr: 'GDPR Art. 6(1)(a) Explicit Consent & Art. 46 SCCs',
        retentionPeriod: '30 Gün (Sıfır Veri Saklama / Zero-Data-Retention Modunda 0 Gün)',
        destructionMethod: 'Anlık Vektör İndeks Silme (Qdrant Hard Delete)',
        recipients: 'Bulut AI Çıkarım Sunucuları (AB Frankfurt Bölgesi)',
        crossBorderTransfer: true,
        encryptionStandard: 'Müşteri Yönetimli Anahtar (CMK) + TLS 1.3',
        riskLevel: 'CRITICAL',
        enabled: true,
      },
      {
        id: 'inv-6',
        categoryId: 'marketing',
        categoryName: 'Pazarlama & Çerez Analitik Verileri (12)',
        dataFields: 'Kampanya UTM Parametreleri, Çerez Kimliği, Ürün İçi Tıklama Isı Haritası',
        dataSubjectGroup: 'Web Ziyaretçileri, Bülten Aboneleri',
        processingPurpose: 'Ürün deneyiminin iyileştirilmesi, dönüşüm optimizasyonu ve izinli bülten gönderimi',
        legalBasisKvkk: 'KVKK m.5/1 Açık Rıza (CMP Çerez Onayı)',
        legalBasisGdpr: 'GDPR Art. 6(1)(a) Consent & ePrivacy Directive',
        retentionPeriod: '13 Ay (Çerez Ömrü Sonunda Otomatik Silinir)',
        destructionMethod: 'Tarayıcı LocalStorage / Cookie Otomatik Temizleme',
        recipients: 'Analitik Sağlayıcıları (Anonim IP ile)',
        crossBorderTransfer: true,
        encryptionStandard: 'IP Anonimleştirme (Son Oktet Maskeleme)',
        riskLevel: 'MEDIUM',
        enabled: true,
      },
    ],
    cookies: [
      {
        id: 'ck-1',
        name: '__Host-corpus_sess',
        provider: 'corpus.suite (1. Parti)',
        category: 'strictly_necessary',
        duration: 'Oturum Süresince (Session)',
        purpose: 'HttpOnly, Secure ve SameSite=Strict bayraklı kriptografik oturum kimliği.',
        firstParty: true,
        enabled: true,
      },
      {
        id: 'ck-2',
        name: 'corpus_cmp_consent_v2',
        provider: 'corpus.suite (1. Parti)',
        category: 'strictly_necessary',
        duration: '180 Gün',
        purpose: 'Kullanıcının KVKK/GDPR çerez onay tercihlerini ve zaman damgasını saklar.',
        firstParty: true,
        enabled: true,
      },
      {
        id: 'ck-3',
        name: 'corpus_ui_theme_locale',
        provider: 'corpus.suite (1. Parti)',
        category: 'functional',
        duration: '1 Yıl',
        purpose: 'Karanlık/Aydınlık stüdyo teması ve TR/EN arayüz dili tercihini korur.',
        firstParty: true,
        enabled: true,
      },
      {
        id: 'ck-4',
        name: '_ga / _ga_CORPUS2026',
        provider: 'Google Ireland Ltd. (GA4)',
        category: 'analytics',
        duration: '13 Ay',
        purpose: 'Google Consent Mode v2 uyumlu, IP maskeli sayfa görüntüleme ve huni analitiği.',
        firstParty: false,
        enabled: true,
      },
      {
        id: 'ck-5',
        name: 'ph_corpus_posthog',
        provider: 'PostHog EU Cloud (Frankfurt)',
        category: 'analytics',
        duration: '1 Yıl',
        purpose: 'AB sınırları içinde barındırılan ürün özellik kullanım istatistikleri.',
        firstParty: false,
        enabled: true,
      },
      {
        id: 'ck-6',
        name: '_gcl_au / li_fat_id',
        provider: 'Google Ads & LinkedIn Insight',
        category: 'marketing',
        duration: '90 Gün',
        purpose: 'B2B kurumsal reklam dönüşüm takibi (Yalnızca açık rıza verildiğinde yüklenir).',
        firstParty: false,
        enabled: true,
      },
    ],
    subProcessors: [
      {
        id: 'sp-1',
        name: 'Amazon Web Services EMEA SARL (Frankfurt eu-central-1)',
        serviceType: 'Bulut Sunucu, KMS Şifreleme & Veritabanı Barındırma',
        country: 'Almanya (Avrupa Birliği)',
        transferMechanism: 'SCC (Standard Contractual Clauses)',
        dpaSigned: true,
        soc2IsoCertified: true,
      },
      {
        id: 'sp-2',
        name: 'Turkcell Dijital İş Servisleri (Gebze Tier-4 Veri Merkezi)',
        serviceType: 'Birincil Türkiye Veritabanı & Felaket Kurtarma (DR)',
        country: 'Türkiye',
        transferMechanism: 'Yurt İçi (TR) Sunucu',
        dpaSigned: true,
        soc2IsoCertified: true,
      },
      {
        id: 'sp-3',
        name: 'iyzico Ödeme Hizmetleri A.Ş. / Stripe Payments Europe',
        serviceType: 'PCI-DSS Level 1 Kredi Kartı Tahsilat & Abonelik Altyapısı',
        country: 'Türkiye / İrlanda',
        transferMechanism: 'SCC (Standard Contractual Clauses)',
        dpaSigned: true,
        soc2IsoCertified: true,
      },
      {
        id: 'sp-4',
        name: 'Cloudflare Inc. (Global Anycast WAF & DDoS)',
        serviceType: 'Siber Güvenlik Duvarı (WAF), Bot Koruması ve SSL/TLS',
        country: 'ABD / AB Edge Düğümleri',
        transferMechanism: 'EU-US Data Privacy Framework',
        dpaSigned: true,
        soc2IsoCertified: true,
      },
    ],
    bannerConfig: {
      position: 'bottom-bar',
      theme: 'obsidian-dark',
      brandColor: '#10b981',
      headline: 'Veri Gizliliğiniz ve Çerez Tercihleriniz Kontrolünüzde',
      description:
        '6698 sayılı KVKK ve AB GDPR kapsamında; platform güvenliğini sağlamak için zorunlu çerezleri, açık rızanız olması halinde ise deneyiminizi geliştirmek amacıyla analitik ve pazarlama çerezlerini kullanıyoruz.',
      acceptAllLabel: 'Tümünü Kabul Et',
      rejectAllLabel: 'Zorunlu Olmayanları Reddet',
      customizeLabel: 'Tercihleri Yönet',
      googleConsentModeV2: true,
      iysIntegration: true,
      autoBlockScripts: true,
      consentExpiryDays: 180,
    },
  },
  'fintech-mobile-app': {
    id: 'fintech-mobile-app',
    companyName: 'NovaPay Elektronik Para ve Ödeme Hizmetleri A.Ş.',
    tradeRegistryNo: 'İstanbul Ticaret Sicili - 441920-0',
    mersisNo: '0632044192000019',
    taxOfficeAndNo: 'Büyük Mükellefler V.D. - 6320441920',
    headquartersAddress: 'Finanskent Mah. İstanbul Finans Merkezi B Blok Kat: 22 Ümraniye / İstanbul',
    websiteUrl: 'https://novapay.com.tr',
    appName: 'NovaPay Dijital Cüzdan & Açık Bankacılık',
    dpoName: 'Uyum ve İç Kontrol Direktörlüğü (MASAK / KVKK)',
    dpoEmail: 'uyum@novapay.com.tr',
    kepAddress: 'novapay@hs03.kep.tr',
    verbisRegistered: true,
    jurisdictionCity: 'İstanbul Anadolu Mahkemeleri ve İcra Daireleri',
    effectiveDate: '2026-10-18',
    version: 'v8.1 BDDK & MASAK Uyumlu Sürüm',
    inventory: [
      {
        id: 'fin-1',
        categoryId: 'identity',
        categoryName: 'Kimlik & Biyometrik KYC Verileri (01/13)',
        dataFields: 'TCKN, Çipli Kimlik NFC Verisi, Canlılık Yüz Doğrulama Videosu',
        dataSubjectGroup: 'Cüzdan Hesap Sahipleri',
        processingPurpose: '5549 sayılı MASAK Kanunu ve BDDK Uzaktan Kimlik Tespiti Yönetmeliği uyumu',
        legalBasisKvkk: 'KVKK m.5/2-(a) Kanunlarda açıkça öngörülmesi ve m.6 Açık Rıza',
        legalBasisGdpr: 'GDPR Art. 6(1)(c) AML/KYC Legal Obligation & Art. 9(2)(a)',
        retentionPeriod: '10 Yıl (MASAK m.8 Yasal Saklama Süresi)',
        destructionMethod: 'HSM Anahtar İmhası + Donanımsal Disk Sıfırlama',
        recipients: 'MASAK, TCMB, BDDK, BKM',
        crossBorderTransfer: false,
        encryptionStandard: 'FIPS 140-3 Level 3 HSM',
        riskLevel: 'CRITICAL',
        enabled: true,
      },
      {
        id: 'fin-2',
        categoryId: 'transaction',
        categoryName: 'Finansal İşlem & IBAN Transfer Kayıtları (08)',
        dataFields: 'FAST/EFT Dekontları, Cüzdan Bakiyesi, POS Harcama Geçmişi, Fraud Risk Skoru',
        dataSubjectGroup: 'Bireysel ve Ticari Kullanıcılar',
        processingPurpose: '6493 sayılı Kanun kapsamında ödeme ve elektronik para ihracı hizmetlerinin yürütülmesi',
        legalBasisKvkk: 'KVKK m.5/2-(c) Sözleşmenin ifası ve m.5/2-(ç) Hukuki yükümlülük',
        legalBasisGdpr: 'GDPR Art. 6(1)(b) & Art. 6(1)(c)',
        retentionPeriod: '10 Yıl (6493 Sayılı Kanun & TTK)',
        destructionMethod: 'Soğuk Arşiv Süresi Sonunda Kriptografik İmha',
        recipients: 'TCMB FAST Sistemi, BKM, Anlaşmalı Bankalar',
        crossBorderTransfer: false,
        encryptionStandard: 'AES-256 + Çift Kayıtlı Değiştirilemez Defter',
        riskLevel: 'HIGH',
        enabled: true,
      },
    ],
    cookies: [
      {
        id: 'fck-1',
        name: '__Host-novapay_device_fp',
        provider: 'novapay.com.tr (1. Parti)',
        category: 'strictly_necessary',
        duration: '1 Yıl',
        purpose: 'BDDK Bilgi Sistemleri Tebliği kapsamında dolandırıcılık (Fraud) önleme ve cihaz doğrulama.',
        firstParty: true,
        enabled: true,
      },
    ],
    subProcessors: [
      {
        id: 'fsp-1',
        name: 'TCMB & Bankalararası Kart Merkezi (BKM A.Ş.)',
        serviceType: 'Ulusal Ödeme Takas, FAST ve 3D Secure Doğrulama',
        country: 'Türkiye',
        transferMechanism: 'Yurt İçi (TR) Sunucu',
        dpaSigned: true,
        soc2IsoCertified: true,
      },
    ],
    bannerConfig: {
      position: 'bottom-right-card',
      theme: 'emerald-trust',
      brandColor: '#059669',
      headline: 'BDDK & KVKK Güvenlik ve Çerez Bildirimi',
      description:
        'Finansal işlemlerinizin güvenliği için zorunlu siber güvenlik çerezleri kullanılmaktadır. Analitik çerez tercihlerinizi dilediğiniz an değiştirebilirsiniz.',
      acceptAllLabel: 'Kabul Et ve Devam Et',
      rejectAllLabel: 'Sadece Zorunlu Çerezler',
      customizeLabel: 'Ayarlar',
      googleConsentModeV2: true,
      iysIntegration: true,
      autoBlockScripts: true,
      consentExpiryDays: 365,
    },
  },
};

export function calculatePrivacyMetrics(project: PrivacyProject) {
  const activeInventory = project.inventory.filter((i) => i.enabled);
  const activeCookies = project.cookies.filter((c) => c.enabled);
  const crossBorderCount = activeInventory.filter((i) => i.crossBorderTransfer).length;
  const criticalDataCount = activeInventory.filter((i) => i.riskLevel === 'CRITICAL').length;

  let complianceScore = 70;
  if (project.verbisRegistered) complianceScore += 8;
  if (project.dpoEmail && project.kepAddress) complianceScore += 7;
  if (project.bannerConfig.googleConsentModeV2) complianceScore += 5;
  if (project.bannerConfig.autoBlockScripts) complianceScore += 5;
  if (project.subProcessors.every((s) => s.dpaSigned)) complianceScore += 5;

  return {
    activeInventoryCount: activeInventory.length,
    activeCookiesCount: activeCookies.length,
    crossBorderCount,
    criticalDataCount,
    subProcessorCount: project.subProcessors.length,
    complianceScore: Math.min(100, complianceScore),
  };
}

export function generateLegalDocumentText(
  project: PrivacyProject,
  docType: LegalDocType
): string {
  const activeInv = project.inventory.filter((i) => i.enabled);
  const activeCookies = project.cookies.filter((c) => c.enabled);
  const hasCrossBorder = activeInv.some((i) => i.crossBorderTransfer);

  if (docType === 'kvkk-aydinlatma') {
    return `# KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ
**Yürürlük Tarihi:** ${project.effectiveDate} | **Belge Sürümü:** ${project.version}

## 1. VERİ SORUMLUSUNUN KİMLİĞİ
6698 sayılı Kişisel Verilerin Korunması Kanunu ("**KVKK**") uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla **${project.companyName}** (Ticaret Sicil No: \`${project.tradeRegistryNo}\`, MERSİS No: \`${project.mersisNo}\`, Vergi Dairesi/No: \`${project.taxOfficeAndNo}\`) tarafından aşağıda açıklanan kapsamda hukuka ve dürüstlük kurallarına uygun olarak işlenmektedir.

* **Merkez Adresi:** ${project.headquartersAddress}
* **İnternet Sitesi & Platform:** ${project.websiteUrl} (${project.appName})
* **Veri Koruma Görevlisi (DPO) & İletişim:** ${project.dpoName} — \`${project.dpoEmail}\`
* **Kayıtlı Elektronik Posta (KEP):** \`${project.kepAddress}\`
* **VERBİS Kayıt Durumu:** ${project.verbisRegistered ? 'Kayıtlı ve Güncel (VERBİS Envanteri ile Tam Uyumlu)' : 'Muafiyet Kapsamında / Kayıt Sürecinde'}

---

## 2. İŞLENEN KİŞİSEL VERİ KATEGORİLERİ, AMAÇLARI VE HUKUKİ SEBEPLERİ
Şirketimiz tarafından yürütülen faaliyetler kapsamında işlenen kişisel veri kategorileriniz, işleme amaçlarımız, KVKK Madde 5 ve Madde 6 kapsamındaki hukuki sebeplerimiz ve saklama sürelerimiz aşağıda tablolaştırılmıştır:

${activeInv
  .map(
    (item, idx) => `### 2.${idx + 1}. ${item.categoryName}
* **İşlenen Veri Unsurları:** ${item.dataFields}
* **İlgili Kişi Grubu:** ${item.dataSubjectGroup}
* **İşleme Amacı:** ${item.processingPurpose}
* **Hukuki Sebep (KVKK & GDPR):** ${item.legalBasisKvkk} | *${item.legalBasisGdpr}*
* **Saklama Süresi & İmha Yöntemi:** ${item.retentionPeriod} — *${item.destructionMethod}*
* **Teknik Güvenlik Tedbiri:** ${item.encryptionStandard}`
  )
  .join('\n\n')}

---

## 3. KİŞİSEL VERİLERİN AKTARILMASI (YURT İÇİ VE YURT DIŞI AKTARIM)
Kişisel verileriniz, KVKK'nın 8. ve 9. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları çerçevesinde:
${project.subProcessors
  .map(
    (sp) =>
      `* **${sp.name}** (*${sp.serviceType}* — Ülke: **${sp.country}** | Aktarım Mekanizması: \`${sp.transferMechanism}\` | DPA: ${sp.dpaSigned ? 'İmzalı' : 'Bekliyor'})`
  )
  .join('\n')}
${
  hasCrossBorder
    ? '\n> **Yurt Dışı Aktarım Notu:** 6698 sayılı Kanun\'un 12 Mart 2024 tarihli değişikliğiyle yürürlüğe giren yeni 9. maddesi uyarınca, yurt dışı veri aktarımlarında Kurul tarafından ilan edilen **Standart Sözleşme Maddeleri (SCC)** imzalanmış olup Kişisel Verileri Koruma Kurumu\'na bildirim yükümlülüğü yerine getirilmiştir.'
    : '\n> **Yerel Barındırma Güvencesi:** Kişisel verileriniz Türkiye Cumhuriyeti sınırları içerisindeki yüksek güvenlikli veri merkezlerinde barındırılmakta olup yurt dışına aktarılmamaktadır.'
}

---

## 4. İLGİLİ KİŞİNİN KVKK MADDE 11 KAPSAMINDAKİ HAKLARI
KVKK'nın 11. maddesi uyarınca veri sahibi olarak Şirketimize başvurarak:
1. Kişisel verilerinizin işlenip işlenmediğini öğrenme,
2. İşlenmişse buna ilişkin bilgi talep etme,
3. İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,
4. Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,
5. Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,
6. KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme,
7. İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
8. Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.

**Başvuru Yöntemi:** Taleplerinizi *Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ* uyarınca yazılı olarak **${project.headquartersAddress}** adresine, güvenli elektronik imza ile **\`${project.kepAddress}\`** KEP adresimize veya sistemimizde kayıtlı e-posta adresinizden **\`${project.dpoEmail}\`** adresine iletebilirsiniz. Başvurularınız en geç **30 (otuz) gün** içinde ücretsiz olarak sonuçlandırılacaktır.`;
  }

  if (docType === 'acik-riza') {
    return `# KVKK AÇIK RIZA BEYANI VE TİCARİ ELEKTRONİK İLETİ (İYS) ONAY METNİ
**Veri Sorumlusu:** ${project.companyName} (\`${project.mersisNo}\`)

**${project.appName}** platformu kapsamında tarafıma sunulan *Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni*'ni okudum ve anladım. Hiçbir baskı altında kalmaksızın, özgür irademle ve dilediğim zaman geri çekme hakkım saklı kalmak kaydıyla:

1. **Üretken Yapay Zeka & Bulut Altyapı İşlemleri:** Platform içi performans analitiği, kullanıcı deneyimi kişiselleştirmesi ve yüksek erişilebilirlikli bulut altyapısı hizmetlerinin sunulabilmesi amacıyla kişisel verilerimin Standart Sözleşme güvenceleri altında işlenmesine ve aktarılmasına **AÇIK RIZA VERİYORUM**.
2. **6563 Sayılı ETK & İYS Kapsamında Ticari İletişim:** Ürün güncellemeleri, yeni özellik lansmanları, özel indirimler ve kurumsal etkinlik davetlerinin tarafıma E-Posta, SMS ve Uygulama İçi Bildirim kanallarıyla iletilmesine ve iletişim verilerimin **İleti Yönetim Sistemi A.Ş. (İYS)** sistemine kaydedilmesine **ONAY VERİYORUM**.

> *Not: Açık rızanızı dilediğiniz an hesap ayarlarınızdan veya \`${project.dpoEmail}\` adresine tek tıkla bildirimde bulunarak geri alabilirsiniz.*`;
  }

  if (docType === 'gdpr-privacy') {
    return `# EU GENERAL DATA PROTECTION REGULATION (GDPR) PRIVACY NOTICE & ART. 30 RoPA
**Controller:** ${project.companyName} | **Effective Date:** ${project.effectiveDate}
**Data Protection Officer (DPO):** ${project.dpoName} (\`${project.dpoEmail}\`)

## 1. SCOPE AND DATA CONTROLLER IDENTITY
Pursuant to Articles 13 and 14 of Regulation (EU) 2016/679 (**General Data Protection Regulation — "GDPR"**), **${project.companyName}** acts as the Data Controller for personal data collected via **${project.websiteUrl}** and **${project.appName}**.

## 2. RECORD OF PROCESSING ACTIVITIES (ART. 30 GDPR)
${activeInv
  .map(
    (i) =>
      `* **${i.categoryName}:** Fields: *${i.dataFields}* | Legal Basis: **${i.legalBasisGdpr}** | Retention: *${i.retentionPeriod}* | Security: \`${i.encryptionStandard}\``
  )
  .join('\n')}

## 3. INTERNATIONAL DATA TRANSFERS & SUB-PROCESSORS (ART. 28 & 46 GDPR)
We engage strictly vetted sub-processors under binding Data Processing Addendums (DPAs) and European Commission **Standard Contractual Clauses (SCCs - Module 2)**:
${project.subProcessors
  .map(
    (s) =>
      `* **${s.name}** (${s.country}) — *${s.serviceType}* — Mechanism: \`${s.transferMechanism}\``
  )
  .join('\n')}

## 4. YOUR GDPR DATA SUBJECT RIGHTS (ARTICLES 15–22)
Under the GDPR, EEA/UK residents have the right to **Access (Art. 15)**, **Rectification (Art. 16)**, **Erasure / "Right to be Forgotten" (Art. 17)**, **Restriction of Processing (Art. 18)**, **Data Portability in JSON/CSV format (Art. 20)**, and **Objection (Art. 21)**. To exercise these rights, contact our DPO at \`${project.dpoEmail}\`.`;
  }

  if (docType === 'cookie-policy') {
    return `# ÇEREZ (COOKIE) VE BENZERİ TEKNOLOJİLER AYDINLATMA POLİTİKASI
**Platform:** ${project.websiteUrl} | **Son Güncelleme:** ${project.effectiveDate}

**${project.companyName}** olarak, **${project.appName}** platformumuzda 6698 sayılı KVKK, Kişisel Verileri Koruma Kurumu'nun *Çerez Uygulamaları Hakkında Rehberi* ve AB ePrivacy Direktifi uyarınca çerezler (cookies), yerel depolama (\`localStorage\`) ve piksel etiketleri kullanmaktayız.

## 1. KULLANILAN ÇEREZ ENVANTERİ VE SAKLAMA SÜRELERİ
| Çerez Adı | Sağlayıcı | Kategori | Saklama Süresi | Kullanım Amacı |
| :--- | :--- | :--- | :--- | :--- |
${activeCookies
  .map(
    (c) =>
      `| \`${c.name}\` | ${c.provider} | **${COOKIE_CATEGORY_META[c.category].label}** | ${c.duration} | ${c.purpose} |`
  )
  .join('\n')}

## 2. GOOGLE CONSENT MODE V2 VE OTOMATİK BETİK ENGELLEME
Platformumuzda **Google Consent Mode v2** standartları uygulanmaktadır. Web sitemizi ilk ziyaretinizde zorunlu çerezler dışındaki tüm analitik (\`analytics_storage\`) ve pazarlama (\`ad_storage\`, \`ad_user_data\`, \`ad_personalization\`) çerezleri varsayılan olarak **reddedilmiş (\`denied\`)** konumda başlar ve yalnızca açık rızanızla etkinleştirilir.`;
  }

  if (docType === 'terms-of-service') {
    return `# KURUMSAL SAAS KULLANIM KOŞULLARI VE HİZMET SEVİYESİ SÖZLEŞMESİ (ToS & SLA)
**Hizmet Sağlayıcı:** ${project.companyName} | **Yetkili Mahkeme:** ${project.jurisdictionCity}

## 1. TARAFLAR VE KONU
İşbu Kullanım Koşulları ("**Sözleşme**"), **${project.websiteUrl}** adresinde sunulan **${project.appName}** yazılım hizmetini kullanan kurumsal veya bireysel kullanıcı ("**Müşteri**") ile **${project.companyName}** arasındaki hak ve yükümlülükleri düzenler.

## 2. FİKRİ MÜLKİYET VE MÜŞTERİ VERİSİ MÜLKİYETİ
1. Müşteri tarafından platforma yüklenen tüm veri, belge, kaynak kod ve çıktıların mülkiyeti münhasıran **Müşteri'ye aittir**.
2. Platformun kaynak kodları, algoritmaları, arayüz tasarımları ve **Corpus** markası 5846 sayılı FSEK kapsamında Şirketimize aittir.

## 3. HİZMET SEVİYESİ TAAHHÜDÜ (SLA) VE SORUMLULUK SINIRI
Şirketimiz aylık **%99,95 erişilebilirlik (Uptime)** hedefiyle hizmet sunar. Şirketimizin işbu Sözleşme'den doğabilecek toplam mali sorumluluğu, ilgili olaydan önceki son **12 (on iki) ay** içinde Müşteri tarafından ödenen toplam abonelik bedeli ile sınırlıdır. Uyuşmazlıklarda **${project.jurisdictionCity}** yetkilidir.`;
  }

  return `# KİŞİSEL VERİLERİ SAKLAMA VE İMHA POLİTİKASI
**Veri Sorumlusu:** ${project.companyName} | **Sürüm:** ${project.version}

## 1. AMAÇ VE DAYANAK
İşbu Politika, *Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesine İlişkin Yönetmelik* (Resmî Gazete: 28 Ekim 2017 / 30224) uyarınca kişisel verilerin azami saklama sürelerini ve periyodik imha süreçlerini belirlemek amacıyla hazırlanmıştır.

## 2. PERİYODİK İMHA SÜRELERİ VE KRİPTOGRAFİK İMHA TEKNİKLERİ
* **Periyodik İmha Döngüsü:** Yönetmeliğin 11. maddesi uyarınca her **6 (altı) ayda bir** (Haziran ve Aralık aylarında) otomatik imha betikleri çalıştırılır ve imha tutanağı **3 yıl** süreyle saklanır.
* **Uygulanan Teknikler:**
${activeInv
  .map(
    (i) =>
      `  - **${i.categoryName}:** Saklama Süresi: *${i.retentionPeriod}* → İmha Yöntemi: \`${i.destructionMethod}\``
  )
  .join('\n')}`;
}

export function generateCookieBannerSnippet(project: PrivacyProject): string {
  const cfg = project.bannerConfig;
  return `<!-- CORPUS PRIVACY CMP (#031 PRO) - ZERO-DEPENDENCY KVKK & GDPR CONSENT BANNER -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  ${
    cfg.googleConsentModeV2
      ? `// Google Consent Mode v2 Default Denied State
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });`
      : ''
  }

  (function initCorpusCMP() {
    var STORAGE_KEY = 'corpus_cmp_consent_v2';
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return;

    var banner = document.createElement('div');
    banner.id = 'corpus-cmp-banner';
    banner.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;max-width:680px;margin:0 auto;background:#09090b;color:#f4f4f5;border:1px solid ${cfg.brandColor};border-radius:16px;padding:20px;z-index:999999;font-family:Inter,sans-serif;box-shadow:0 25px 50px -12px rgba(0,0,0,0.75);';
    banner.innerHTML = '<div style="font-weight:700;font-size:15px;margin-bottom:6px;color:#fff;">${cfg.headline.replace(/'/g, "\\'")}</div>' +
      '<p style="font-size:12.5px;color:#a1a1aa;line-height:1.5;margin:0 0 14px 0;">${cfg.description.replace(/'/g, "\\'")}</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button id="cmp-accept" style="background:${cfg.brandColor};color:#fff;border:none;padding:9px 18px;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer;">${cfg.acceptAllLabel}</button>' +
        '<button id="cmp-reject" style="background:#27272a;color:#e4e4e7;border:1px solid #3f3f46;padding:9px 16px;border-radius:10px;font-weight:500;font-size:12px;cursor:pointer;">${cfg.rejectAllLabel}</button>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('cmp-accept').onclick = function() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, marketing: true, ts: Date.now() }));
      if (window.gtag) gtag('consent', 'update', { 'ad_storage': 'granted', 'ad_user_data': 'granted', 'ad_personalization': 'granted', 'analytics_storage': 'granted' });
      banner.remove();
    };
    document.getElementById('cmp-reject').onclick = function() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, marketing: false, ts: Date.now() }));
      banner.remove();
    };
  })();
</script>`;
}

function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function renderPrivacyArchitectureCanvas(
  canvas: HTMLCanvasElement,
  project: PrivacyProject
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const metrics = calculatePrivacyMetrics(project);
  const activeInv = project.inventory.filter((i) => i.enabled);

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(0.6, '#09191f');
  bg.addColorStop(1, '#0c1322');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 2. Top Header Banner
  ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.85)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 40, 28, W - 80, 92, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  drawRoundedBox(ctx, 60, 46, 6, 56, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 23px Inter, sans-serif';
  ctx.fillText(
    `${project.companyName} — KVKK (VERBİS) & GDPR VERİ ENVANTERİ HARİTASI`,
    82,
    68
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `MERSİS: ${project.mersisNo}  •  DPO: ${project.dpoName} (${project.dpoEmail})  •  KEP: ${project.kepAddress}  •  SÜRÜM: ${project.version}`,
    82,
    96
  );

  // Compliance Score Badge
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10b981';
  drawRoundedBox(ctx, W - 400, 42, 336, 64, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 10.5px Inter, sans-serif';
  ctx.fillText('KVKK & GDPR HUKUKİ UYUMLULUK ENDEKSİ', W - 382, 64);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(
    `%${metrics.complianceScore} UYUMLU (${
      project.verbisRegistered ? 'VERBİS OK' : 'TASLAK'
    })`,
    W - 382,
    94
  );

  // 3. Left Panel: VERBIS & GDPR Art. 30 Data Processing Inventory (RoPA)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 40, 140, 1180, 620, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(
    '1. VERBİS & GDPR MADDE 30 KİŞİSEL VERİ İŞLEME ENVANTERİ (RoPA MATRİSİ)',
    68,
    176
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('VERİ KATEGORİSİ & UNSURLAR', 68, 206);
  ctx.fillText('HUKUKİ SEBEP (KVKK / GDPR)', 470, 206);
  ctx.fillText('SAKLAMA & İMHA', 820, 206);
  ctx.fillText('ŞİFRELEME / RİSK', 1050, 206);

  activeInv.slice(0, 6).forEach((row, idx) => {
    const ry = 222 + idx * 86;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    ctx.strokeStyle =
      row.riskLevel === 'CRITICAL'
        ? 'rgba(244, 63, 94, 0.5)'
        : 'rgba(63, 63, 70, 0.6)';
    drawRoundedBox(ctx, 64, ry, 1132, 74, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13.5px Inter, sans-serif';
    ctx.fillText(row.categoryName, 80, ry + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11.5px Inter, sans-serif';
    ctx.fillText(row.dataFields.slice(0, 48), 80, ry + 48);
    ctx.fillText(`Amaç: ${row.processingPurpose.slice(0, 52)}`, 80, ry + 65);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(row.legalBasisKvkk.slice(0, 42), 470, ry + 28);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 11.5px Inter, sans-serif';
    ctx.fillText(row.legalBasisGdpr.slice(0, 42), 470, ry + 50);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(row.retentionPeriod.slice(0, 28), 820, ry + 28);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(row.destructionMethod.slice(0, 30), 820, ry + 50);

    ctx.fillStyle = row.riskLevel === 'CRITICAL' ? '#f43f5e' : '#10b981';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(`[${row.riskLevel}]`, 1050, ry + 28);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 11px monospace';
    ctx.fillText(row.encryptionStandard.slice(0, 18), 1050, ry + 50);
  });

  // 4. Right Panel: Sub-Processors & Cross-Border Transfer Map
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 1244, 140, 636, 620, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('2. ALT İŞLEYENLER (SUB-PROCESSORS) & AKTARIM REJİMİ', 1272, 176);

  project.subProcessors.slice(0, 4).forEach((sp, idx) => {
    const sy = 202 + idx * 130;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.82)';
    ctx.strokeStyle = sp.dpaSigned ? '#10b981' : '#f59e0b';
    drawRoundedBox(ctx, 1272, sy, 580, 114, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(sp.name.slice(0, 46), 1292, sy + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText(sp.serviceType.slice(0, 54), 1292, sy + 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Ülke: ${sp.country}  •  ${sp.transferMechanism}`, 1292, sy + 76);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11.5px Inter, sans-serif';
    ctx.fillText(
      `✓ DPA Sözleşmesi: ${sp.dpaSigned ? 'İmzalı' : 'Bekliyor'}  •  ✓ SOC2/ISO27001: ${
        sp.soc2IsoCertified ? 'Sertifikalı' : 'Denetimde'
      }`,
      1292,
      sy + 98
    );
  });

  // 5. Bottom Panel: Cookie Inventory & Live CMP Banner Preview
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 40, 780, 1840, 248, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(
    '3. ÇEREZ (COOKIE) ENVANTERİ & CANLI CMP CONSENT BANNER ÖNİZLEMESİ',
    68,
    814
  );

  // Left half of bottom: Cookie pills
  project.cookies
    .filter((c) => c.enabled)
    .slice(0, 6)
    .forEach((ck, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = 68 + col * 360;
      const cy = 834 + row * 86;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeStyle = COOKIE_CATEGORY_META[ck.category].badgeColor;
      drawRoundedBox(ctx, cx, cy, 344, 74, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(ck.name, cx + 14, cy + 24);

      ctx.fillStyle = COOKIE_CATEGORY_META[ck.category].badgeColor;
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.fillText(
        `${COOKIE_CATEGORY_META[ck.category].label} • ${ck.duration}`,
        cx + 14,
        cy + 44
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(ck.purpose.slice(0, 44), cx + 14, cy + 62);
    });

  // Right half of bottom: Simulated Live Cookie Banner Card
  const bx = 1170;
  const by = 824;
  const bw = 682;
  const bh = 180;
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = project.bannerConfig.brandColor;
  ctx.lineWidth = 2;
  drawRoundedBox(ctx, bx, by, bw, bh, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(`🍪 ${project.bannerConfig.headline.slice(0, 56)}`, bx + 22, by + 34);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(project.bannerConfig.description.slice(0, 82), bx + 22, by + 62);
  ctx.fillText(project.bannerConfig.description.slice(82, 164), bx + 22, by + 82);

  // Buttons inside banner preview
  ctx.fillStyle = project.bannerConfig.brandColor;
  drawRoundedBox(ctx, bx + 22, by + 112, 190, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12.5px Inter, sans-serif';
  ctx.fillText(project.bannerConfig.acceptAllLabel, bx + 44, by + 138);

  ctx.fillStyle = '#27272a';
  drawRoundedBox(ctx, bx + 226, by + 112, 230, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#e4e4e7';
  ctx.fillText(project.bannerConfig.rejectAllLabel, bx + 244, by + 138);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11.5px monospace';
  ctx.fillText(
    project.bannerConfig.googleConsentModeV2 ? '✓ Consent Mode v2' : '',
    bx + 478,
    by + 138
  );

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS LEGAL, KVKK/GDPR PRIVACY & COOKIE POLICY GENERATOR (#031 PRO)  •  4K VERBİS & RoPA BLUEPRINT',
    44,
    H - 16
  );
}

export function exportVerbisExcel(project: PrivacyProject) {
  const wb = XLSX.utils.book_new();

  const invRows = project.inventory.map((i, idx) => ({
    Sıra: idx + 1,
    Durum: i.enabled ? 'Aktif' : 'Pasif',
    'Veri Kategorisi': i.categoryName,
    'Veri Alanları': i.dataFields,
    'İlgili Kişi Grubu': i.dataSubjectGroup,
    'İşleme Amacı': i.processingPurpose,
    'KVKK Hukuki Sebep': i.legalBasisKvkk,
    'GDPR Hukuki Sebep': i.legalBasisGdpr,
    'Saklama Süresi': i.retentionPeriod,
    'İmha Yöntemi': i.destructionMethod,
    'Alıcı Grupları': i.recipients,
    'Yurt Dışı Aktarım': i.crossBorderTransfer ? 'EVET (SCC)' : 'Hayır (Yurt İçi)',
    'Teknik Şifreleme': i.encryptionStandard,
    'Risk Seviyesi': i.riskLevel,
  }));

  const cookieRows = project.cookies.map((c) => ({
    'Çerez Adı': c.name,
    Sağlayıcı: c.provider,
    Kategori: COOKIE_CATEGORY_META[c.category].label,
    'Saklama Süresi': c.duration,
    '1. Parti mi?': c.firstParty ? 'Evet' : '3. Parti',
    'Kullanım Amacı': c.purpose,
  }));

  const subProcRows = project.subProcessors.map((s) => ({
    'Alt İşleyen (Sub-Processor)': s.name,
    'Hizmet Türü': s.serviceType,
    Ülke: s.country,
    'Aktarım Mekanizması': s.transferMechanism,
    'DPA İmzalı mı?': s.dpaSigned ? 'EVET' : 'Hayır',
    'SOC2 / ISO 27001': s.soc2IsoCertified ? 'EVET' : 'Hayır',
  }));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(invRows),
    'VERBİS Veri Envanteri'
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(cookieRows),
    'Çerez Envanteri'
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(subProcRows),
    'Alt İşleyenler (DPA)'
  );

  XLSX.writeFile(wb, `${project.id}-VERBIS-GDPR-Envanteri.xlsx`);
}
