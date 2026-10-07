import { describe, expect, it } from 'vitest';
import { brokerSlug } from '#lib/brokers';
import { loadPricelists } from '#lib/server/data';
import { parseSimulatorQuery, simulateBill, toSimulatorSearch } from '#lib/simulator';

describe('simulateBill', () => {
	it('calcula juros brutos, IAC de 10%, custo e retorno líquido anualizado', () => {
		const s = simulateBill({ amount: 5_000_000, ratePct: 16, days: 364, purchaseCost: 19_009.5 });
		expect(s.gross).toBeCloseTo(797_808.22, 2);
		expect(s.iac).toBeCloseTo(79_780.82, 2);
		expect(s.net).toBeCloseTo(699_017.9, 1);
		expect(s.netAnnualPct).toBeCloseTo(14.0188, 3);
	});

	it('sem custo de compra, o retorno anualizado é a taxa menos 10% de IAC', () => {
		const s = simulateBill({ amount: 1_000_000, ratePct: 9.48, days: 182, purchaseCost: 0 });
		expect(s.gross).toBeCloseTo(47_270.14, 2);
		expect(s.netAnnualPct).toBeCloseTo(8.532, 3);
	});

	it('dá ganho negativo quando o custo come os juros', () => {
		const s = simulateBill({ amount: 50_000, ratePct: 9.48, days: 91, purchaseCost: 6_000 });
		expect(s.net).toBeLessThan(0);
	});

	it('devolve retorno anualizado nulo sem valor ou sem prazo', () => {
		expect(simulateBill({ amount: 0, ratePct: 16, days: 364, purchaseCost: 0 }).netAnnualPct).toBeNull();
		expect(simulateBill({ amount: 1000, ratePct: 16, days: 0, purchaseCost: 0 }).netAnnualPct).toBeNull();
	});
});

describe('parseSimulatorQuery', () => {
	const allowed = { prazos: [91, 182, 364], corretoras: ['aurea', 'bic-corretora'] };
	const defaults = { valor: 5_000_000, prazo: 364, corretora: 'aurea' };

	it('lê os três parâmetros', () => {
		expect(parseSimulatorQuery('?valor=250000&prazo=91&corretora=bic-corretora', allowed, defaults)).toEqual({
			valor: 250_000,
			prazo: 91,
			corretora: 'bic-corretora'
		});
	});

	it('usa os valores por omissão para parâmetros em falta ou inválidos', () => {
		for (const search of ['', '?valor=abc&prazo=7&corretora=nao-existe', '?valor=-5', '?valor=0', '?valor=1e99']) {
			expect(parseSimulatorQuery(search, allowed, defaults)).toEqual(defaults);
		}
	});

	it('aceita um parâmetro válido ao lado de um inválido', () => {
		expect(parseSimulatorQuery('?prazo=182&valor=x', allowed, defaults)).toEqual({ ...defaults, prazo: 182 });
	});

	it('faz o caminho de ida e volta com toSimulatorSearch', () => {
		const q = { valor: 123_456, prazo: 182, corretora: 'bic-corretora' };
		expect(parseSimulatorQuery(toSimulatorSearch(q), allowed, defaults)).toEqual(q);
	});
});

describe('brokerSlug', () => {
	it('tira acentos e troca espaços por hífens', () => {
		expect(brokerSlug('Áurea')).toBe('aurea');
		expect(brokerSlug('Millennium Atlântico')).toBe('millennium-atlantico');
		expect(brokerSlug('BFA Capital Markets')).toBe('bfa-capital-markets');
	});

	it('dá um slug diferente a cada corretora dos dados reais', () => {
		const slugs = loadPricelists().map((p) => brokerSlug(p.broker));
		expect(new Set(slugs).size).toBe(slugs.length);
	});
});
