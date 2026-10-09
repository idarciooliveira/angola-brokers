import { describe, expect, it } from 'vitest';
import { BROKER_MEMBER } from '#lib/brokers';
import { bondName, maturityYear, monthsBetween } from '#lib/instruments';
import { loadDaily, loadMembers, loadPricelists, loadTreasuryBonds } from '#lib/server/data';

describe('maturityYear', () => {
	it('lê o ano do código da Obrigação do Tesouro', () => {
		expect(maturityYear('OJ10M28A')).toBe(2028);
		expect(maturityYear('OH19N27A')).toBe(2027);
		expect(maturityYear('OK15A33A')).toBe(2033);
	});

	it('devolve null para códigos fora do padrão', () => {
		expect(maturityYear('BT364')).toBeNull();
		expect(maturityYear('SNLEDOFB')).toBeNull();
	});

	it('lê um ano de todas as OT dos dados reais', () => {
		const ots = loadDaily().flatMap((d) => d.rows).filter((r) => r.kind === 'ot');
		expect(ots.length).toBeGreaterThan(0);
		for (const r of ots) expect(maturityYear(r.code), r.code).not.toBeNull();
	});
});

describe('monthsBetween', () => {
	it('conta meses completos', () => {
		expect(monthsBetween('2026-10-08', '2031-08-15')).toBe(58);
		expect(monthsBetween('2026-10-08', '2028-03-10')).toBe(17);
	});

	it('não conta o mês em curso até ao dia do vencimento', () => {
		expect(monthsBetween('2026-10-08', '2026-11-07')).toBe(0);
		expect(monthsBetween('2026-10-08', '2026-11-08')).toBe(1);
	});

	it('dá negativo para datas passadas', () => {
		expect(monthsBetween('2026-10-08', '2026-09-01')).toBeLessThan(0);
	});
});

describe('bondName', () => {
	it('junta o cupão e o ano de vencimento', () => {
		expect(bondName(17.25, '2031-08-15')).toBe('Obrigação do Tesouro 17,25% 2031');
	});
});

describe('dados das Obrigações do Tesouro', () => {
	const bonds = loadTreasuryBonds();

	it('cobrem todas as OT dos preços diários', () => {
		const ots = loadDaily().flatMap((d) => d.rows).filter((r) => r.kind === 'ot');
		for (const r of ots) expect(bonds.has(r.code), r.code).toBe(true);
	});

	it('têm no código o dia e o ano do vencimento', () => {
		for (const b of bonds.values()) {
			expect(b.code.slice(2, 4), b.code).toBe(b.maturity.slice(8, 10));
			expect(b.code.slice(5, 7), b.code).toBe(b.maturity.slice(2, 4));
			expect(maturityYear(b.code), b.code).toBe(Number(b.maturity.slice(0, 4)));
		}
	});

	it('vencem depois de emitidas e têm cupão positivo', () => {
		for (const b of bonds.values()) {
			expect(b.maturity > b.issued, b.code).toBe(true);
			expect(b.coupon_pct, b.code).toBeGreaterThan(0);
		}
	});
});

describe('BROKER_MEMBER', () => {
	it('liga todas as corretoras dos preçários a um membro de 2026', () => {
		const members = new Set(loadMembers('2026').map((m) => m.member));
		for (const p of loadPricelists()) {
			const code = BROKER_MEMBER[p.broker];
			expect(code, `${p.broker} sem membro`).toBeDefined();
			expect(members.has(code), `${p.broker} -> ${code}`).toBe(true);
		}
	});
});
