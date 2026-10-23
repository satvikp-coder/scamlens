/**
 * Message rules, written as data.
 *
 * To add a new warning sign: add an entry here, add its texts to the three
 * language files (src/i18n), and add test cases. No other code changes are
 * needed. Patterns run against the NORMALIZED text (lower-case, NFKC, digits
 * mapped to 0-9), so write them in lower case.
 *
 * Pattern groups are labelled with the language style they target:
 *   EN = English, HG = Hinglish (Hindi in Roman letters),
 *   HI = Hindi (Devanagari), GU = Gujarati.
 * A pattern from any group may match any message, so mixed-language text works.
 */

import type { Category, MessageFindingId, Severity } from './types';

export interface MessageRule {
  id: MessageFindingId;
  category: Category;
  severity: Severity;
  decisive: boolean;
  patterns: RegExp[];
  /** The whole message must also match this for the rule to apply. */
  context?: RegExp;
  /** Upgrade to "strong" when the whole message also matches this. */
  strongWhen?: RegExp;
  /** Skip a match preceded by "do not", "never", "न", etc. */
  negatable?: boolean;
  /** Skip a match when this appears within ~70 characters of it. */
  exceptionNear?: RegExp;
  /** Skip a match followed by e.g. "is not charged". */
  notAfter?: RegExp;
  /** Skip a match preceded by e.g. "no", "zero", "without". */
  notBefore?: RegExp;
}

const AMOUNT = String.raw`(?:\brs\.?|\binr\b|₹)\s?\d[\d,]*(?:\.\d+)?`;

