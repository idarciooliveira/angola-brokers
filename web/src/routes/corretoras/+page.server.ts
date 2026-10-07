import { BROKER_MEMBER } from '#lib/brokers';
import { isCurrentPricelist } from '#lib/fees';
import { loadMembers, loadPricelists } from '#lib/server/data';

const PERIOD = '2026';

export function load() {
	const members = new Map(loadMembers(PERIOD).map((m) => [m.member, m]));
	const pricelists = loadPricelists();

	const brokers = pricelists
		.map((p) => {
			const code = BROKER_MEMBER[p.broker];
			const member = code ? members.get(code) : undefined;
			return {
				broker: p.broker,
				pct_public_debt_secondary: p.pct_public_debt_secondary,
				min_kz: p.min_kz,
				extra_fees: p.extra_fees,
				dividend_fee: p.dividend_fee ?? null,
				maintenance: p.maintenance ?? null,
				pricelist_date: p.pricelist_date ?? null,
				checked_on: p.checked_on,
				stale: p.stale,
				uncertain: p.uncertain,
				source_url: p.source_url ?? null,
				note: p.note ?? null,
				accounts: member?.accounts ?? null,
				volume_mm_kz: member?.volume_mm_kz ?? null,
				current: isCurrentPricelist(p)
			};
		})
		.sort((a, b) => a.broker.localeCompare(b.broker, 'pt'));

	// As datas são AAAA-MM-DD, por isso a comparação de texto coincide com a cronológica.
	const checkedOn = pricelists.map((p) => p.checked_on).sort().at(-1) ?? null;
	const membersAsOf = [...members.values()].map((m) => m.as_of).sort().at(-1) ?? null;

	return { brokers, checkedOn, membersAsOf };
}
