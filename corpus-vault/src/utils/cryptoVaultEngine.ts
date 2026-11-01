export type VaultItemCategory = 'login' | 'card' | 'note' | 'ssh-api';

export interface VaultItem {
  id: string;
  category: VaultItemCategory;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  totpSecret?: string; // Base32 RFC 6238 TOTP secret
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  notes?: string;
  favorite: boolean;
  updatedAt: string;
}

export interface EncryptedVaultEnvelope {
  version: number;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  cipher: 'AES-256-GCM';
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
  createdAt: string;
}

export const SAMPLE_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'v-1',
    category: 'login',
    title: 'AWS Root & Production Console',
    username: 'admin@corpus-cloud.io',
    password: 'K9#mP9$vL2@xQ8!zR4&wN7*tB',
    url: 'https://console.aws.amazon.com',
    totpSecret: 'JBSWY3DPEHPK3PXP',
    notes: 'Frankfurt (eu-central-1) ana üretim kümesi. Acil durum kurtarma kodları fiziksel kasada.',
    favorite: true,
    updatedAt: '2026-10-15',
  },
  {
    id: 'v-2',
    category: 'login',
    title: 'GitHub Enterprise Organization',
    username: 'kaandemir-arch',
    password: 'Gh_99!xZ#42$PlmQ78*vBnR2',
    url: 'https://github.com',
    totpSecret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    notes: 'Corpus 100-Site Monorepo ana organizasyon hesabı.',
    favorite: true,
    updatedAt: '2026-10-14',
  },
  {
    id: 'v-3',
    category: 'card',
    title: 'Kurumsal Şirket Kredi Kartı (Virtual)',
    cardHolder: 'KAAN DEMİR',
    cardNumber: '4543 •••• •••• 8821',
    cardExpiry: '09/28',
    cardCvv: '842',
    notes: 'Bulut sunucu, domain ve SaaS abonelik ödemeleri için aylık 75.000 TL limitli sanal kart.',
    favorite: false,
    updatedAt: '2026-10-10',
  },
  {
    id: 'v-4',
    category: 'ssh-api',
    title: 'OpenAI / Anthropic Production API Key',
    username: 'org-corpus-ai-prod',
    password: 'sk-proj-98a7VbcX21LpQ90zR4mK8wT5yN3jH6fD',
    url: 'https://platform.openai.com',
    notes: 'Rate limit: Tier 5. Sadece sunucu tarafı ortam değişkenlerinde kullanılmalı.',
    favorite: true,
    updatedAt: '2026-10-12',
  },
  {
    id: 'v-5',
    category: 'note',
    title: 'Soğuk Cüzdan (Hardware Wallet) Seed Yedeği Notu',
    notes:
      'Ledger Nano X 24 kelimelik kurtarma anahtarının 1-12 arası banka kiralık kasasında, 13-24 arası şifreli CorpusLock dosyasında saklanmaktadır. PIN: 9482••',
    favorite: false,
    updatedAt: '2026-09-28',
  },
  {
    id: 'v-6',
    category: 'login',
    title: 'Eski Test Forum Hesabı (Zayıf Parola Örneği)',
    username: 'kaan_test',
    password: 'password123',
    url: 'https://test-forum.local',
    notes: 'Parola denetleyicisini (Security Audit) test etmek için bırakılmış zayıf parola örneği.',
    favorite: false,
    updatedAt: '2024-05-11',
  },
];

// Helpers for Uint8Array <-> Base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesGcmKey(
  masterPassword: string,
  salt: Uint8Array,
  iterations = 310000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts the entire VaultItem[] array using AES-256-GCM + PBKDF2-SHA256
 */
export async function encryptVaultData(
  items: VaultItem[],
  masterPassword: string
): Promise<EncryptedVaultEnvelope> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 310000;
  const key = await deriveAesGcmKey(masterPassword, salt, iterations);

  const encodedPlain = new TextEncoder().encode(JSON.stringify(items));
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encodedPlain
  );

  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    cipher: 'AES-256-GCM',
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuf)),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypts an EncryptedVaultEnvelope back into VaultItem[]
 */
export async function decryptVaultData(
  envelope: EncryptedVaultEnvelope,
  masterPassword: string
): Promise<VaultItem[]> {
  const salt = base64ToBytes(envelope.saltBase64);
  const iv = base64ToBytes(envelope.ivBase64);
  const ciphertext = base64ToBytes(envelope.ciphertextBase64);
  const key = await deriveAesGcmKey(masterPassword, salt, envelope.iterations || 310000);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  const jsonStr = new TextDecoder().decode(decryptedBuf);
  return JSON.parse(jsonStr) as VaultItem[];
}

/**
 * Binary File Encryption (.corpuslock) — VeraCrypt / Cryptomator alternative
 * Format:
 * - 8 bytes Magic Header: "CRPSLCK1"
 * - 16 bytes Salt
 * - 12 bytes IV
 * - 2 bytes (Uint16BE) Metadata JSON byte length
 * - N bytes UTF-8 Metadata JSON ({ originalName, mimeType, size })
 * - Remaining bytes: AES-256-GCM encrypted file payload
 */
const MAGIC_HEADER = 'CRPSLCK1';

