import type { DailyPrice } from '#lib/types';

type Day = { date: string; rows: DailyPrice[] };

/**
 * Linhas de `kind` do dia mais recente que as tem. O ticker da BODIVA não traz os Bilhetes,
 * por isso o último dia pode não ter nenhum e as taxas ficam as do último dia que as teve.
 * `days` vem ordenado por data, como devolve `loadDaily`.
 */
export function latestOfKind(days: readonly Day[], kind: DailyPrice['kind']): Day | null {
	for (let i = days.length - 1; i >= 0; i--) {
		const rows = days[i].rows.filter((r) => r.kind === kind);
		if (rows.length > 0) return { date: days[i].date, rows };
	}
	return null;
}
