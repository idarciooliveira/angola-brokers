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

/** Ano de vencimento de uma Obrigação do Tesouro, lido do código (OJ10M28A vence em 2028). */
export function maturityYear(code: string): number | null {
	const m = /^O[A-Z]\d{2}[A-Z](\d{2})[A-Z]$/.exec(code);
	return m ? 2000 + Number(m[1]) : null;
}
