<script lang="ts">
	import { formatSignedPct } from '#lib/format';

	let { value }: { value: number | null } = $props();

	const kind = $derived(value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down');
</script>

<span class="chip num {kind}">{formatSignedPct(value)}</span>

<style>
	.chip {
		display: inline-block;
		font-size: 12px;
		padding: 1px 8px;
		border-radius: 99px;
		white-space: nowrap;
	}
	.num {
		font-variant-numeric: tabular-nums;
	}
	.up {
		background: #e3f4e8;
		color: var(--up);
	}
	.down {
		background: #fbe5e5;
		color: var(--down);
	}
	.flat {
		background: var(--soft);
		color: var(--mute);
	}
</style>
