import { loadLatestDaily, loadMembers } from '#lib/server/data';
import { maturityYear, stockName } from '#lib/instruments';
import { formatDate } from '#lib/format';
import type { DailyPrice, MemberRow } from '#lib/types';

const isBodiva = (source: string) => source.includes('bodiva.ao');

/** Fonte de um cartão, conforme as linhas que mostra. */
function sourceOf(rows: DailyPrice[], date: string): string {
	const fecho = `fecho de ${formatDate(date)}`;
	const copies = rows.filter((r) => !isBodiva(r.source)).length;
	if (copies === 0) return `BODIVA, ${fecho}`;
	if (copies === rows.length) return `biccorretora.ao, cópia do ticker da BODIVA, ${fecho}`;
	return `BODIVA e biccorretora.ao, ${fecho}`;
}

/** Fonte do cartão e os códigos que não vêm da BODIVA. */
function provenance(rows: DailyPrice[], date: string) {
	return {
		source: sourceOf(rows, date),
		unofficial: rows.filter((r) => !isBodiva(r.source)).map((r) => r.code)
	};
}

/** Volume descendente. Membros sem volume ficam no fim. */
function byVolumeDesc(a: MemberRow, b: MemberRow): number {
	if (a.volume_mm_kz === null || b.volume_mm_kz === null) {
		return Number(a.volume_mm_kz === null) - Number(b.volume_mm_kz === null);
	}
	return b.volume_mm_kz - a.volume_mm_kz;
}

function membersOf(year: string) {
	const rows = loadMembers(year);
	return {
		asOf: rows[0]?.as_of ?? null,
		rows: [...rows].sort(byVolumeDesc)
	};
}

export function load() {
	const { date, rows } = loadLatestDaily();
	const byKind = (kind: DailyPrice['kind']) => rows.filter((r) => r.kind === kind);

	const bills = byKind('bt');
	const billItems = bills
		.map((r) => ({ code: r.code, days: Number(r.code.replace('BT', '')), rate: r.price }))
		.sort((a, b) => a.days - b.days);

	// Sem ano (código fora do padrão) vai para o fim.
	const ots = byKind('ot')
		.map((r) => ({
			code: r.code,
			year: maturityYear(r.code),
			price: r.price,
			change: r.change_pct
		}))
		.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.code.localeCompare(b.code));

	const corp = byKind('corp_bond')
		.map((r) => ({ code: r.code, price: r.price, change: r.change_pct }))
		.sort((a, b) => a.code.localeCompare(b.code));

	const stocks = byKind('stock')
		.map((r) => ({
			code: r.code,
			name: stockName(r.code),
			price: r.price,
			change: r.change_pct
		}))
		.sort((a, b) => b.price - a.price);

	return {
		date,
		bills: { items: billItems, ...provenance(bills, date) },
		ots: { items: ots, ...provenance(byKind('ot'), date) },
		corp: { items: corp, ...provenance(byKind('corp_bond'), date) },
		stocks: { items: stocks, ...provenance(byKind('stock'), date) },
		members: {
			'2025': membersOf('2025'),
			'2026': membersOf('2026')
		}
	};
}
