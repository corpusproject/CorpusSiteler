// ============================================================================
// CORPUS LOCALIZATION — Multi-Locale i18n Matrix, ICU Linter & Pseudo-Locale
// #039 PRO | JSON / Android XML / iOS Strings / Gettext PO & Type-Safe d.ts
// ============================================================================

export type SupportedLocale = 'tr' | 'en' | 'de' | 'ar' | 'ja' | 'es';

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  avgExpansionRatio: number; // e.g. German 1.32x vs English
  badgeColor: string;
}

export interface TranslationEntry {
  id: string;
  namespace: string;
  key: string;
  maxCharLimit: number;
  description: string;
  values: Record<SupportedLocale, string>;
}

export interface I18nDiagnosticIssue {
  id: string;
  severity: 'ERROR' | 'WARNING';
  locale: SupportedLocale;
  key: string;
  issueType: 'MISSING_TRANSLATION' | 'BROKEN_INTERPOLATION' | 'UI_OVERFLOW_RISK';
  detail: string;
}

export interface I18nProject {
  projectName: string;
  sourceLocale: SupportedLocale;
  activeLocales: SupportedLocale[];
  entries: TranslationEntry[];
  accentColor: string;
}

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
  tr: {
    code: 'tr',
    name: 'Turkish (Türkiye)',
    nativeName: 'Türkçe',
    direction: 'LTR',
    avgExpansionRatio: 1.14,
    badgeColor: '#ef4444',
  },
  en: {
    code: 'en',
    name: 'English (US/Global)',
    nativeName: 'English',
    direction: 'LTR',
    avgExpansionRatio: 1.0,
    badgeColor: '#3b82f6',
  },
  de: {
    code: 'de',
    name: 'German (DACH)',
    nativeName: 'Deutsch',
    direction: 'LTR',
    avgExpansionRatio: 1.32,
    badgeColor: '#f59e0b',
  },
  ar: {
    code: 'ar',
    name: 'Arabic (MENA RTL)',
    nativeName: 'العربية',
    direction: 'RTL',
    avgExpansionRatio: 1.22,
    badgeColor: '#10b981',
  },
  ja: {
    code: 'ja',
    name: 'Japanese (CJK)',
    nativeName: '日本語',
    direction: 'LTR',
    avgExpansionRatio: 0.85,
    badgeColor: '#ec4899',
  },
  es: {
    code: 'es',
    name: 'Spanish (LATAM/ES)',
    nativeName: 'Español',
    direction: 'LTR',
    avgExpansionRatio: 1.25,
    badgeColor: '#a855f7',
  },
};

// ----------------------------------------------------------------------------
// Pseudo-Localization Generator ([!! Ŧḗẋŧ Expansion 35% !!])
// ----------------------------------------------------------------------------
const PSEUDO_CHAR_MAP: Record<string, string> = {
  a: 'ȧ',
  A: 'Ȧ',
  b: 'ƀ',
  B: 'Ɓ',
  c: 'ƈ',
  C: 'Ƈ',
  d: 'ḓ',
  D: 'Ḓ',
  e: 'ḗ',
  E: 'Ḗ',
  f: 'ƒ',
  g: 'ɠ',
  h: 'ħ',
  i: 'ī',
  I: 'Ī',
  k: 'ƙ',
  l: 'ŀ',
  m: 'ḿ',
  n: 'ƞ',
  o: 'ṓ',
  O: 'Ṓ',
  p: 'ƥ',
  r: 'ř',
  s: 'ş',
  S: 'Ş',
  t: 'ŧ',
  T: 'Ŧ',
  u: 'ū',
  U: 'Ū',
  v: 'ṽ',
  w: 'ẇ',
  y: 'ẏ',
  z: 'ẑ',
};

export function generatePseudoLocalizedString(source: string): string {
  if (!source) return '';
  // Preserve {{interpolation}} and {icu} blocks untouched
  const parts = source.split(/(\{\{[^}]+\}\}|\{[^}]+\})/g);
  const transformed = parts
    .map((part) => {
      if (part.startsWith('{')) return part;
      return part
        .split('')
        .map((ch) => PSEUDO_CHAR_MAP[ch] || ch)
        .join('');
    })
    .join('');

  return `[!! ${transformed} ~~~~ !!]`;
}

