import { describe, expect, it } from 'vitest';
import { isCurrentPricelist, purchaseCost } from '#lib/fees';

const base = { pct_public_debt_secondary: 0.3, min_kz: 0 };

describe('purchaseCost', () => {
	it('soma comissão, BODIVA, CEVAMA e IVA de 14%', () => {
		const c = purchaseCost({ ...base, extra_fees: 'bodiva+cevama' }, 5_000_000);
		expect(c.commission).toBeCloseTo(15_000);
		expect(c.bodiva).toBeCloseTo(2_625);
		expect(c.cevama).toBeCloseTo(1_300);
		expect(c.iva).toBeCloseTo(2_649.5);
		expect(c.total).toBeCloseTo(21_574.5);
	});

	it('não cobra BODIVA nem CEVAMA quando o preçário as inclui', () => {
		const c = purchaseCost(
			{ pct_public_debt_secondary: 0.3335, min_kz: 3000, extra_fees: 'included' },
			5_000_000
		);
		expect(c.bodiva).toBe(0);
		expect(c.cevama).toBe(0);
		expect(c.total).toBeCloseTo(19_009.5);
	});

	it('cobra só a BODIVA quando o preçário é "bodiva"', () => {
		const c = purchaseCost(
			{ pct_public_debt_secondary: 0.8, min_kz: 10_000, extra_fees: 'bodiva' },
			5_000_000
		);
		expect(c.cevama).toBe(0);
		expect(c.total).toBeCloseTo(48_592.5);
	});

	it('aplica o mínimo da corretora só à comissão e o mínimo de 1 750 Kz à BODIVA', () => {
		const c = purchaseCost(
			{ pct_public_debt_secondary: 0.35, min_kz: 3500, extra_fees: 'bodiva+cevama' },
			100_000
		);
		expect(c.commission).toBe(3_500);
		expect(c.bodiva).toBe(1_750);
		expect(c.cevama).toBeCloseTo(26);
		expect(c.total).toBeCloseTo(6_014.64);
	});

	it('conta BODIVA e CEVAMA quando o preçário não diz se estão incluídas', () => {
		const unclear = purchaseCost({ ...base, extra_fees: 'unclear' }, 5_000_000);
		const both = purchaseCost({ ...base, extra_fees: 'bodiva+cevama' }, 5_000_000);
		expect(unclear.total).toBe(both.total);
	});

	it('devolve zero para valores que não são positivos', () => {
		for (const amount of [0, -1, NaN]) {
			expect(purchaseCost({ ...base, min_kz: 5000, extra_fees: 'bodiva+cevama' }, amount).total).toBe(0);
		}
	});
});

describe('isCurrentPricelist', () => {
	it('aceita preçários recentes, com data e sem dúvidas', () => {
		expect(isCurrentPricelist({ stale: false, uncertain: false, pricelist_date: '2026-09-01' })).toBe(true);
	});

	it.each([
		{ stale: true, uncertain: false, pricelist_date: '2024-05-21' },
		{ stale: false, uncertain: true, pricelist_date: '2026-03-30' },
		{ stale: false, uncertain: false, pricelist_date: null }
	])('recusa %o', (p) => {
		expect(isCurrentPricelist(p)).toBe(false);
	});
});
