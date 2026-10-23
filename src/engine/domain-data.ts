/**
 * Static reference data used by the URL checks.
 *
 * IMPORTANT: these lists are small, hand-written starter lists. They are NOT
 * complete and must be reviewed before each release (see
 * docs/DETECTION_ENGINE.md). A domain missing from a list means "we don't
 * know it", never "it is unsafe" or "it is safe".
 */

export interface Brand {
  id: string;
  /** Name shown to the user. Brand names are not translated. */
  name: string;
  /** Registrable domains we treat as official. */
  officialDomains: string[];
  /**
   * Words that, when they appear as a whole word in a host name that is not
   * official, suggest imitation. Short words (under 6 letters) must match a
   * whole hyphen/dot-separated word; longer ones may match inside a word.
   */
  tokens: string[];
}

export const BRANDS: Brand[] = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    officialDomains: ['sbi.co.in', 'onlinesbi.sbi', 'onlinesbi.com', 'sbi.bank.in', 'sbicard.com'],
    tokens: ['sbi', 'onlinesbi', 'sbicard'],
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    officialDomains: ['hdfcbank.com', 'hdfcbank.bank.in', 'hdfc.com', 'hdfclife.com', 'hdfcsec.com'],
    tokens: ['hdfc', 'hdfcbank'],
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    officialDomains: ['icicibank.com', 'icici.bank.in', 'icicidirect.com', 'iciciprulife.com'],
    tokens: ['icici', 'icicibank'],
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    officialDomains: ['axisbank.com', 'axis.bank.in', 'axismf.com'],
    tokens: ['axisbank'],
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    officialDomains: ['pnbindia.in', 'pnb.bank.in'],
    tokens: ['pnb', 'pnbindia'],
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    officialDomains: ['kotak.com', 'kotak.bank.in'],
    tokens: ['kotak'],
  },
  {
    id: 'paytm',
    name: 'Paytm',
    officialDomains: ['paytm.com', 'paytmbank.com'],
    tokens: ['paytm'],
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    officialDomains: ['phonepe.com'],
    tokens: ['phonepe'],
  },
  {
    id: 'google',
    name: 'Google',
    officialDomains: [
      'google.com',
      'google.co.in',
      'gstatic.com',
      'googleusercontent.com',
      'gmail.com',
      'youtube.com',
      'goo.gl',
      'googleapis.com',
      'googlevideo.com',
      'googletagmanager.com',
      'google-analytics.com',
      'withgoogle.com',
    ],
    tokens: ['google', 'googlepay', 'gpay'],
  },
  {
    id: 'npci',
    name: 'NPCI / BHIM UPI',
    officialDomains: ['npci.org.in', 'bhimupi.org.in'],
    tokens: ['npci', 'bhim'],
  },
  {
    id: 'rbi',
    name: 'Reserve Bank of India',
    officialDomains: ['rbi.org.in'],
    tokens: ['rbi'],
  },
  {
    id: 'incometax',
    name: 'Income Tax Department',
    officialDomains: ['incometax.gov.in', 'incometaxindia.gov.in'],
    tokens: ['incometax', 'incometaxindia'],
  },
  {
    id: 'uidai',
    name: 'UIDAI (Aadhaar)',
    officialDomains: ['uidai.gov.in'],
    tokens: ['uidai', 'aadhaar', 'aadhar'],
  },
  {
    id: 'epfo',
    name: 'EPFO',
    officialDomains: ['epfindia.gov.in'],
    tokens: ['epfo', 'epfindia'],
  },
  {
    id: 'indiapost',
    name: 'India Post',
    officialDomains: ['indiapost.gov.in'],
    tokens: ['indiapost'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    officialDomains: [
      'amazon.in',
      'amazon.com',
      'amazon.co.in',
      'amzn.in',
      'amzn.to',
      'amazonpay.in',
      'amazonaws.com',
      'aboutamazon.com',
      'amazon.jobs',
    ],
    tokens: ['amazon'],
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    officialDomains: ['flipkart.com'],
    tokens: ['flipkart'],
  },
  {
    id: 'delhivery',
    name: 'Delhivery',
    officialDomains: ['delhivery.com'],
    tokens: ['delhivery'],
  },
  {
    id: 'bluedart',
    name: 'Blue Dart',
    officialDomains: ['bluedart.com'],
    tokens: ['bluedart'],
  },
  {
    id: 'dtdc',
    name: 'DTDC',
    officialDomains: ['dtdc.in', 'dtdc.com'],
    tokens: ['dtdc'],
  },
  {
    id: 'fedex',
    name: 'FedEx',
    officialDomains: ['fedex.com'],
    tokens: ['fedex'],
  },
  {
    id: 'dhl',
    name: 'DHL',
    officialDomains: ['dhl.com'],
    tokens: ['dhl'],
  },
  {
    id: 'irctc',
    name: 'IRCTC',
    officialDomains: ['irctc.co.in', 'irctc.com'],
    tokens: ['irctc'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    officialDomains: ['whatsapp.com', 'wa.me'],
    tokens: ['whatsapp'],
  },
  {
    id: 'digilocker',
    name: 'DigiLocker',
    officialDomains: ['digilocker.gov.in'],
    tokens: ['digilocker'],
  },
];

/**
 * The main label of each official domain, used for look-alike spelling
 * checks (for example "paytrn" or "amaz0n"). Only labels of 5+ characters.
 */
export const BRAND_LABELS: { label: string; brand: Brand }[] = BRANDS.flatMap((brand) =>
  brand.officialDomains
    .map((d) => d.split('.')[0])
    .filter((label, i, arr) => label.length >= 5 && arr.indexOf(label) === i)
    .map((label) => ({ label, brand })),
);

/** Ordinary words that sit one letter away from a brand label. */
export const COMMON_WORDS = new Set(['delivery', 'deliveries']);

/** Link-shortening services: the real destination is hidden. */
export const SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'rb.gy',
  'is.gd',
  'shorturl.at',
  'tiny.cc',
  'ow.ly',
  'buff.ly',
  'rebrand.ly',
  'goo.su',
  's.id',
  'v.gd',
  't.ly',
  'bl.ink',
  'lnkd.in',
  'wp.me',
  'qr.net',
]);