function extractPlaceholders(str: string): string[] {
  const matches = str.match(/(\{\{\s*[a-zA-Z0-9_]+\s*\}\}|\{[a-zA-Z0-9_]+\}|%[sd])/g);
  return matches ? matches.map((m) => m.replace(/\s+/g, '')) : [];
}

// ----------------------------------------------------------------------------
// Localization Coverage, Placeholder Parity & Overflow Linter
// ----------------------------------------------------------------------------
export function analyzeI18nProject(project: I18nProject): {
  localeCoveragePct: Record<SupportedLocale, number>;
  overallCoveragePct: number;
  issues: I18nDiagnosticIssue[];
} {
  const localeCoveragePct: Record<SupportedLocale, number> = {
    tr: 100,
    en: 100,
    de: 100,
    ar: 100,
    ja: 100,
    es: 100,
  };
  const issues: I18nDiagnosticIssue[] = [];

  for (const loc of project.activeLocales) {
    let translatedCount = 0;

    for (const entry of project.entries) {
      const srcVal = entry.values[project.sourceLocale] || '';
      const targetVal = (entry.values[loc] || '').trim();

      if (targetVal.length > 0) {
        translatedCount++;
      } else {
        issues.push({
          id: `missing-${entry.id}-${loc}`,
          severity: 'ERROR',
          locale: loc,
          key: `${entry.namespace}.${entry.key}`,
          issueType: 'MISSING_TRANSLATION',
          detail: `Missing translation in [${loc.toUpperCase()}] for key "${entry.namespace}.${entry.key}"`,
        });
      }

      // Check placeholder parity ({{user}}, {count}, %s)
      if (targetVal.length > 0) {
        const srcVars = extractPlaceholders(srcVal);
        for (const v of srcVars) {
          if (!targetVal.replace(/\s+/g, '').includes(v)) {
            issues.push({
              id: `var-${entry.id}-${loc}-${v}`,
              severity: 'ERROR',
              locale: loc,
              key: `${entry.namespace}.${entry.key}`,
              issueType: 'BROKEN_INTERPOLATION',
              detail: `Variable ${v} present in source (${project.sourceLocale.toUpperCase()}) is missing in [${loc.toUpperCase()}] translation.`,
            });
          }
        }

        // Check UI overflow against maxCharLimit
        if (entry.maxCharLimit > 0 && targetVal.length > entry.maxCharLimit) {
          issues.push({
            id: `overflow-${entry.id}-${loc}`,
            severity: 'WARNING',
            locale: loc,
            key: `${entry.namespace}.${entry.key}`,
            issueType: 'UI_OVERFLOW_RISK',
            detail: `Length (${targetVal.length} chars) exceeds UI button/card limit of ${entry.maxCharLimit} chars in [${loc.toUpperCase()}].`,
          });
        }
      }
    }

    localeCoveragePct[loc] =
      project.entries.length > 0
        ? Math.round((translatedCount / project.entries.length) * 100)
        : 100;
  }

  const totalPct = project.activeLocales.reduce(
    (acc, l) => acc + localeCoveragePct[l],
    0
  );
  const overallCoveragePct =
    project.activeLocales.length > 0
      ? Math.round(totalPct / project.activeLocales.length)
      : 100;

  return {
    localeCoveragePct,
    overallCoveragePct,
    issues,
  };
}

// ----------------------------------------------------------------------------
// Multi-Platform Bundle Compiler (i18next JSON, Android XML, iOS .strings, .d.ts)
// ----------------------------------------------------------------------------
export function exportI18nBundle(
  project: I18nProject,
  locale: SupportedLocale,
  format: 'json_nested' | 'android_xml' | 'ios_strings' | 'typescript_dts' | 'pseudo_json'
): string {
  if (format === 'typescript_dts') {
    return `// Auto-Generated Type-Safe i18next Key Registry (#039 PRO)
export type TranslationKey =
${project.entries.map((e) => `  | '${e.namespace}.${e.key}'`).join('\n')};

export interface I18nNamespaceMap {
${project.entries
  .map(
    (e) =>
      `  '${e.namespace}.${e.key}': '${(e.values[project.sourceLocale] || '').replace(/'/g, "\\'")}';`
  )
  .join('\n')}
}
`;
  }

  if (format === 'android_xml') {
    return `<?xml version="1.0" encoding="utf-8"?>
