<script lang="ts">
	type Item = { label: string; value: number; valueLabel?: string };

	let { items, ariaLabel }: { items: Item[]; ariaLabel: string } = $props();

	// Coordenadas em unidades do viewBox (~px a 320 de largura).
	const W = 320;
	const ROW = 28;
	const BAR_H = 16;
	const FS = 13;
	const CHAR = FS * 0.55; // largura média de um carácter, para truncar sem medir
	const LABEL_W = 104;
	const GAP = 8;
	const X0 = LABEL_W + GAP;

	const nf = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 });
	const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
	const truncate = (s: string, max: number) =>
		s.length <= max ? s : s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';

	// Barra com canto arredondado só na ponta do valor; a base fica quadrada.
	function barPath(x: number, y: number, w: number, h: number) {
		if (w <= 0) return '';
		const r = Math.min(4, w, h / 2);
		return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
	}

	const layout = $derived.by(() => {
		const max = Math.max(0, ...items.map((i) => safe(i.value)));
		const texts = items.map((i) => i.valueLabel ?? nf.format(safe(i.value)));
		const longest = Math.max(0, ...texts.map((t) => t.length));
		const valW = Math.min(88, Math.max(36, Math.ceil(longest * CHAR)));
		const barMax = W - valW - GAP - X0;
		const rows = items.map((it, i) => {
			const y = i * ROW;
			return {
				key: i,
				label: truncate(it.label, Math.floor(LABEL_W / CHAR)),
				full: `${it.label}: ${texts[i]}`,
				text: texts[i],
				cy: y + ROW / 2,
				y,
				w: max > 0 ? (safe(it.value) / max) * barMax : 0,
				color: i === 0 ? 'var(--brand, #741A66)' : '#C9A3C3'
			};
		});
		return { valW, barMax, rows, H: items.length ? items.length * ROW : ROW };
	});
</script>

<svg
	class="bar-chart"
	role="img"
	aria-label={ariaLabel}
	viewBox="0 0 {W} {layout.H}"
>
	{#if layout.rows.length === 0}
		<text x={W / 2} y={ROW / 2} text-anchor="middle" dominant-baseline="central" class="empty">Sem dados</text>
	{:else}
		{#each layout.rows as r (r.key)}
			<g>
				<title>{r.full}</title>
				<text x="0" y={r.cy} dominant-baseline="central" class="lbl">{r.label}</text>
				<rect x={X0} y={r.y + (ROW - BAR_H) / 2} width={layout.barMax} height={BAR_H} rx="4" class="track" />
				{#if r.w > 0}
					<path d={barPath(X0, r.y + (ROW - BAR_H) / 2, r.w, BAR_H)} style="fill: {r.color}" />
				{/if}
				<text x={W} y={r.cy} text-anchor="end" dominant-baseline="central" class="val">{r.text}</text>
			</g>
		{/each}
	{/if}
</svg>

<style>
	.bar-chart {
		display: block;
		width: 100%;
		max-width: 22rem;
		height: auto;
		font-family: var(--sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
	}
	.lbl,
	.val,
	.empty {
		font-size: 13px;
	}
	.lbl,
	.val {
		fill: var(--ink, #000);
	}
	.empty {
		fill: var(--mute, #6b7280);
	}
	.track {
		fill: var(--soft, #f6f6f7);
	}
</style>
