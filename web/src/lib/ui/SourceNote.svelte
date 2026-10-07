<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'fine'
	}: {
		children: Snippet;
		variant?: 'fine' | 'warn';
	} = $props();
</script>

{#if variant === 'warn'}
	<div class="note">{@render children()}</div>
{:else}
	<div class="fine">{@render children()}</div>
{/if}

<style>
	.fine {
		margin-top: 12px;
		font-size: 12.5px;
		color: var(--mute);
	}
	.note {
		margin-top: 14px;
		padding: 10px 14px;
		border-radius: 8px;
		background: var(--warn-soft);
		font-size: 13px;
	}
</style>
