import { loadLatestDaily, loadMembers, loadPricelists, loadTotals } from '#lib/server/data';
import { stockName } from '#lib/instruments';
import { logoPath, shortBrokerName } from '#lib/brokers';
import { isCurrentPricelist, purchaseCost } from '#lib/fees';

// O BNA é o banco central, não uma corretora.
const NOT_BROKERS = new Set(['BNA']);

/** Valor com que se compara o custo das corretoras. */
const REFERENCE_KZ = 5_000_000;

export function load() {
	const { date, rows } = loadLatestDaily();
	const totals = loadTotals();
	const current = totals.find((t) => t.partial) ?? totals[totals.length - 1];
	const previous = totals.find((t) => !t.partial && t.period === String(Number(current.period) - 1));

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

	const fallers = stocks.filter((s) => s.change !== null && s.change < 0);
	const worst = fallers.reduce<(typeof stocks)[number] | null>(
		(w, s) => (w === null || (s.change ?? 0) < (w.change ?? 0) ? s : w),
		null
	);

	const bills = rows
		.filter((r) => r.kind === 'bt')
		.flatMap((r) => {
			const m = /^BT(\d+)$/.exec(r.code);
			return m ? [{ days: Number(m[1]), ratePct: r.price }] : [];
		});
	const bestBill = bills.reduce<(typeof bills)[number] | null>(
		(b, x) => (b === null || x.ratePct > b.ratePct ? x : b),
		null
	);
	const worstBill = bills.reduce<(typeof bills)[number] | null>(
		(b, x) => (b === null || x.ratePct < b.ratePct ? x : b),
		null
	);

	const bt364 = rows.find((r) => r.kind === 'bt' && r.code === 'BT364')?.price ?? null;

	const members = loadMembers(current.period).filter((m) => !NOT_BROKERS.has(m.member));
	const topBrokers = members
		.filter((m) => m.volume_mm_kz !== null)
		.sort((a, b) => (b.volume_mm_kz ?? 0) - (a.volume_mm_kz ?? 0))
		.slice(0, 5)
		.map((m) => ({
			name: shortBrokerName(m.name),
			logo: logoPath(m.member),
			volume: m.volume_mm_kz ?? 0
		}));

	const topByAccounts = members
		.filter((m) => m.accounts !== null && m.accounts_share_pct !== null)
		.sort((a, b) => (b.accounts ?? 0) - (a.accounts ?? 0))
		.slice(0, 2);
	const accountsLeaders =
		topByAccounts.length === 2
			? {
					names: topByAccounts.map((m) => shortBrokerName(m.name)),
					sharePct: topByAccounts.reduce((sum, m) => sum + (m.accounts_share_pct ?? 0), 0)
				}
			: null;

	const cheapest = loadPricelists()
		.filter(isCurrentPricelist)
		.map((p) => ({ name: shortBrokerName(p.broker), cost: purchaseCost(p, REFERENCE_KZ).total }))
		.sort((a, b) => a.cost - b.cost)[0];

	return {
		date,
		period: current.period,
		bt364,
		totalBi: current.total_kz_bi,
		previousYear: previous && { period: previous.period, totalBi: previous.total_kz_bi },
		accounts: current.accounts,
		accountsLeaders,
		totalsAsOf: current.as_of,
		stocks,
		fallers: fallers.length,
		worst: worst && { code: worst.code, name: worst.name, change: worst.change },
		bestBill,
		worstBill,
		cheapest: cheapest && {
			name: cheapest.name,
			amount: REFERENCE_KZ,
			pct: (cheapest.cost / REFERENCE_KZ) * 100
		},
		years: totals.map((t) => ({ label: t.period, value: t.total_kz_bi, partial: t.partial })),
		topBrokers,
		unofficial: rows.filter((r) => !r.source.includes('bodiva.ao')).map((r) => r.code)
	};
}
