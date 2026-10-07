/** Corretora do preçário (`brokers/pricelists.jsonl`) para o código do membro em `market/members-*.jsonl`. */
export const BROKER_MEMBER: Record<string, string> = {
	Áurea: 'AUREA',
	'BFA Capital Markets': 'BFACM',
	'BIC Corretora': 'BICSCVM',
	'Kitadi Capital Partners': 'KITADI',
	'Inovadora Capital': 'INCD',
	'Standard Invest': 'SINV',
	'Hemera Capital Partners': 'HCPS',
	'Banco BIC': 'BIC',
	'Millennium Atlântico': 'BMA',
	Fincrest: 'FINCREST',
	Eaglestone: 'EAGLESTONE',
	Kyros: 'KYROS',
	'Madz Global': 'MADZ',
	'Distribuidora Valor': 'VALOR',
	'Lucrum Trust': 'LUCRUM',
	'Prime Solutions': 'PRIME',
	'Lwei Brokers': 'LMB',
	'Prospectum Capital': 'PCAP'
};

/** Símbolo de cada membro, em `web/static/logos/`. Membros sem entrada mostram as iniciais. */
const MEMBER_LOGO: Record<string, string> = {
	AUREA: 'aurea.webp',
	BFACM: 'bfa-capital-markets.webp',
	BICSCVM: 'banco-bic.webp',
	BIC: 'banco-bic.webp',
	BMA: 'millennium-atlantico.webp',
	KITADI: 'kitadi.webp',
	INCD: 'inovadora-capital.webp',
	SINV: 'standard-invest.webp',
	FINCREST: 'fincrest.webp',
	EAGLESTONE: 'eaglestone.webp',
	KYROS: 'kyros.webp',
	MADZ: 'madz-global.webp',
	VALOR: 'distribuidora-valor.webp',
	PRIME: 'prime-solutions.webp',
	PCAP: 'prospectum-capital.webp',
	SBA: 'standard-bank.webp',
	BPC: 'bpc.webp',
	BNA: 'bna.webp'
};

/** Caminho do logótipo para um código de membro, ou `undefined` se não houver. */
export function logoPath(member: string | null | undefined): string | undefined {
	const file = member ? MEMBER_LOGO[member] : undefined;
	return file ? `/logos/${file}` : undefined;
}

/** Nome da corretora em forma de URL: "Millennium Atlântico" vira "millennium-atlantico". */
export function brokerSlug(name: string): string {
	return name
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Nome curto para gráficos e resumos: "BFA Capital Markets" vira "BFA CM". */
export function shortBrokerName(name: string): string {
	return name
		.replace(' Capital Partners', '')
		.replace(' Capital Markets', ' CM')
		.replace('Distribuidora ', '');
}