<!-- Auto-Generated Android strings.xml for locale [${locale}] -->
<resources>
${project.entries
  .map(
    (e) =>
      `    <string name="${e.namespace}_${e.key.replace(/\./g, '_')}">${(
        e.values[locale] || ''
      )
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</string>`
  )
  .join('\n')}
</resources>`;
  }

  if (format === 'ios_strings') {
    return `/* Auto-Generated iOS Localizable.strings for locale [${locale}] */\n` +
      project.entries
        .map(
          (e) =>
            `"${e.namespace}.${e.key}" = "${(e.values[locale] || '').replace(/"/g, '\\"')}";`
        )
        .join('\n');
  }

  const nested: Record<string, Record<string, string>> = {};
  for (const e of project.entries) {
    if (!nested[e.namespace]) nested[e.namespace] = {};
    nested[e.namespace][e.key] =
      format === 'pseudo_json'
        ? generatePseudoLocalizedString(e.values[project.sourceLocale] || '')
        : e.values[locale] || '';
  }

  return JSON.stringify(nested, null, 2);
}

export const PRESET_I18N_PROJECT: I18nProject = {
  projectName: 'Corpus Pay Global Checkout & Mobile Banking App',
  sourceLocale: 'tr',
  activeLocales: ['tr', 'en', 'de', 'ar', 'ja', 'es'],
  accentColor: '#3b82f6',
  entries: [
    {
      id: 'k-1',
      namespace: 'checkout',
      key: 'confirm_wire_button',
      maxCharLimit: 28,
      description: 'Primary CTA button on SWIFT wire confirmation modal',
      values: {
        tr: '{{amount}} Tutarı Gönder',
        en: 'Send {{amount}} Now',
        de: '{{amount}} Sofort Überweisen',
        ar: 'إرسال {{amount}} الآن',
        ja: '{{amount}} を今すぐ送金',
        es: 'Enviar {{amount}} Ahora',
      },
    },
    {
      id: 'k-2',
      namespace: 'security',
      key: 'biometric_mfa_prompt',
      maxCharLimit: 72,
      description: 'Passkey / FaceID prompt subtitle',
      values: {
        tr: 'Sayın {{user}}, işlemi onaylamak için FaceID doğrulaması yapın.',
        en: 'Dear {{user}}, authenticate with FaceID to authorize this transfer.',
        de: 'Hallo {{user}}, bitte bestätigen Sie die Überweisung mit FaceID.',
        ar: 'عزيزي {{user}}، يرجى المصادقة باستخدام FaceID لتفويض التحويل.',
        ja: '{{user}} 様、FaceID で認証して送金を承認してください。',
        es: 'Estimado {{user}}, autentíquese con FaceID para autorizar.',
      },
    },
    {
      id: 'k-3',
      namespace: 'dashboard',
      key: 'iban_copied_toast',
      maxCharLimit: 32,
      description: 'Toast notification when user copies IBAN',
      values: {
        tr: 'IBAN panoya kopyalandı',
        en: 'IBAN copied to clipboard',
        de: 'IBAN in die Zwischenablage kopiert',
        ar: 'تم نسخ رقم الآيبان إلى الحافظة',
        ja: 'IBANをクリップボードにコピーしました',
        es: 'IBAN copiado al portapapeles',
      },
    },
    {
      id: 'k-4',
      namespace: 'compliance',
      key: 'kyc_document_expired',
      maxCharLimit: 65,
      description: 'Alert banner when passport expires in {{days}} days',
      values: {
        tr: 'Kimlik belgenizin süresi {{days}} gün içinde doluyor.',
        en: 'Your identity document expires in {{days}} days.',
        de: 'Ihr Ausweisdokument läuft in {{days}} Tagen ab.',
        ar: 'تنتهي صلاحية وثيقة الهوية الخاصة بك خلال {{days}} يومًا.',
        ja: '本人確認書類の有効期限が {{days}} 日後に切れます。',
        es: '',
      },
    },
  ],
};
