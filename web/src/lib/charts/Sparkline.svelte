<script lang="ts">
	let {
		points,
		ariaLabel,
		width = 120,
		height = 32
	}: { points: number[]; ariaLabel: string; width?: number; height?: number } = $props();

	const P = 5; // margem para o ponto final (r = 4) não ser cortado

	const coords = $derived.by(() => {
		const vals = points.filter((v) => Number.isFinite(v));
		const n = vals.length;
		if (n === 0) return [];
		const min = Math.min(...vals);
		const range = Math.max(...vals) - min;
		return vals.map((v, i) => ({
			x: n === 1 ? width / 2 : P + (i * (width - 2 * P)) / (n - 1),
			y: range === 0 ? height / 2 : P + (1 - (v - min) / range) * (height - 2 * P)
		}));
	});

	const d = $derived(
		coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ')
	);
	const last = $derived(coords.length ? coords[coords.length - 1] : null);
</script>

<svg
	class="spark"
	role="img"
	aria-label={ariaLabel}
	viewBox="0 0 {width} {height}"
	style="max-width: {width}px"
>
	{#if coords.length === 0}
		<line x1={P} x2={width - P} y1={height / 2} y2={height / 2} class="base" />
	{:else}
		{#if coords.length > 1}
			<path {d} class="line" />
		{/if}
		{#if last}
			<circle cx={last.x} cy={last.y} r="4" class="end" />
		{/if}
	{/if}
</svg>

<style>
	.spark {
		display: block;
		width: 100%;
		height: auto;
	}
	.line {
		fill: none;
		stroke: var(--brand, #741a66);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.end {
		fill: var(--brand, #741a66);
	}
	.base {
		stroke: var(--line, #e5e7eb);
		stroke-width: 1;
	}
</style>
