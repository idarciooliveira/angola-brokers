<script lang="ts">
	let {
		label,
		value,
		hint
	}: {
		label: string;
		value: string;
		hint?: string;
	} = $props();
</script>

<div class="kpi">
	<p class="l">{label}</p>
	<p class="v num">{value}</p>
	{#if hint}<p class="h">{hint}</p>{/if}
</div>

<style>
	.kpi {
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 18px 20px;
	}
	p {
		margin: 0;
	}
	.l,
	.h {
		font-size: 12.5px;
		color: var(--mute);
	}
	.v {
		margin-top: 4px;
		font-family: var(--serif);
		font-size: clamp(28px, 7vw, 34px);
		line-height: 1.15;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere;
	}
	.h {
		margin-top: 2px;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
</style>
