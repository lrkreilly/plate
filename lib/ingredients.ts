// Best-effort ingredient scaling (decided approach): scale the first numeric
// quantity in a free-text line, leave vague amounts ("handful", "drizzle")
// untouched. Imperfect by design — no structured {qty,unit,item} model.

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const FRAC_CHARS = Object.keys(FRACTIONS).join("");

// integer+fraction ("1 ½") | fraction | decimal | integer
const NUM = `(?:\\d+\\s*[${FRAC_CHARS}]|[${FRAC_CHARS}]|\\d+\\.\\d+|\\d+)`;
const RANGE = new RegExp(`(${NUM})\\s*[-–—]\\s*(${NUM})`);
const SINGLE = new RegExp(NUM);

function tokenToNumber(token: string): number {
  const t = token.trim();
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t];

  const mixed = t.match(new RegExp(`^(\\d+)\\s*([${FRAC_CHARS}])$`));
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];

  return Number(t);
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded + 1e-9);
  const frac = rounded - whole;

  const FRAC_OUT: [number, string][] = [
    [0.5, "½"],
    [0.25, "¼"],
    [0.75, "¾"],
    [1 / 3, "⅓"],
    [2 / 3, "⅔"],
  ];
  const near = FRAC_OUT.find(([v]) => Math.abs(frac - v) < 0.04);

  if (Math.abs(frac) < 0.04) return String(whole);
  if (near) return whole > 0 ? `${whole} ${near[1]}` : near[1];
  return String(rounded);
}

export function scaleIngredient(text: string, factor: number): string {
  if (!Number.isFinite(factor) || factor === 1) return text;

  const range = text.match(RANGE);
  if (range) {
    const lo = formatNumber(tokenToNumber(range[1]) * factor);
    const hi = formatNumber(tokenToNumber(range[2]) * factor);
    return text.replace(range[0], `${lo}-${hi}`);
  }

  const single = text.match(SINGLE);
  if (single) {
    const scaled = formatNumber(tokenToNumber(single[0]) * factor);
    return text.replace(single[0], scaled);
  }

  return text;
}

export function servingsFactor(servings: number, defaultServings: number) {
  if (!defaultServings || defaultServings <= 0) return 1;
  return servings / defaultServings;
}
