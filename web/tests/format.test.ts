import { describe, expect, it } from 'vitest';
import {
	formatCompact,
	formatDate,
	formatKz,
	formatNumber,
	formatPct,
	formatSignedPct
} from '../src/lib/format';

const NBSP = ' ';
const MINUS = '−';
const EMPTY = '—';

describe('formatNumber', () => {
	it('usa espaço inseparável como separador de milhares e vírgula decimal', () => {
		expect(formatNumber(5000000)).toBe(`5${NBSP}000${NBSP}000`);
		expect(formatNumber(1234.5, 2)).toBe(`1${NBSP}234,50`);
	});

	it('usa U+2212 nos negativos', () => {
		expect(formatNumber(-3.61, 2)).toBe(`${MINUS}3,61`);
	});

	it('zero e negativos que arredondam para zero não têm sinal', () => {
		expect(formatNumber(0)).toBe('0');
		expect(formatNumber(0, 2)).toBe('0,00');
		expect(formatNumber(-0, 2)).toBe('0,00');
		expect(formatNumber(-0.001, 2)).toBe('0,00');
	});

	it('devolve — para null, undefined e NaN', () => {
		expect(formatNumber(null)).toBe(EMPTY);
		expect(formatNumber(undefined)).toBe(EMPTY);
		expect(formatNumber(Number.NaN)).toBe(EMPTY);
	});
});

describe('formatKz', () => {
	it('prefixa Kz sem casas decimais', () => {
		expect(formatKz(5000000)).toBe(`Kz${NBSP}5${NBSP}000${NBSP}000`);
	});

	it('negativos levam U+2212 depois do prefixo', () => {
		expect(formatKz(-1500)).toBe(`Kz${NBSP}${MINUS}1${NBSP}500`);
	});

	it('zero e nulos', () => {
		expect(formatKz(0)).toBe(`Kz${NBSP}0`);
		expect(formatKz(null)).toBe(EMPTY);
		expect(formatKz(undefined)).toBe(EMPTY);
	});
});

describe('formatPct', () => {
	it('recebe pontos percentuais e usa vírgula', () => {
		expect(formatPct(17.5)).toBe('17,50%');
		expect(formatPct(17.5, 0)).toBe('18%');
	});

	it('negativos e zero', () => {
		expect(formatPct(-2.1)).toBe(`${MINUS}2,10%`);
		expect(formatPct(0)).toBe('0,00%');
	});

	it('devolve — para null e undefined', () => {
		expect(formatPct(null)).toBe(EMPTY);
		expect(formatPct(undefined)).toBe(EMPTY);
	});
});

describe('formatSignedPct', () => {
	it('positivos levam +', () => {
		expect(formatSignedPct(1.01)).toBe('+1,01%');
	});

	it('negativos levam U+2212 verdadeiro, não hífen', () => {
		expect(formatSignedPct(-3.61)).toBe(`${MINUS}3,61%`);
		expect(formatSignedPct(-3.61)).not.toContain('-');
	});

	it('zero sem sinal, incluindo negativos que arredondam para zero', () => {
		expect(formatSignedPct(0)).toBe('0,00%');
		expect(formatSignedPct(-0.001)).toBe('0,00%');
	});

	it('devolve — para null e undefined', () => {
		expect(formatSignedPct(null)).toBe(EMPTY);
		expect(formatSignedPct(undefined)).toBe(EMPTY);
	});
});

describe('formatDate', () => {
	it('converte AAAA-MM-DD para DD/MM/AAAA', () => {
		expect(formatDate('2026-10-05')).toBe('05/10/2026');
	});

	it('não desloca o dia por fuso horário', () => {
		expect(formatDate('2026-01-01')).toBe('01/01/2026');
		expect(formatDate('2026-12-31')).toBe('31/12/2026');
	});

	it('devolve — para null, undefined, formato inválido ou data impossível', () => {
		expect(formatDate(null)).toBe(EMPTY);
		expect(formatDate(undefined)).toBe(EMPTY);
		expect(formatDate('05/10/2026')).toBe(EMPTY);
		expect(formatDate('2026-13-01')).toBe(EMPTY);
		expect(formatDate('2026-10-32')).toBe(EMPTY);
	});
});

describe('formatCompact', () => {
	it('mil milhões em notação compacta pt-AO', () => {
		expect(formatCompact(2500000000)).toBe(`2,5${NBSP}mM`);
	});

	it('negativos levam U+2212', () => {
		expect(formatCompact(-2500000000)).toBe(`${MINUS}2,5${NBSP}mM`);
	});

	it('devolve — para null e undefined', () => {
		expect(formatCompact(null)).toBe(EMPTY);
		expect(formatCompact(undefined)).toBe(EMPTY);
	});
});
