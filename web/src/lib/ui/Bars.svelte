<script lang="ts">
	type Item = { label: string; value: number; valueLabel: string; alt?: boolean };

	let { items }: { items: Item[] } = $props();

	const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
	const max = $derived(Math.max(0, ...items.map((i) => safe(i.value))));
</script>

<div class="bars">
	{#each items as it (it.label)}
		<div class="br">
			<span>{it.label}</span>
			<div class="t">
				<i class:alt={it.alt} style:width="{max > 0 ? (safe(it.value) / max) * 100 : 0}%"></i>
			</div>
			<b class="num">{it.valueLabel}</b>
		</div>
	{:else}
		<p class="mute">Sem dados.</p>
	{/each}
</div>

<style>
	.bars {
		display: grid;
		gap: 10px;
	}
	.br {
		display: grid;
		grid-template-columns: 130px minmax(0, 1fr) 64px;
		gap: 12px;
		align-items: center;
		font-size: 13px;
	}
	.t {
		height: 22px;
		background: var(--soft);
		border-radius: 4px;
		overflow: hidden;
	}
	.t i {
		display: block;
		height: 100%;
		background: var(--brand);
		border-radius: 4px;
	}
	.t i.alt {
		background: #c9a3c3;
	}
	b {
		text-align: right;
		font-weight: 500;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	@media (prefers-reduced-motion: no-preference) {
		.t i {
			transition: width 0.4s ease;
		}
	}
	@media (max-width: 520px) {
		.br {
			grid-template-columns: 96px minmax(0, 1fr) 54px;
		}
	}
</style>
