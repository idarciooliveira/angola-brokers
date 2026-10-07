import { loadDaily, loadMembers, loadPricelists, loadTotals } from '#lib/server/data';
import type { Pricelist } from '#lib/types';

const isBodiva = (source: string) => source.includes('bodiva.ao');

function dailyStatus() {
	const days = loadDaily();
	const first = days[0];
	const last = days[days.length - 1];
	return {
		first: first.date,
		last: last.date,
		days: days.length,
		copies: last.rows.filter((r) => !isBodiva(r.source)).map((r) => r.code)
	};
}

function membersStatus(year: string) {
	const rows = loadMembers(year);
	const missing = (field: 'accounts' | 'custody_mm_kz' | 'volume_mm_kz') =>
		rows.filter((r) => r[field] == null).length;
	return {
		year,
		asOf: rows.map((r) => r.as_of).sort().at(-1) ?? null,
		members: rows.length,
		noAccounts: missing('accounts'),
		noCustody: missing('custody_mm_kz'),
		noVolume: missing('volume_mm_kz')
	};
}

function pricelistsStatus() {
	const lists = loadPricelists();
	const names = (keep: (p: Pricelist) => boolean) =>
		lists
			.filter(keep)
			.map((p) => p.broker)
			.sort((a, b) => a.localeCompare(b, 'pt'));
	return {
		total: lists.length,
		checkedOn: lists.map((p) => p.checked_on).sort().at(-1) ?? null,
		stale: names((p) => p.stale),
		uncertain: names((p) => p.uncertain),
		noDate: names((p) => !p.pricelist_date)
	};
}

export function load() {
	const totals = loadTotals();
	return {
		daily: dailyStatus(),
		members: [membersStatus('2025'), membersStatus('2026')],
		totals: totals.map((t) => ({
			period: t.period,
			total: t.total_kz_bi,
			partial: t.partial,
			asOf: t.as_of
		})),
		partialAsOf: totals.find((t) => t.partial)?.as_of ?? null,
		pricelists: pricelistsStatus()
	};
}
