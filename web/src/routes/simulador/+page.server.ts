import { brokerSlug } from '#lib/brokers';
import { isCurrentPricelist, purchaseCost } from '#lib/fees';
import { loadLatestDaily, loadPricelists } from '#lib/server/data';

/** Valor com que se ordenam as corretoras e se preenche o simulador. */
const REFERENCE_KZ = 5_000_000;
const DEFAULT_DAYS = 364;

export function load() {
	const { date, rows } = loadLatestDaily();

	// Código no formato BT91, BT364. O prazo em dias é o número do código.
	const bills = rows
		.filter((r) => r.kind === 'bt')
		.flatMap((r) => {
			const m = /^BT(\d+)$/.exec(r.code);
			return m ? [{ days: Number(m[1]), ratePct: r.price }] : [];
		})
		.sort((a, b) => a.days - b.days);

	const brokers = loadPricelists()
		.map((p) => ({ p, cost: purchaseCost(p, REFERENCE_KZ).total }))
		.sort((a, b) => a.cost - b.cost || a.p.broker.localeCompare(b.p.broker, 'pt'))
		.map(({ p }) => ({
			slug: brokerSlug(p.broker),
			broker: p.broker,
			pct_public_debt_secondary: p.pct_public_debt_secondary,
			min_kz: p.min_kz,
			extra_fees: p.extra_fees,
			pricelist_date: p.pricelist_date,
			stale: p.stale,
			uncertain: p.uncertain,
			current: isCurrentPricelist(p)
		}));

	const days = bills.some((b) => b.days === DEFAULT_DAYS) ? DEFAULT_DAYS : (bills[0]?.days ?? DEFAULT_DAYS);

	return {
		date,
		bills,
		brokers,
		defaults: {
			valor: REFERENCE_KZ,
			prazo: days,
			// A mais barata com preçário actual, para não abrir com um preçário antigo.
			corretora: (brokers.find((b) => b.current) ?? brokers[0])?.slug ?? ''
		}
	};
}