export async function encryptFileToCorpusLock(
  file: File,
  password: string
): Promise<{ blob: Blob; lockedName: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(password, salt, 250000);

  const fileBuf = await file.arrayBuffer();
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    fileBuf
  );

  const metaJson = JSON.stringify({
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    lockedAt: new Date().toISOString(),
  });
  const metaBytes = new TextEncoder().encode(metaJson);
  const magicBytes = new TextEncoder().encode(MAGIC_HEADER);

  const totalLen =
    8 + 16 + 12 + 2 + metaBytes.byteLength + encryptedBuf.byteLength;
  const out = new Uint8Array(totalLen);

  let offset = 0;
  out.set(magicBytes, offset);
  offset += 8;
  out.set(salt, offset);
  offset += 16;
  out.set(iv, offset);
  offset += 12;

  out[offset] = (metaBytes.byteLength >> 8) & 0xff;
  out[offset + 1] = metaBytes.byteLength & 0xff;
  offset += 2;

  out.set(metaBytes, offset);
  offset += metaBytes.byteLength;

  out.set(new Uint8Array(encryptedBuf), offset);

  return {
    blob: new Blob([out], { type: 'application/x-corpuslock' }),
    lockedName: `${file.name}.corpuslock`,
  };
}

export async function decryptCorpusLockFile(
  file: File,
  password: string
): Promise<{ blob: Blob; originalName: string; size: number }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (bytes.byteLength < 40) {
    throw new Error('Geçersiz veya bozuk .corpuslock dosyası.');
  }

  const magic = new TextDecoder().decode(bytes.slice(0, 8));
  if (magic !== MAGIC_HEADER) {
    throw new Error('Bu dosya geçerli bir CorpusLock (.corpuslock) şifreli paketi değil.');
  }

  const salt = bytes.slice(8, 24);
  const iv = bytes.slice(24, 36);
  const metaLen = (bytes[36] << 8) | bytes[37];
  const metaBytes = bytes.slice(38, 38 + metaLen);
  const ciphertext = bytes.slice(38 + metaLen);

  const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as {
    originalName: string;
    mimeType: string;
    size: number;
  };

  const key = await deriveAesGcmKey(password, salt, 250000);
  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return {
    blob: new Blob([decryptedBuf], { type: meta.mimeType || 'application/octet-stream' }),
    originalName: meta.originalName || file.name.replace(/\.corpuslock$/i, ''),
    size: decryptedBuf.byteLength,
  };
}

/**
 * RFC 6238 TOTP (Time-Based One-Time Password) 6-Digit Generator via WebCrypto HMAC-SHA1
 */
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export async function generateTotpCode(secretBase32: string): Promise<{
  code: string;
  secondsRemaining: number;
}> {
  const nowSec = Math.floor(Date.now() / 1000);
  const step = 30;
  const counter = Math.floor(nowSec / step);
  const secondsRemaining = step - (nowSec % step);

  const keyBytes = base32ToBytes(secretBase32);
  if (keyBytes.length === 0) {
    return { code: '------', secondsRemaining };
  }

  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const sig = new Uint8Array(
    await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes as unknown as BufferSource)
  );

  const offset = sig[sig.length - 1] & 0x0f;
  const binary =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return {
    code: `${otp.slice(0, 3)} ${otp.slice(3, 6)}`,
    secondsRemaining,
  };
}

/**
 * Cryptographic Password Generator & Security Auditor
 */
export function generateStrongPassword(options: {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let pool = '';
  if (options.lowercase) pool += 'abcdefghijkmnopqrstuvwxyz';
  if (options.uppercase) pool += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (options.numbers) pool += '23456789';
  if (options.symbols) pool += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!pool) pool = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const rand = new Uint32Array(options.length);
  window.crypto.getRandomValues(rand);
  let out = '';
  for (let i = 0; i < options.length; i++) {
    out += pool[rand[i] % pool.length];
  }
  return out;
}

export interface PasswordAuditInfo {
  entropyBits: number;
  strengthLabel: 'Çok Zayıf' | 'Orta' | 'Güçlü' | 'Askeri Düzey';
  crackTimeLabel: string;
  score: number; // 0 - 100
}

export function evaluatePasswordStrength(pwd: string): PasswordAuditInfo {
  if (!pwd) {
    return { entropyBits: 0, strengthLabel: 'Çok Zayıf', crackTimeLabel: 'Anında', score: 0 };
  }

  let poolSize = 0;
  if (/[a-z]/.test(pwd)) poolSize += 26;
  if (/[A-Z]/.test(pwd)) poolSize += 26;
  if (/[0-9]/.test(pwd)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32;

  const entropyBits = Math.round(pwd.length * Math.log2(Math.max(poolSize, 2)));

  const commonWeak = ['123456', 'password', 'password123', 'qwerty', 'admin', '12345678'];
  if (commonWeak.includes(pwd.toLowerCase()) || entropyBits < 45) {
    return {
      entropyBits,
      strengthLabel: 'Çok Zayıf',
      crackTimeLabel: '< 3 Saniye (Sözlük Saldırısı)',
      score: 20,
    };
  }
  if (entropyBits < 68) {
    return {
      entropyBits,
      strengthLabel: 'Orta',
      crackTimeLabel: '~4 Gün (GPU Kümesi)',
      score: 58,
    };
  }
  if (entropyBits < 95) {
    return {
      entropyBits,
      strengthLabel: 'Güçlü',
      crackTimeLabel: '~850 Yıl',
      score: 86,
    };
  }
  return {
    entropyBits,
    strengthLabel: 'Askeri Düzey',
    crackTimeLabel: '10M+ Yıl (Kuantum Dirençli)',
    score: 100,
  };
}
