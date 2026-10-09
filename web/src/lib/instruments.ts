import { formatPct } from '#lib/format';

export const STOCK_NAMES: Record<string, string> = {
	BAI: 'Banco Angolano de Investimentos',
	BFA: 'Banco de Fomento Angola',
	BDV: 'BODIVA',
	SBA: 'Standard Bank Angola',
	UNTL: 'Unitel',
	ENSA: 'ENSA Seguros',
	BCG: 'Banco Caixa Geral Angola'
};

export function stockName(code: string): string {
	return Object.hasOwn(STOCK_NAMES, code) ? STOCK_NAMES[code] : code;
}

/** Nome legível de uma Obrigação do Tesouro. `Obrigação do Tesouro 17,25% 2031` (cupão anual e ano de vencimento). */
export function bondName(couponPct: number, maturity: string): string {
	return `Obrigação do Tesouro ${formatPct(couponPct)} ${maturity.slice(0, 4)}`;
}

/** Meses completos de `from` a `to`, ambas AAAA-MM-DD. Negativo se `to` for anterior. Sem passar por Date. */
export function monthsBetween(from: string, to: string): number {
	const [y1, m1, d1] = from.split('-').map(Number);
	const [y2, m2, d2] = to.split('-').map(Number);
	return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/** Ano de vencimento de uma Obrigação do Tesouro, lido do código (OJ10M28A vence em 2028). */
export function maturityYear(code: string): number | null {
	const m = /^O[A-Z]\d{2}[A-Z](\d{2})[A-Z]$/.exec(code);
	return m ? 2000 + Number(m[1]) : null;
}
