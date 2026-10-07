export const IAC_RATE = 0.1;

export interface SimulationInput {
	amount: number;
	/** Taxa anual do Bilhete, em %. */
	ratePct: number;
	days: number;
	/** Custo de comprar, em kwanzas, com IVA (ver `purchaseCost` em fees.ts). */
	purchaseCost: number;
}

export interface Simulation {
	gross: number;
	iac: number;
	purchaseCost: number;
	net: number;
	/** Retorno líquido anualizado, em %. `null` sem valor ou sem prazo. */
	netAnnualPct: number | null;
}

/** Bilhete do Tesouro mantido até ao vencimento: juros simples sobre 365 dias, menos IAC e custo de compra. */
export function simulateBill({ amount, ratePct, days, purchaseCost }: SimulationInput): Simulation {
	const gross = (amount * ratePct * days) / 100 / 365;
	const iac = gross * IAC_RATE;
	const net = gross - iac - purchaseCost;
	const netAnnualPct = amount > 0 && days > 0 ? ((net / amount) * 100 * 365) / days : null;
	return { gross, iac, purchaseCost, net, netAnnualPct };
}

export interface SimulatorQuery {
	valor: number;
	prazo: number;
	corretora: string;
}

const MAX_VALOR = 1e12;

/**
 * Lê `?valor=5000000&prazo=364&corretora=aurea`. Um parâmetro em falta ou inválido
 * (valor não positivo, prazo ou corretora que não existem) fica com o valor por omissão.
 */
export function parseSimulatorQuery(
	search: string,
	allowed: { prazos: readonly number[]; corretoras: readonly string[] },
	defaults: SimulatorQuery
): SimulatorQuery {
	const params = new URLSearchParams(search);

	const valor = Number(params.get('valor'));
	const prazo = Number(params.get('prazo'));
	const corretora = params.get('corretora') ?? '';

	return {
		valor: Number.isFinite(valor) && valor > 0 && valor <= MAX_VALOR ? valor : defaults.valor,
		prazo: allowed.prazos.includes(prazo) ? prazo : defaults.prazo,
		corretora: allowed.corretoras.includes(corretora) ? corretora : defaults.corretora
	};
}

export function toSimulatorSearch(q: SimulatorQuery): string {
	const params = new URLSearchParams({
		valor: String(Math.round(q.valor)),
		prazo: String(q.prazo),
		corretora: q.corretora
	});
	return `?${params}`;
}
