import { describe, expect, it } from 'vitest';
import { BROKER_MEMBER } from '#lib/brokers';
import { maturityYear } from '#lib/instruments';
import { loadDaily, loadMembers, loadPricelists } from '#lib/server/data';

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
