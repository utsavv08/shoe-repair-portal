/**
 * Domain-Specific Tongue Tag OCR Parser & Cleaner
 * Handles diverse shoe tongue label layouts, print quality variations,
 * OCR character ambiguities (e.g. 0 vs O, 1 vs I/l), and multi-region size tables.
 */

export interface ParsedTongueTag {
  brand: string | null;
  modelNumber: string | null;
  sizeDetails: {
    primary: string | null;
    us?: string;
    uk?: string;
    eur?: string;
    cm?: string;
  };
  confidence: number; // 0.0 to 1.0
  brandDetected: boolean;
  modelDetected: boolean;
  sizeDetected: boolean;
  cleanedText: string;
}

// Known Brand dictionary with regex matchers
const BRAND_PATTERNS: Array<{ brand: string; pattern: RegExp; priority: number }> = [
  { brand: 'Air Jordan', pattern: /\b(AIR\s*JORDAN|JORDAN|JUMPMAN)\b/i, priority: 10 },
  { brand: 'Nike', pattern: /\b(NIKE(?:\s*AIR)?|SWOOSH)\b/i, priority: 9 },
  { brand: 'Adidas', pattern: /\b(ADIDAS(?:\s*ORIGINALS)?|YEEZY)\b/i, priority: 9 },
  { brand: 'New Balance', pattern: /\b(NEW\s*BALANCE|\bNB\b)\b/i, priority: 9 },
  { brand: 'Puma', pattern: /\b(PUMA)\b/i, priority: 8 },
  { brand: 'Asics', pattern: /\b(ASICS|ONITSUKA\s*TIGER)\b/i, priority: 8 },
  { brand: 'Vans', pattern: /\b(VANS(?:\s*OFF\s*THE\s*WALL)?)\b/i, priority: 8 },
  { brand: 'Converse', pattern: /\b(CONVERSE(?:\s*ALL\s*STAR)?|CHUCK\s*TAYLOR)\b/i, priority: 8 },
  { brand: 'Reebok', pattern: /\b(REEBOK)\b/i, priority: 8 },
  { brand: 'Under Armour', pattern: /\b(UNDER\s*ARMOUR|\bUA\b)\b/i, priority: 7 },
  { brand: 'Hoka', pattern: /\b(HOKA(?:\s*ONE\s*ONE)?)\b/i, priority: 7 },
  { brand: 'On Running', pattern: /\b(ON\s*RUNNING|CLOUDTEC)\b/i, priority: 7 },
  { brand: 'Dr. Martens', pattern: /\b(DR\.?\s*MARTENS|DOC\s*MARTENS|AIRWAIR)\b/i, priority: 7 },
  { brand: 'Red Wing', pattern: /\b(RED\s*WING(?:\s*SHOES)?)\b/i, priority: 7 },
  { brand: 'Timberland', pattern: /\b(TIMBERLAND)\b/i, priority: 7 },
  { brand: 'Clarks', pattern: /\b(CLARKS)\b/i, priority: 7 },
  { brand: 'Birkenstock', pattern: /\b(BIRKENSTOCK)\b/i, priority: 7 },
  { brand: 'Salomon', pattern: /\b(SALOMON)\b/i, priority: 7 },
  { brand: 'Saucony', pattern: /\b(SAUCONY)\b/i, priority: 7 },
];

/**
 * Resolves classic OCR character confusions:
 * In Nike/Jordan style code suffixes (e.g. CW2288-111), the 3 characters after hyphen are digits.
 * If OCR reads 'I' or 'l', resolve to '1'. If 'O' or 'D', resolve to '0'.
 */
function resolveOcrAmbiguitiesInNikeSku(prefix: string, suffix: string): string {
  const cleanSuffix = suffix
    .split('')
    .map((ch) => {
      if (['I', 'L', 'l', '|', '/', '!', 'T'].includes(ch)) return '1';
      if (['O', 'D', 'Q', 'U'].includes(ch.toUpperCase())) return '0';
      if (['B', 'E'].includes(ch.toUpperCase())) return '8';
      if (['S', '$'].includes(ch)) return '5';
      if (['Z'].includes(ch.toUpperCase())) return '2';
      return ch;
    })
    .join('');

  return `${prefix.toUpperCase()}-${cleanSuffix}`;
}

/**
 * Parses raw OCR text from a shoe tongue label into structured Brand, Model, and Size.
 */
