/**
 * Formatação pt-AO para o painel. Todas as funções devolvem '—' para
 * null, undefined e valores não finitos.
 *
 * O Intl em pt-AO separa milhares com U+00A0 (espaço inseparável) e usa
 * hífen-menos para negativos. Mantemos o U+00A0 que o Intl emite e
 * normalizamos o sinal negativo para U+2212 em todas as funções.
 */

const LOCALE = 'pt-AO';
const NBSP = ' ';
const MINUS = '−';
const EMPTY = '—';

type Maybe = number | null | undefined;

const numberFormats = new Map<number, Intl.NumberFormat>();
const compactFormats = new Map<number, Intl.NumberFormat>();

function isFiniteNumber(n: Maybe): n is number {
	return typeof n === 'number' && Number.isFinite(n);
}

function getNumberFormat(digits: number): Intl.NumberFormat {
	let nf = numberFormats.get(digits);
	if (!nf) {
		nf = new Intl.NumberFormat(LOCALE, {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
		numberFormats.set(digits, nf);
	}
	return nf;
}

function getCompactFormat(digits: number): Intl.NumberFormat {
	let nf = compactFormats.get(digits);
	if (!nf) {
		nf = new Intl.NumberFormat(LOCALE, {
			notation: 'compact',
			maximumFractionDigits: digits
		});
		compactFormats.set(digits, nf);
	}
	return nf;
}

/** Troca o hífen-menos do Intl pelo U+2212 e remove o sinal de zeros arredondados. */
function toDisplay(s: string): string {
	const withMinus = s.replace('-', MINUS);
	if (withMinus.startsWith(MINUS) && !/[1-9]/.test(withMinus)) {
		return withMinus.slice(1);
	}
	return withMinus;
}

/** Número com separador de milhares e vírgula decimal. `12 345,67`. */
export function formatNumber(n: Maybe, digits = 0): string {
	if (!isFiniteNumber(n)) return EMPTY;
	return toDisplay(getNumberFormat(digits).format(n === 0 ? 0 : n));
}

/** Kwanzas sem casas decimais. `Kz 5 000 000`. */
export function formatKz(n: Maybe): string {
	if (!isFiniteNumber(n)) return EMPTY;
	return `Kz${NBSP}${formatNumber(n, 0)}`;
}

/** Percentagem; `n` já vem em pontos percentuais (17.5 → `17,50%`). */
export function formatPct(n: Maybe, digits = 2): string {
	if (!isFiniteNumber(n)) return EMPTY;
	return `${formatNumber(n, digits)}%`;
}

/** Percentagem com sinal explícito. `+1,01%`, `−3,61%`, zero sem sinal. */
export function formatSignedPct(n: Maybe, digits = 2): string {
	if (!isFiniteNumber(n)) return EMPTY;
	const body = formatNumber(Math.abs(n), digits);
	if (!/[1-9]/.test(body)) return `${body}%`;
	return `${n < 0 ? MINUS : '+'}${body}%`;
}

/** Data 'AAAA-MM-DD' para 'DD/MM/AAAA', sem passar por Date (sem fuso horário). */
export function formatDate(iso: string | null | undefined): string {
	if (typeof iso !== 'string') return EMPTY;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return EMPTY;
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return EMPTY;
	return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Prazo em meses como texto. `5 anos e 10 meses`, `1 ano`, `8 meses`, `menos de 1 mês`. */
export function formatTerm(months: Maybe): string {
	if (!isFiniteNumber(months) || months < 0) return EMPTY;
	const years = Math.floor(months / 12);
	const rest = months % 12;
	const y = `${years} ${years === 1 ? 'ano' : 'anos'}`;
	const m = `${rest} ${rest === 1 ? 'mês' : 'meses'}`;
	if (years === 0) return rest === 0 ? 'menos de 1 mês' : m;
	return rest === 0 ? y : `${y} e ${m}`;
}

/** Notação compacta do Intl pt-AO: `2,5 mM` (mil milhões), `5 M`, `12 mil`. */
export function formatCompact(n: Maybe, digits = 2): string {
	if (!isFiniteNumber(n)) return EMPTY;
	return toDisplay(getCompactFormat(digits).format(n === 0 ? 0 : n));
}
