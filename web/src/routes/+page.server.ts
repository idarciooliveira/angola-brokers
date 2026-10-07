import { loadLatestDaily, loadMembers, loadTotals } from '#lib/server/data';
import { stockName } from '#lib/instruments';

// O BNA é o banco central, não uma corretora.
const NOT_BROKERS = new Set(['BNA']);

export function load() {
	const { date, rows } = loadLatestDaily();
	const totals = loadTotals();
	const current = totals.find((t) => t.partial) ?? totals[totals.length - 1];

	const stocks = rows
		.filter((r) => r.kind === 'stock')
		.map((r) => ({
			code: r.code,
			name: stockName(r.code),
			price: r.price,
			change: r.change_pct,
			official: r.source.includes('bodiva.ao')
		}))
		.sort((a, b) => b.price - a.price);

	const mover = stocks
		.filter((s) => s.change !== null)
		.reduce<(typeof stocks)[number] | null>(
			(best, s) => (best === null || Math.abs(s.change ?? 0) > Math.abs(best.change ?? 0) ? s : best),
			null
		);

	const bt364 = rows.find((r) => r.kind === 'bt' && r.code === 'BT364')?.price ?? null;

	const topBrokers = loadMembers(current.period)
		.filter((m) => m.volume_mm_kz !== null && !NOT_BROKERS.has(m.member))
		.sort((a, b) => (b.volume_mm_kz ?? 0) - (a.volume_mm_kz ?? 0))
		.slice(0, 5)
		.map((m) => ({ name: m.name, volume: m.volume_mm_kz ?? 0 }));

	return {
		date,
		period: current.period,
		bt364,
		totalBi: current.total_kz_bi,
		accounts: current.accounts,
		totalsAsOf: current.as_of,
		mover: mover && { code: mover.code, change: mover.change },
		stocks,
		years: totals.map((t) => ({ label: t.period, value: t.total_kz_bi, partial: t.partial })),
		topBrokers,
		unofficial: rows.filter((r) => !r.source.includes('bodiva.ao')).map((r) => r.code)
	};
}
