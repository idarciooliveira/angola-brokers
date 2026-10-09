export type Kind = 'stock' | 'ot' | 'corp_bond' | 'bt';

export interface DailyPrice {
	date: string;
	kind: Kind;
	code: string;
	price: number;
	change_pct: number | null;
	source: string;
	scraped_at?: string;
	note?: string;
}

/** Dados fixos de uma Obrigação do Tesouro, do boletim diário da BODIVA. Datas em AAAA-MM-DD. */
export interface TreasuryBond {
	code: string;
	type: string;
	issued: string;
	maturity: string;
	coupon_pct: number;
	source: string;
	checked_on: string;
}

export interface MemberRow {
	as_of: string;
	period: string;
	member: string;
	name: string;
	accounts: number | null;
	accounts_share_pct: number | null;
	custody_mm_kz: number | null;
	volume_mm_kz: number | null;
	source: string;
	note?: string;
}

export interface YearTotal {
	period: string;
	total_kz_bi: number;
	bilateral_kz_bi: number | null;
	multilateral_kz_bi: number | null;
	accounts: number | null;
	partial: boolean;
	as_of: string | null;
	source: string;
}

export interface Pricelist {
	broker: string;
	checked_on: string;
	pct_public_debt_secondary: number;
	min_kz: number;
	extra_fees: 'included' | 'bodiva' | 'bodiva+cevama' | 'unclear';
	dividend_fee: string | null;
	maintenance: string | null;
	pricelist_date: string | null;
	pricelist_date_raw: string | null;
	stale: boolean;
	uncertain: boolean;
	source_url: string | null;
	note: string | null;
}
