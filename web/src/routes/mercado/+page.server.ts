import { latestOfKind } from '#lib/daily';
import { loadDaily, loadLatestDaily, loadMembers, loadTreasuryBonds } from '#lib/server/data';
import { bondName, maturityYear, monthsBetween, stockName } from '#lib/instruments';
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

	// O ticker do dia não traz os Bilhetes. Ficam as taxas do último dia que as teve.
	const latestBills = latestOfKind(loadDaily(), 'bt');
	const bills = latestBills?.rows ?? [];
	const billItems = bills
		.map((r) => ({ code: r.code, days: Number(r.code.replace('BT', '')), rate: r.price }))
		.sort((a, b) => a.days - b.days);

	// Título que ainda não está em data/instruments/ot.jsonl mostra só o ano lido do código, sem nome nem prazo.
	// Sem vencimento vai para o fim.
	const bonds = loadTreasuryBonds();
	const ots = byKind('ot')
		.map((r) => {
			const bond = bonds.get(r.code);
			return {
				code: r.code,
				name: bond ? bondName(bond.coupon_pct, bond.maturity) : 'Obrigação do Tesouro',
				maturity: bond?.maturity ?? null,
				year: maturityYear(r.code),
				monthsLeft: bond ? monthsBetween(date, bond.maturity) : null,
				price: r.price,
				change: r.change_pct
			};
		})
		.sort(
			(a, b) =>
				(a.maturity ?? '9999').localeCompare(b.maturity ?? '9999') || a.code.localeCompare(b.code)
		);

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
		bills: { items: billItems, ...provenance(bills, latestBills?.date ?? date) },
		ots: { items: ots, ...provenance(byKind('ot'), date) },
		corp: { items: corp, ...provenance(byKind('corp_bond'), date) },
		stocks: { items: stocks, ...provenance(byKind('stock'), date) },
		members: {
			'2025': membersOf('2025'),
			'2026': membersOf('2026')
		}
	};
}
