import { describe, expect, it } from 'vitest';
import { latestOfKind } from '#lib/daily';
import type { DailyPrice } from '#lib/types';

const row = (date: string, kind: DailyPrice['kind'], code: string, price: number): DailyPrice => ({
	date,
	kind,
	code,
	price,
	change_pct: null,
	source: 'teste'
});

describe('latestOfKind', () => {
	const days = [
		{
			date: '2026-10-05',
			rows: [row('2026-10-05', 'bt', 'BT364', 16), row('2026-10-05', 'stock', 'BAI', 90000)]
		},
		{ date: '2026-10-08', rows: [row('2026-10-08', 'stock', 'BAI', 95000)] }
	];

	it('volta ao último dia com Bilhetes quando o mais recente não os tem', () => {
		expect(latestOfKind(days, 'bt')).toEqual({
			date: '2026-10-05',
			rows: [days[0].rows[0]]
		});
	});

	it('usa o dia mais recente quando tem linhas do tipo', () => {
		expect(latestOfKind(days, 'stock')?.date).toBe('2026-10-08');
	});

	it('devolve null quando nenhum dia tem o tipo', () => {
		expect(latestOfKind(days, 'ot')).toBeNull();
	});
});
