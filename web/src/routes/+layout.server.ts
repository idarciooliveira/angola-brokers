import { loadLatestDaily } from '#lib/server/data';

export function load() {
	return { asOf: loadLatestDaily().date };
}