/**
 * Two-part public suffixes common in India and a few other places. A real
 * implementation would use the full Public Suffix List; this small set keeps
 * the app small and works for the cases that matter most for Indian users.
 */
export const MULTIPART_SUFFIXES = new Set([
  'co.in',
  'org.in',
  'net.in',
  'gov.in',
  'nic.in',
  'ac.in',
  'edu.in',
  'res.in',
  'gen.in',
  'firm.in',
  'ind.in',
  'bank.in',
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'co.za',
  'com.br',
  'com.cn',
  'co.jp',
  'com.sg',
  'com.my',
  'com.pk',
  'com.bd',
  'co.id',
  'com.ng',
  'com.hk',
]);

/**
 * Top-level domains that are cheap or free and heavily used for throw-away
 * sites. Many honest sites also use them, so this is only a weak signal.
 */
export const RISKY_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'icu',
  'buzz',
  'cfd',
  'sbs',
  'cyou',
  'monster',
  'vip',
  'loan',
  'gq',
  'tk',
  'ml',
  'ga',
  'cf',
  'men',
  'zip',
  'mov',
  'rest',
  'quest',
  'autos',
  'bond',
]);

/**
 * TLDs we are willing to treat as a domain when they appear without
 * "http://" in a message (so "e.g." or "file.txt" are not mistaken for sites).
 */
export const BARE_DOMAIN_TLDS = new Set([
  'com',
  'in',
  'net',
  'org',
  'info',
  'biz',
  'co',
  'io',
  'me',
  'app',
  'link',
  'live',
  'online',
  'site',
  'shop',
  'store',
  'tech',
  'ly',
  'gl',
  'to',
  'cc',
  'ee',
  'gov',
  'edu',
  'pro',
  'cloud',
  'page',
  'sbi',
  'bank',
  ...RISKY_TLDS,
]);

/** Query-string parameter names that should never carry secrets in a link. */
export const SENSITIVE_PARAMS = new Set([
  'otp',
  'pin',
  'mpin',
  'upipin',
  'password',
  'passwd',
  'pwd',
  'cvv',
  'cardno',
  'cardnumber',
  'aadhaar',
  'aadhar',
  'pan',
]);

/** Letters that look like Latin letters but belong to Cyrillic or Greek. */
export const HOMOGLYPHS = new Set([
  // Cyrillic
  'а', 'е', 'о', 'р', 'с', 'у', 'х', 'і', 'ј', 'ѕ', 'ԁ', 'ԛ', 'ԝ', 'һ', 'ԍ',
  // Greek
  'ο', 'α', 'ν', 'ρ', 'τ', 'ι', 'κ', 'υ',
]);
