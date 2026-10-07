<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		source,
		children
	}: {
		title?: string;
		subtitle?: string;
		source?: string;
		children?: Snippet;
	} = $props();
</script>

<article class="card">
	{#if title}<h3>{title}</h3>{/if}
	{#if subtitle}<p class="sub">{subtitle}</p>{/if}
	{#if children}<div class="body" class:headed={title}>{@render children()}</div>{/if}
	{#if source}<p class="src">Fonte: {source}</p>{/if}
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 20px;
		background: var(--bg);
	}
	h3 {
		margin: 0;
		font-family: var(--sans);
		font-size: 14px;
		font-weight: 600;
		line-height: 1.4;
	}
	.sub {
		margin: 2px 0 0;
		font-size: 12.5px;
		color: var(--mute);
	}
	.body {
		min-width: 0;
	}
	.headed {
		margin-top: 16px;
	}
	.src {
		margin: auto 0 0;
		padding-top: 12px;
		font-size: 12.5px;
		color: var(--mute);
	}
</style>
