import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	loadDaily,
	loadLatestDaily,
	loadMembers,
	loadPricelists,
	loadTotals
} from '../src/lib/server/data';

const REAL_DATA = fileURLToPath(new URL('../../data', import.meta.url));
const originalDataDir = process.env.DATA_DIR;

let dir: string;

function write(rel: string, content: string): void {
	const file = path.join(dir, rel);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

function jsonl(rows: object[]): string {
	return rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
}

const stock = (date: string, code: string, price: number) => ({
	date,
	kind: 'stock',
	code,
	price,
	change_pct: 0,
	source: 'test'
});

const pricelist = (broker: string, checked_on: string) => ({
	broker,
	checked_on,
	pct_public_debt_secondary: 0.3,
	min_kz: 0,
	extra_fees: 'included',
	dividend_fee: null,
	maintenance: null,
	pricelist_date: null,
	pricelist_date_raw: '',
	stale: false,
	uncertain: false,
	source_url: 'https://example.test/precario.pdf',
	note: null
});

beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bodiva-data-test-'));
	process.env.DATA_DIR = dir;
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
	if (originalDataDir === undefined) delete process.env.DATA_DIR;
	else process.env.DATA_DIR = originalDataDir;
});

describe('loadDaily e loadLatestDaily', () => {
	it('agrupa por data em ordem ascendente, independentemente do nome do ficheiro', () => {
		write('daily/2026-10-06.jsonl', jsonl([stock('2026-10-06', 'BAI', 95000)]));
		write(
			'daily/2026-10-05.jsonl',
			jsonl([stock('2026-10-05', 'BAI', 94000), stock('2026-10-05', 'BFA', 95500)])
		);

		const days = loadDaily();

		expect(days.map((day) => day.date)).toEqual(['2026-10-05', '2026-10-06']);
		expect(days[0].rows).toHaveLength(2);
		expect(days[1].rows).toHaveLength(1);
	});

	it('loadLatestDaily devolve o dia mais recente', () => {
		write('daily/2026-10-05.jsonl', jsonl([stock('2026-10-05', 'BAI', 94000)]));
		write('daily/2026-10-06.jsonl', jsonl([stock('2026-10-06', 'BAI', 95000)]));

		const latest = loadLatestDaily();

		expect(latest.date).toBe('2026-10-06');
		expect(latest.rows[0].price).toBe(95000);
	});

	it('lança erro se daily/ não tiver ficheiros', () => {
		fs.mkdirSync(path.join(dir, 'daily'));

		expect(() => loadDaily()).toThrow(/Sem ficheiros de preços diários/);
	});

	it('indica ficheiro e linha quando o JSON está partido', () => {
		write(
			'daily/2026-10-05.jsonl',
			jsonl([stock('2026-10-05', 'BAI', 94000)]) + '{"date": "2026-10-05", "kind": \n'
		);

		expect(() => loadDaily()).toThrow(/2026-10-05\.jsonl:2: JSON inválido/);
	});

	it('indica ficheiro, linha e campo quando um campo obrigatório falta', () => {
		const { source: _source, ...withoutSource } = stock('2026-10-05', 'BAI', 94000);
		write('daily/2026-10-05.jsonl', jsonl([withoutSource]));

		expect(() => loadDaily()).toThrow(
			/2026-10-05\.jsonl:1: campo obrigatório em falta: source/
		);
	});
});

describe('loadMembers', () => {
	it('lê as linhas do ano pedido', () => {
		write(
			'market/members-2026.jsonl',
			jsonl([
				{
					as_of: '2026-10-05',
					period: '2026',
					member: 'AUREA',
					name: 'Áurea',
					accounts: 15357,
					accounts_share_pct: 25.16,
					custody_mm_kz: 5902.46,
					volume_mm_kz: 4313.64,
					source: 'test'
				}
			])
		);

		const rows = loadMembers('2026');

		expect(rows).toHaveLength(1);
		expect(rows[0].member).toBe('AUREA');
		expect(rows[0].volume_mm_kz).toBe(4313.64);
	});

	it('lança erro quando falta o membro', () => {
		write(
			'market/members-2026.jsonl',
			jsonl([{ as_of: '2026-10-05', period: '2026', name: 'X', source: 'test' }])
		);

		expect(() => loadMembers('2026')).toThrow(/members-2026\.jsonl:1: campo obrigatório em falta: member/);
	});
});

describe('loadTotals', () => {
	it('ordena por período', () => {
		write(
			'market/totals.jsonl',
			jsonl([
				{ period: '2025', total_kz_bi: 5.73, source: 'test' },
				{ period: '2023', total_kz_bi: 7.67, source: 'test' }
			])
		);

		expect(loadTotals().map((total) => total.period)).toEqual(['2023', '2025']);
	});
});

describe('loadPricelists', () => {
	it('devolve só a linha com checked_on mais recente de cada corretora', () => {
		write(
			'brokers/pricelists.jsonl',
			jsonl([
				pricelist('BIC Corretora', '2026-01-10'),
				pricelist('Áurea', '2026-10-07'),
				pricelist('BIC Corretora', '2026-10-07')
			])
		);

		const lists = loadPricelists();

		expect(lists).toHaveLength(2);
		expect(lists.find((list) => list.broker === 'BIC Corretora')?.checked_on).toBe('2026-10-07');
	});

	it('lança erro quando falta checked_on', () => {
		const { checked_on: _checkedOn, ...withoutDate } = pricelist('Áurea', '2026-10-07');
		write('brokers/pricelists.jsonl', jsonl([withoutDate]));

		expect(() => loadPricelists()).toThrow(
			/pricelists\.jsonl:1: campo obrigatório em falta: checked_on/
		);
	});
});

describe('dados reais em ../data', () => {
	it('tem pelo menos 1 dia de preços e 18 corretoras', () => {
		process.env.DATA_DIR = REAL_DATA;

		expect(loadDaily().length).toBeGreaterThanOrEqual(1);
		expect(loadPricelists().length).toBeGreaterThanOrEqual(18);
	});
});
