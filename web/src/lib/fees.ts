import type { Pricelist } from '#lib/types';

export const IVA_RATE = 0.14;

const BODIVA_RATE = 0.0525 / 100;
const BODIVA_MIN_KZ = 1750;
const CEVAMA_RATE = 0.026 / 100;

export interface PurchaseCost {
	commission: number;
	bodiva: number;
	cevama: number;
	iva: number;
	total: number;
}

type FeeInput = Pick<Pricelist, 'pct_public_debt_secondary' | 'min_kz' | 'extra_fees'>;

/**
 * Custo de comprar `amount` kwanzas de Obrigações do Tesouro no mercado secundário.
 * O mínimo da corretora aplica-se só à comissão. Quando o preçário não diz se a BODIVA
 * e a CEVAMA estão incluídas ('unclear'), conta as duas, para não subestimar o custo.
 */
export function purchaseCost(p: FeeInput, amount: number): PurchaseCost {
	if (!(amount > 0)) return { commission: 0, bodiva: 0, cevama: 0, iva: 0, total: 0 };

	const commission = Math.max((amount * p.pct_public_debt_secondary) / 100, p.min_kz);
	const chargesBodiva = p.extra_fees !== 'included';
	const chargesCevama = p.extra_fees !== 'included' && p.extra_fees !== 'bodiva';
	const bodiva = chargesBodiva ? Math.max(amount * BODIVA_RATE, BODIVA_MIN_KZ) : 0;
	const cevama = chargesCevama ? amount * CEVAMA_RATE : 0;
	const iva = (commission + bodiva + cevama) * IVA_RATE;

	return { commission, bodiva, cevama, iva, total: commission + bodiva + cevama + iva };
}

/** Preçário que dá para comparar sem avisos: recente, com data e sem dúvidas sobre as taxas. */
export function isCurrentPricelist(p: Pick<Pricelist, 'stale' | 'uncertain' | 'pricelist_date'>) {
	return !p.stale && !p.uncertain && p.pricelist_date !== null;
}
