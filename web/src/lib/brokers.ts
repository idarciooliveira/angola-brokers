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

/** Nome da corretora em forma de URL: "Millennium Atlântico" vira "millennium-atlantico". */
export function brokerSlug(name: string): string {
	return name
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}