export const MESSAGE_RULES: MessageRule[] = [
  // -------------------------------------------------------------------------
  // Asking for secrets. Real banks and services never ask for these.
  // -------------------------------------------------------------------------
  {
    id: 'credentials.otp',
    category: 'credentials',
    severity: 'strong',
    decisive: true,
    negatable: true,
    // Delivery apps really do ask you to tell the delivery person an OTP at
    // the door. We do not flag that specific situation.
    exceptionNear:
      /delivery (?:partner|agent|executive|person|boy|associate)|courier (?:partner|boy|executive)|\brider\b|डिलीवरी (?:पार्टनर|एजेंट|बॉय|वाले)|ડિલિવરી (?:પાર્ટનર|એજન્ટ|બોય)/,
    patterns: [
      // EN
      /\b(?:share|send|tell|give|provide|forward|read out|dictate|disclose|reply with|text me)\b[^.\n]{0,40}?\b(?:otp|o\.t\.p|one[- ]?time[- ]?(?:password|pin|code)|verification code|security code|auth(?:entication)? code|passcode)\b/g,
      /\b(?:otp|verification code|security code)\b[^.\n]{0,30}?\b(?:share|send|tell|forward|provide)\b/g,
      // HG
      /\botp\b[^.\n]{0,25}\b(?:bhej(?:o|na|iye|iyega)?|batao|bata(?:o|iye|iyega|yein)?|btao|de do|dena|dijiye|share kar(?:o|na|ein|iye)?|send kar(?:o|na|ein)?)\b/g,
      /\b(?:share|send)\s+kar(?:o|na|ein|iye)?\b[^.\n]{0,25}\botp\b/g,
      // HI
      /(?:ओटीपी|ओ\.?टी\.?पी|otp)[^।.\n]{0,25}(?:बताएं|बताइए|बताओ|बताना|बतायें|भेजें|भेजिए|भेजो|साझा|शेयर|दीजिए|दें|दो)/g,
      /(?:बताएं|बताइए|बताओ|भेजें|भेजिए|साझा|शेयर|दीजिए)[^।.\n]{0,25}(?:ओटीपी|otp)/g,
      // GU
      /(?:ઓટીપી|otp)[^.\n]{0,25}(?:જણાવો|જણાવ|મોકલો|મોકલ|શેર|આપો|કહો)/g,
      /(?:જણાવો|મોકલો|શેર કરો|આપો)[^.\n]{0,25}(?:ઓટીપી|otp)/g,
    ],
  },
  {
    id: 'credentials.pin_password',
    category: 'credentials',
    severity: 'strong',
    decisive: true,
    negatable: true,
    patterns: [
      // EN ("pin code" is the postal code, so it is excluded)
      /\b(?:share|send|tell|give|provide|submit|disclose|reply with|text)\b[^.\n]{0,40}?\b(?:(?:upi|atm|debit|credit|m|mobile|transaction|login|card|bank)[- ]?pin\b|your pin\b(?! ?code)|mpin\b|passwords?\b|passcode\b|login (?:id|details|credentials)|net ?banking (?:id|details|credentials|password)|banking (?:details|credentials))/g,
      // HG
      /\b(?:upi\s*pin|atm\s*pin|mpin|pin(?! ?code)|password)\b[^.\n]{0,25}\b(?:bhej(?:o|iye)?|batao|bata(?:o|iye|yein)?|btao|de do|dena|dijiye|share kar(?:o|na|ein)?|enter kar(?:o|na|ein)?|dalo|daalo)\b/g,
      /\b(?:share|send)\s+kar(?:o|na|ein)?\b[^.\n]{0,25}\b(?:upi\s*pin|atm\s*pin|mpin|password)\b/g,
      // HI
      /(?:यूपीआई\s*पिन|एटीएम\s*पिन|एमपिन|पासवर्ड|upi\s*pin|पिन(?! ?कोड))[^।.\n]{0,25}(?:बताएं|बताइए|बताओ|भेजें|भेजिए|डालें|दर्ज|साझा|शेयर|दीजिए|दें)/g,
      // GU
      /(?:યુપીઆઈ\s*પિન|એટીએમ\s*પિન|પાસવર્ડ|upi\s*pin|પિન(?! ?કોડ))[^.\n]{0,25}(?:જણાવો|મોકલો|નાખો|દાખલ|શેર|આપો)/g,
    ],
  },
  {
    id: 'credentials.card',
    category: 'credentials',
    severity: 'strong',
    decisive: true,
    negatable: true,
    patterns: [
      /\b(?:share|send|tell|give|provide|submit|enter|confirm|reply with)\b[^.\n]{0,40}?\b(?:cvv|cvc|card (?:number|no\.?|details)|(?:debit|credit|atm) card (?:number|details|no\.?)|expiry date|expiration date|full card)\b/g,
      /\b(?:cvv|card number|card no|card details)\b[^.\n]{0,25}\b(?:bhej|batao|bata|share kar|dena|de do|dijiye)/g,
      /(?:सीवीवी|cvv|कार्ड (?:नंबर|नम्बर|विवरण|डिटेल))[^।.\n]{0,25}(?:बताएं|बताइए|भेजें|भेजिए|साझा|शेयर|दें)/g,
      /(?:સીવીવી|cvv|કાર્ડ (?:નંબર|વિગતો|ડિટેલ))[^.\n]{0,25}(?:જણાવો|મોકલો|શેર|આપો)/g,
    ],
  },

  // -------------------------------------------------------------------------
  // Money
  // -------------------------------------------------------------------------
  {
    id: 'payment.fee',
    category: 'payment',
    severity: 'moderate',
    // A fee demand tied to a parcel is the classic delivery scam.
    strongWhen: /\b(?:parcel|package|courier|shipment|consignment|customs|delivery|redelivery|re-delivery|dispatch)\b|पार्सल|कूरियर|डिलीवरी|પાર્સલ|કુરિયર|ડિલિવરી/,
    decisive: false,
    patterns: [
      // EN
      new RegExp(
        String.raw`(?:\bpay\b|\bsend\b|\bdeposit\b|\btransfer\b|\bremit\b)[^.\n]{0,40}?${AMOUNT}[^.\n]{0,60}?\b(?:fee|fees|charges?|fine|deposit|duty|tax|clearance|re-?delivery|processing|registration|insurance|customs|penalty)\b`,
        'g',
      ),
      new RegExp(
        String.raw`\b(?:re-?delivery|delivery|customs|clearance|processing|registration|release|handling|insurance|security|refundable|activation|verification)\s+(?:fee|fees|charges?|deposit|duty)\b[^.\n]{0,60}?${AMOUNT}`,
        'g',
      ),
      new RegExp(
        String.raw`${AMOUNT}\s*(?:\/-)?\s*(?:as|for|towards|is)?\s*(?:a |the )?(?:re-?delivery|delivery|customs|clearance|processing|registration|release|handling|insurance|security|refundable|activation|verification)\s+(?:fee|fees|charges?|deposit|duty)\b`,
        'g',
      ),
      /\bpay\b[^.\n]{0,25}\b(?:small|nominal|pending|re-?delivery|customs|clearance|processing|registration)\s+(?:fee|fees|charges?|amount|duty)\b/g,
      // HG
      /\b(?:fee|fees|charges?|shulk|duty|deposit|penalty|jurmana)\b[^.\n]{0,40}\b(?:bhej(?:o|iye)?|jama|pay (?:karo|karein|kijiye)|bharna|bharo|dena|de do)\b/g,
      /\b(?:bhej(?:o|iye)?|jama|pay (?:karo|karein|kijiye)|bharo)\b[^.\n]{0,40}\b(?:fee|fees|charges?|shulk|duty|deposit|penalty)\b/g,
      // HI
      /(?:शुल्क|फीस|चार्ज)[^।\n]{0,40}(?:जमा करें|भुगतान करें|भेजें|भेजिए|चुकाएं|जमा करना|चुकाना)/g,
      /(?:जमा करें|भुगतान करें|चुकाएं)[^।\n]{0,40}(?:शुल्क|फीस|चार्ज)/g,
      // GU
      /(?:ફી|ચાર્જ|શુલ્ક|દંડ)[^.\n]{0,40}(?:જમા કરો|ચૂકવો|ચૂકવવા|ભરો|ભરવા|મોકલો)/g,
      /(?:જમા કરો|ચૂકવો|ભરો)[^.\n]{0,40}(?:ફી|ચાર્જ|શુલ્ક)/g,
    ],
  },
  {
    id: 'payment.upi_trick',
    category: 'payment',
    severity: 'strong',
    decisive: true,
    patterns: [
      // Receiving money never needs your PIN or a QR scan from you.
      /\b(?:enter|share|type)\b[^.\n]{0,30}\bupi\s*pin\b[^.\n]{0,40}\b(?:receive|get|credit|refund|claim)\b/g,
      /\b(?:scan|accept|approve)\b[^.\n]{0,40}\b(?:qr(?: code)?|collect request|payment request|upi request)\b[^.\n]{0,50}\b(?:receive|get|refund|claim|credit|cashback|prize|reward)\b/g,
      /\b(?:receive|get|claim)\b[^.\n]{0,30}\b(?:money|refund|cashback|payment)\b[^.\n]{0,40}\b(?:scan|enter\s+(?:your\s+)?(?:upi\s*)?pin)\b/g,
      /(?:paise|paisa|refund|cashback)[^.\n]{0,40}(?:pin\s+(?:dalo|daalo|enter|dalein)|qr\s+scan)/g,
      /(?:upi\s*pin|qr)[^.\n]{0,30}(?:dalo|daalo|scan kar(?:o|ein|na))[^.\n]{0,40}(?:paise|refund|cashback|milenge|aayenge|aayega)/g,
      /(?:upi\s*pin|यूपीआई\s*पिन|पिन)[^।.\n]{0,40}(?:पैसे|रिफंड|कैशबैक|मिलेंगे|आएंगे)/g,
      /(?:पैसे|रिफंड|कैशबैक)[^।\n]{0,40}(?:क्यूआर|qr)[^।\n]{0,30}स्कैन/g,
      /(?:પૈસા|રિફંડ|કેશબેક)[^.\n]{0,40}(?:યુપીઆઈ\s*પિન|upi\s*pin|ક્યુઆર|qr)[^.\n]{0,30}(?:નાખો|દાખલ|સ્કેન)/g,
    ],
  },

  // -------------------------------------------------------------------------
  // Pressure
  // -------------------------------------------------------------------------
  {
    id: 'urgency.pressure',
    category: 'urgency',
    severity: 'weak',
    decisive: false,
    patterns: [
      /\b(?:urgent(?:ly)?|immediately|right away|act now|within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|last (?:chance|warning|reminder)|expires? (?:today|soon|in)|limited time|final notice|asap)\b/g,
      /\b(?:turant|foran|jaldi se|jald se jald|aaj hi|\d+ ghante (?:mein|me|ke andar))\b/g,
      /(?:तुरंत|फौरन|जल्द से जल्द|आज ही|\d+ घंटे (?:में|के अंदर))/g,
      /(?:તાત્કાલિક|તરત જ|આજે જ|\d+ કલાકમાં|\d+ કલાકની અંદર)/g,
    ],
  },
  {
    id: 'urgency.threat',
    category: 'urgency',
    severity: 'moderate',
    strongWhen: /digital arrest|money laundering|contraband|\bdrugs\b|डिजिटल अरेस्ट|डिजिटल अरेस्ट|ડિજિટલ અરેસ્ટ/,
    decisive: false,
    patterns: [
      /\b(?:account|card|sim|number|upi|wallet|kyc|service|electricity|connection)\b[^.\n]{0,40}\b(?:will be|has been|is|gets?|shall be)\s+(?:blocked|suspended|closed|deactivated|disconnected|frozen|cancelled|terminated|expired?)\b/g,
      /\b(?:legal action|arrest warrant|arrested|fir will be|police case|penalty will|fine will be|case (?:will be )?filed|digital arrest)\b/g,
      /\b(?:block (?:ho|kar)|band ho jayega|band kar diya|suspend ho|giraftar)\b/g,
      /(?:ब्लॉक (?:हो|कर)|बंद हो (?:जाएगा|जाएगी)|बंद कर दिया|निलंबित|कानूनी कार्रवाई|गिरफ्तार|एफआईआर|डिजिटल अरेस्ट)/g,
      /(?:બ્લોક થ|બંધ થઈ જશે|બંધ કરી દેવા|કાનૂની કાર્યવાહી|ધરપકડ|ડિજિટલ અરેસ્ટ)/g,
    ],
  },

  // -------------------------------------------------------------------------
  // Too-good-to-be-true offers
  // -------------------------------------------------------------------------
  {
    id: 'reward.prize',
    category: 'reward',
    severity: 'strong',
    decisive: false,
    patterns: [
      /\b(?:you(?:'ve| have)? (?:won|been selected)|you are (?:selected|the lucky)|lucky (?:draw|winner)|lottery|claim (?:your )?(?:prize|reward|gift|cashback)|cash prize|free gift)\b/g,
      /\b(?:aapne|aap ne)\s+(?:jeeta|jeet|jita)\b|\b(?:inaam|jeet gaye)\b/g,
      /(?:लॉटरी|इनाम|लकी ड्रॉ|आपने[^।\n]{0,20}जीत)/g,
      /(?:લોટરી|ઇનામ|લકી ડ્રો|તમે[^.\n]{0,20}જીત્યા)/g,
    ],
  },
  {
    id: 'job.upfront_fee',
    category: 'job',
    severity: 'strong',
    decisive: false,
    context:
      /\b(?:job|jobs|hiring|vacancy|recruit(?:ment|ing)?|offer letter|work from home|wfh|part[- ]?time|full[- ]?time|interview|placement|selected for|appointment letter)\b|नौकरी|भर्ती|जॉब|નોકરી|ભરતી|જોબ/,
    notBefore: /(?:\bno|zero|without|nil|free of|never charge[sd]?(?: any)?|do not charge(?: any)?|don['’]?t charge(?: any)?)\s+(?:any\s+)?$/,
    notAfter: /^\s*(?:is |are |will )?(?:not|nahi|nahin|नहीं|नही|નથી|લેવાતી નથી)/,
    patterns: [
      /\b(?:registration|training|joining|security|kit|processing|id card|refundable|application|interview|laptop|uniform|verification|document)\s+(?:fee|fees|charges?|deposit|amount)\b/g,
      /\b(?:pay|deposit|send)\b[^.\n]{0,40}\b(?:to (?:confirm|secure|book|reserve)|for)\b[^.\n]{0,25}\b(?:job|position|seat|slot|joining|offer)\b/g,
      /(?:रजिस्ट्रेशन|पंजीकरण|ट्रेनिंग|जॉइनिंग|सिक्योरिटी|सिक्यॉरिटी)\s*(?:शुल्क|फीस|चार्ज|राशि|डिपॉज़िट|डिपॉजिट)/g,
      /(?:રજિસ્ટ્રેશન|ટ્રેનિંગ|જોઇનિંગ|સિક્યોરિટી)\s*(?:ફી|ચાર્જ|શુલ્ક|ડિપોઝિટ)/g,
    ],
  },
  {
    id: 'job.easy_income',
    category: 'job',
    severity: 'moderate',
    decisive: false,
    patterns: [
      new RegExp(
        String.raw`\b(?:earn|income|make)\b[^.\n]{0,25}${AMOUNT}[^.\n]{0,25}\b(?:per day|daily|a day|per hour|hourly|per week|weekly|from home|at home)\b`,
        'g',
      ),
      /\b(?:work from home|wfh|part[- ]?time)\b[^.\n]{0,60}\b(?:earn|income|salary|payout)\b/g,
      /\b(?:like|rate|review|subscribe|follow)\b[^.\n]{0,30}\b(?:youtube|videos?|products?|hotels?|reels?|instagram)\b[^.\n]{0,40}\b(?:earn|commission|paid|pay)\b/g,
      /\bno (?:experience|interview|investment) (?:needed|required)\b/g,
      /\bghar baithe\b[^.\n]{0,30}\b(?:kamao|kamaye|kamai|earn)\b/g,
      /(?:घर बैठे|वर्क फ्रॉम होम)[^।\n]{0,40}(?:कमाएं|कमाइए|कमाई|इनकम)/g,
      /(?:ઘરે બેઠા|વર્ક ફ્રોમ હોમ)[^.\n]{0,40}(?:કમાઓ|કમાવો|કમાણી|આવક)/g,
    ],
  },

  // -------------------------------------------------------------------------
  // Who is "speaking"
  // -------------------------------------------------------------------------
  {
    id: 'impersonation.authority',
    category: 'impersonation',
    severity: 'weak',
    decisive: false,
    // Naming a bank is normal. We only note it when the message also tells
    // you to click, call, pay, verify or install something.
    context:
      /\b(?:click|tap|call|update|verify|kyc|pay|download|install|login|log in|link|reactivate|confirm)\b|क्लिक|कॉल|अपडेट|वेरिफाई|केवाईसी|ક્લિક|કૉલ|અપડેટ|વેરિફાય|કેવાયસી/,
    patterns: [
      /\b(?:state bank of india|sbi|hdfc(?: bank)?|icici(?: bank)?|axis bank|punjab national bank|pnb|kotak|rbi|reserve bank|npci|income tax(?: department)?|customs(?: department)?|india post|post office|trai|uidai|aadhaar|epfo|cbi|police|cyber ?crime|enforcement directorate|paytm|phonepe|google pay|customer care|support team)\b/g,
      /(?:भारतीय स्टेट बैंक|एसबीआई|आयकर विभाग|रिजर्व बैंक|आरबीआई|सीमा शुल्क|इंडिया पोस्ट|डाक विभाग|पुलिस|सीबीआई|यूआईडीएआई|आधार|ट्राई)/g,
      /(?:સ્ટેટ બેંક|એસબીઆઈ|આવકવેરા|રિઝર્વ બેંક|આરબીઆઈ|કસ્ટમ|ઇન્ડિયા પોસ્ટ|પોલીસ|સીબીઆઈ|આધાર|ટ્રાઈ)/g,
    ],
  },
  {
    id: 'remote.app',
    category: 'remote-access',
    severity: 'strong',
    decisive: true,
    patterns: [
      /\b(?:download|install|open|use|start)\b[^.\n]{0,30}\b(?:anydesk|any desk|teamviewer|team viewer|quicksupport|rustdesk|airdroid|ultraviewer)\b/g,
      /\bshare\b[^.\n]{0,15}\bscreen\b/g,
      /(?:एनीडेस्क|टीमव्यूअर|anydesk|teamviewer)[^।\n]{0,30}(?:डाउनलोड|इंस्टॉल|इन्स्टॉल|download|install)/g,
      /(?:डाउनलोड|इंस्टॉल)[^।\n]{0,30}(?:एनीडेस्क|टीमव्यूअर|anydesk|teamviewer)/g,
      /(?:એનીડેસ્ક|ટીમવ્યૂઅર|anydesk|teamviewer)[^.\n]{0,30}(?:ડાઉનલોડ|ઇન્સ્ટોલ|download|install)/g,
      /(?:ડાઉનલોડ|ઇન્સ્ટોલ)[^.\n]{0,30}(?:એનીડેસ્ક|ટીમવ્યૂઅર|anydesk|teamviewer)/g,
    ],
  },
  {
    id: 'offplatform.contact',
    category: 'off-platform',
    severity: 'weak',
    decisive: false,
    patterns: [
      /\b(?:whatsapp|telegram|signal)\b[^.\n]{0,30}(?:\+?91[- ]?)?\d{10}/g,
      /\b(?:contact|message|text|ping|dm|join)\b[^.\n]{0,30}\b(?:whatsapp|telegram)\b/g,
      /\bt\.me\/|\bwa\.me\//g,
      /(?:व्हाट्सएप|वॉट्सऐप|टेलीग्राम|વોટ્સએપ|ટેલિગ્રામ)/g,
    ],
  },
];

/** Phrases directly before a match that turn it into advice, e.g. "never share". */
export const NEGATION_BEFORE =
  /(?:(?:do not|don['’]?t|dont|never|not|mat)\s+(?:(?:ever|please|kindly|to)\s+)*(?:(?:ask|asks|request|requests)\s+(?:you\s+)?(?:to\s+)?)?|(?:^|\s)(?:न|ना|नहीं|ન|ના|નહીં)\s*)$/;

/**
 * Negation right after the matched text, e.g. "साझा न करें" / "શેર ન કરો" /
 * "share mat karo". "नहीं तो" ("or else") is a threat, not a negation.
 */
export const NEGATION_AFTER =
  /^\s*(?:न|ना|नहीं|नही|मत|ન|ના|નહીં|નહિ|mat|nahi|nahin)(?!\s*(?:तो|to\b))(?=\s|$|[।.,!])/;

/** Negation words inside the matched text, e.g. "ओटीपी किसी को न बताएं". */
export const NEGATION_INSIDE = /(?:^|\s)(?:न|ना|नहीं|नही|ન|ના|નહીં|mat|nahi|nahin|not|never)(?:\s|$)/;
