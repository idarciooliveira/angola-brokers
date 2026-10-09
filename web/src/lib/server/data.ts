import fs from 'node:fs';
import path from 'node:path';
import type { DailyPrice, MemberRow, Pricelist, TreasuryBond, YearTotal } from '#lib/types';

function dataDir(): string {
	return process.env.DATA_DIR ?? path.resolve(process.cwd(), '..', 'data');
}

function jsonlFiles(sub: string): string[] {
	const dir = path.join(dataDir(), sub);
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith('.jsonl'))
		.sort()
		.map((name) => path.join(dir, name));
}

function readJsonl<T>(file: string, required: readonly string[]): T[] {
	const rows: T[] = [];
	for (const [index, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
		if (line.trim() === '') continue;
		const where = `${file}:${index + 1}`;

		let parsed: unknown;
		try {
			parsed = JSON.parse(line);
		} catch (error) {
			throw new Error(`${where}: JSON inválido (${error instanceof Error ? error.message : error})`);
		}
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error(`${where}: esperado um objecto JSON`);
		}

		const row = parsed as Record<string, unknown>;
		for (const field of required) {
			if (row[field] === undefined || row[field] === null) {
				throw new Error(`${where}: campo obrigatório em falta: ${field}`);
			}
		}
		rows.push(row as T);
	}
	return rows;
}

export function loadDaily(): { date: string; rows: DailyPrice[] }[] {
	const files = jsonlFiles('daily');
	if (files.length === 0) {
		throw new Error(`Sem ficheiros de preços diários em ${path.join(dataDir(), 'daily')}`);
	}

	const byDate = new Map<string, DailyPrice[]>();
	for (const file of files) {
		for (const row of readJsonl<DailyPrice>(file, ['date', 'kind', 'code', 'price', 'source'])) {
			const rows = byDate.get(row.date);
			if (rows) rows.push(row);
			else byDate.set(row.date, [row]);
		}
	}

	return [...byDate]
		.map(([date, rows]) => ({ date, rows }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

export function loadLatestDaily(): { date: string; rows: DailyPrice[] } {
	const days = loadDaily();
	if (days.length === 0) throw new Error('Nenhum preço diário com linhas');
	return days[days.length - 1];
}

/** Obrigações do Tesouro por código. */
export function loadTreasuryBonds(): Map<string, TreasuryBond> {
	const file = path.join(dataDir(), 'instruments', 'ot.jsonl');
	const rows = readJsonl<TreasuryBond>(file, ['code', 'maturity', 'coupon_pct', 'source']);
	return new Map(rows.map((row) => [row.code, row]));
}

export function loadMembers(period: string): MemberRow[] {
	const file = path.join(dataDir(), 'market', `members-${period}.jsonl`);
	return readJsonl<MemberRow>(file, ['period', 'member', 'source']);
}

export function loadTotals(): YearTotal[] {
	const file = path.join(dataDir(), 'market', 'totals.jsonl');
	return readJsonl<YearTotal>(file, ['period', 'total_kz_bi', 'source']).sort((a, b) =>
		a.period.localeCompare(b.period)
	);
}

export function loadPricelists(): Pricelist[] {
	const latest = new Map<string, Pricelist>();
	for (const file of jsonlFiles('brokers')) {
		for (const row of readJsonl<Pricelist>(file, ['broker', 'checked_on'])) {
			const current = latest.get(row.broker);
			// checked_on é AAAA-MM-DD, por isso a comparação de texto coincide com a cronológica.
			if (!current || row.checked_on > current.checked_on) latest.set(row.broker, row);
		}
	}
	return [...latest.values()];
}
