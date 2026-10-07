<script lang="ts">
	type Item = { label: string; value: number; valueLabel?: string; partial?: boolean };

	let { items, ariaLabel }: { items: Item[]; ariaLabel: string } = $props();

	// Coordenadas em unidades do viewBox (~px a 320 de largura).
	const W = 320;
	const H = 180;
	const PAD_T = 22; // espaço para o valor em cima da coluna mais alta
	const PAD_B = 24; // espaço para o rótulo do eixo x
	const BASE = H - PAD_B;
	const PLOT_H = H - PAD_T - PAD_B;
	const FS = 12;
	const CHAR = FS * 0.55;
	const MAX_COL = 24;

	const nf = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 });
	const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
	const truncate = (s: string, max: number) =>
		s.length <= max ? s : s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';

	// Coluna com canto arredondado só no topo; a base fica quadrada.
	function colPath(x: number, top: number, w: number, h: number) {
		if (h <= 0 || w <= 0) return '';
		const r = Math.min(4, w / 2, h);
		return `M${x},${BASE} V${top + r} A${r},${r} 0 0 1 ${x + r},${top} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${top + r} V${BASE} Z`;
	}

	const cols = $derived.by(() => {
		const n = items.length;
		const max = Math.max(0, ...items.map((i) => safe(i.value)));
		const slot = n ? W / n : W;
		const colW = Math.min(MAX_COL, slot * 0.6);
		const maxChars = Math.max(1, Math.floor(slot / CHAR));
		return items.map((it, i) => {
			const v = safe(it.value);
			const h = max > 0 ? (v / max) * PLOT_H : 0;
			const text = it.valueLabel ?? nf.format(v);
			const cx = slot * i + slot / 2;
			const top = BASE - h;
			return {
				key: i,
				x: cx - colW / 2,
				cx,
				colW,
				h,
				top,
				text: truncate(text, maxChars),
				label: truncate(it.label, maxChars),
				full: `${it.label}: ${text}`,
				partial: !!it.partial
			};
		});
	});
</script>

<svg class="col-chart" role="img" aria-label={ariaLabel} viewBox="0 0 {W} {H}">
	{#if cols.length === 0}
		<text x={W / 2} y={H / 2} text-anchor="middle" dominant-baseline="central" class="empty">Sem dados</text>
	{:else}
		<line x1="0" x2={W} y1={BASE} y2={BASE} class="axis" />
		{#each cols as c (c.key)}
			<g>
				<title>{c.full}</title>
				{#if c.h > 0}
					<path d={colPath(c.x, c.top, c.colW, c.h)} class="col" class:partial={c.partial} />
				{/if}
				<text x={c.cx} y={c.top - 6} text-anchor="middle" class="val">{c.text}</text>
				<text x={c.cx} y={BASE + 16} text-anchor="middle" class="lbl">{c.label}</text>
			</g>
		{/each}
	{/if}
</svg>

<style>
	.col-chart {
		display: block;
		width: 100%;
		max-width: 22rem;
		height: auto;
		font-family: var(--sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
	}
	.val,
	.lbl,
	.empty {
		font-size: 12px;
	}
	.val {
		fill: var(--ink, #000);
	}
	.lbl {
		fill: var(--mute, #6b7280);
	}
	.empty {
		fill: var(--mute, #6b7280);
	}
	.axis {
		stroke: var(--line, #e5e7eb);
		stroke-width: 1;
	}
	.col {
		fill: var(--brand, #741a66);
	}
	/* Ano em curso: contorno tracejado e preenchimento mais claro. */
	.col.partial {
		fill-opacity: 0.2;
		stroke: var(--brand, #741a66);
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
</style>