export function parseTongueTagText(rawText: string): ParsedTongueTag {
  if (!rawText || !rawText.trim()) {
    return {
      brand: null,
      modelNumber: null,
      sizeDetails: { primary: null },
      confidence: 0,
      brandDetected: false,
      modelDetected: false,
      sizeDetected: false,
      cleanedText: '',
    };
  }

  // Pre-normalize text
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // -------------------------------------------------------------
  // 1. EXTRACT SHOE BRAND
  // -------------------------------------------------------------
  let detectedBrand: string | null = null;
  let highestPriority = -1;

  for (const { brand, pattern, priority } of BRAND_PATTERNS) {
    if (pattern.test(normalized) && priority > highestPriority) {
      detectedBrand = brand;
      highestPriority = priority;
    }
  }

  // -------------------------------------------------------------
  // 2. EXTRACT MODEL / STYLE / SKU NUMBER
  // -------------------------------------------------------------
  let detectedModel: string | null = null;

  // Nike / Jordan Style Code pattern: 6 alphanumeric chars + hyphen + 3 digits (e.g., CW2288-111, CD0461-001)
  // Also catches OCR noise like space, underscore, or period instead of hyphen (e.g., CW2288 111)
  const nikeHyphenRegex = /\b([A-Z0-9]{6})[\s\-_.:]([A-Z0-9]{3})\b/i;
  const nikeMatch = normalized.match(nikeHyphenRegex);

  if (nikeMatch) {
    const rawPrefix = nikeMatch[1];
    const rawSuffix = nikeMatch[2];

    // Filter out common false positives like dates (e.g. 10/12/20) or factory codes
    const isDateLike = /^\d{2}[-/]\d{2}[-/]\d{2}$/.test(nikeMatch[0]);
    if (!isDateLike) {
      detectedModel = resolveOcrAmbiguitiesInNikeSku(rawPrefix, rawSuffix);
      if (!detectedBrand) detectedBrand = 'Nike';
    }
  }

  // Adidas Art / Style Number (e.g. ART FZ5421, ART. B75806, or standalone FZ5421 / EG4958 / B75806)
  if (!detectedModel) {
    const adidasArtRegex = /\b(?:ART|ART\.?|STYLE)[\s:]*([A-Z0-9]{6})\b/i;
    const adidasMatch = normalized.match(adidasArtRegex);
    if (adidasMatch && !['MADEIN', 'FABRIQ', 'VIETNA'].includes(adidasMatch[1].toUpperCase())) {
      detectedModel = adidasMatch[1].toUpperCase();
      if (!detectedBrand) detectedBrand = 'Adidas';
    }
  }

  // Adidas 6-char alphanumeric standalone style code (e.g. FZ5421, GW0285, FY2903, EG4958)
  if (!detectedModel) {
    const adidasStyleRegex = /\b([A-Z]{1,2}\d{4,5})\b/;
    const adidasStandMatch = normalized.match(adidasStyleRegex);
    if (adidasStandMatch && !['US', 'UK', 'FR', 'JP', 'CHN', 'MM', 'CM'].includes(adidasStandMatch[1])) {
      detectedModel = adidasStandMatch[1];
      if (!detectedBrand) detectedBrand = 'Adidas';
    }
  }

  // New Balance Style Code (e.g. M990GL5, BB550WT1, ML2002RA, U9060ECA)
  if (!detectedModel) {
    const nbRegex = /\b([A-Z]{1,3}\d{3,4}[A-Z0-9]{1,4})\b/;
    const nbMatch = normalized.match(nbRegex);
    if (nbMatch) {
      detectedModel = nbMatch[1];
      if (!detectedBrand) detectedBrand = 'New Balance';
    }
  }

  // Puma Style Code (e.g. 374915-01, 380190-02)
  if (!detectedModel) {
    const pumaRegex = /\b(\d{6})[\s\-](\d{2})\b/;
    const pumaMatch = normalized.match(pumaRegex);
    if (pumaMatch) {
      detectedModel = `${pumaMatch[1]}-${pumaMatch[2]}`;
      if (!detectedBrand) detectedBrand = 'Puma';
    }
  }

  // Converse Style Code (e.g. 162050C, 150143C, M9160C)
  if (!detectedModel) {
    const converseRegex = /\b(\d{6}C|[A-Z]\d{4,5}C)\b/i;
    const convMatch = normalized.match(converseRegex);
    if (convMatch) {
      detectedModel = convMatch[1].toUpperCase();
      if (!detectedBrand) detectedBrand = 'Converse';
    }
  }

  // Vans Style Code (e.g. VN0A38G1P0S, VN000D3HY28)
  if (!detectedModel) {
    const vansRegex = /\b(VN[A-Z0-9]{8,11})\b/i;
    const vansMatch = normalized.match(vansRegex);
    if (vansMatch) {
      detectedModel = vansMatch[1].toUpperCase();
      if (!detectedBrand) detectedBrand = 'Vans';
    }
  }

  // Red Wing Heritage 4-digit model code (e.g. 8111, 875, 1907, 3343)
  if (!detectedModel && detectedBrand === 'Red Wing') {
    const redWingRegex = /\b(\d{4})\b/;
    const rwMatch = normalized.match(redWingRegex);
    if (rwMatch) {
      detectedModel = rwMatch[1];
    }
  }

  // Generic fallback: Look for keywords like "STYLE", "SKU", "MODEL", "ITEM#" followed by alphanumeric code
  if (!detectedModel) {
    const genericStyleRegex = /\b(?:STYLE|SKU|MODEL|ITEM|CODE)[\s#:]*([A-Z0-9\-]{4,12})\b/i;
    const genericMatch = normalized.match(genericStyleRegex);
    if (genericMatch && !['NUMBER', 'NAME', 'DATE', 'INFO'].includes(genericMatch[1].toUpperCase())) {
      detectedModel = genericMatch[1].toUpperCase();
    }
  }

  // -------------------------------------------------------------
  // 3. EXTRACT SHOE SIZE MATRIX (US, UK, EUR, CM)
  // -------------------------------------------------------------
  const sizeDetails: ParsedTongueTag['sizeDetails'] = { primary: null };

  // Variation A: Horizontal or adjacent size pairs (e.g. "US 9.5  UK 8.5  EUR 43  CM 27.5")
  const usMatch = normalized.match(/\bUS[\s:]*([0-9]+(?:\.[0-9]+)?(?:[A-Z])?)\b/i);
  const ukMatch = normalized.match(/\bUK[\s:]*([0-9]+(?:\.[0-9]+)?)\b/i);
  const eurMatch = normalized.match(/\b(?:EUR|FR|EU)[\s:]*([0-9]+(?:\.[0-9]+)?)\b/i);
  const cmMatch = normalized.match(/\b(?:CM|JP|JPN|CHN)[\s:]*([0-9]+(?:\.[0-9]+)?)\b/i);

  if (usMatch) sizeDetails.us = usMatch[1];
  if (ukMatch) sizeDetails.uk = ukMatch[1];
  if (eurMatch) sizeDetails.eur = eurMatch[1];
  if (cmMatch) sizeDetails.cm = cmMatch[1];

  // Variation B: Vertical stacked table layout (Common in Nike & Adidas: headers line followed by values line)
  // e.g.:
  // US   UK   EUR   CM
  // 9.5  8.5  43    27.5
  if (!sizeDetails.us && !sizeDetails.uk && !sizeDetails.eur) {
    const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length - 1; i++) {
      const headerLine = lines[i].toUpperCase();
      const valueLine = lines[i + 1];

      if (headerLine.includes('US') && (headerLine.includes('UK') || headerLine.includes('EUR') || headerLine.includes('FR'))) {
        const headerTokens = headerLine.split(/\s+/);
        const valueTokens = valueLine.split(/\s+/);

        if (valueTokens.length >= headerTokens.length && valueTokens.every((v) => /^[\d.]+[A-Z]?$/.test(v))) {
          headerTokens.forEach((token, idx) => {
            const val = valueTokens[idx];
            if (token === 'US') sizeDetails.us = val;
            else if (token === 'UK') sizeDetails.uk = val;
            else if (token === 'EUR' || token === 'FR' || token === 'EU') sizeDetails.eur = val;
            else if (token === 'CM' || token === 'JP' || token === 'CHN') sizeDetails.cm = val;
          });
          break;
        }
      }
    }
  }

  // Construct readable primary size string
  const primaryParts: string[] = [];
  if (sizeDetails.uk) primaryParts.push(`UK ${sizeDetails.uk}`);
  if (sizeDetails.us) primaryParts.push(`US ${sizeDetails.us}`);
  if (sizeDetails.eur) primaryParts.push(`EUR ${sizeDetails.eur}`);
  if (sizeDetails.cm) primaryParts.push(`${sizeDetails.cm} cm`);

  sizeDetails.primary = primaryParts.length > 0 ? primaryParts.join(' / ') : null;

  // -------------------------------------------------------------
  // 4. CONFIDENCE SCORING
  // -------------------------------------------------------------
  let score = 0;
  if (detectedBrand) score += 0.35;
  if (detectedModel) score += 0.45;
  if (sizeDetails.primary) score += 0.20;

  const brandDetected = Boolean(detectedBrand);
  const modelDetected = Boolean(detectedModel);
  const sizeDetected = Boolean(sizeDetails.primary);

  return {
    brand: detectedBrand,
    modelNumber: detectedModel,
    sizeDetails,
    confidence: parseFloat(score.toFixed(2)),
    brandDetected,
    modelDetected,
    sizeDetected,
    cleanedText: normalized,
  };
}
