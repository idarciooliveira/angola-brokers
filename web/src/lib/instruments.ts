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
