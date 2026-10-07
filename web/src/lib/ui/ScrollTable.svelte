<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		caption
	}: {
		children: Snippet;
		caption?: string;
	} = $props();
</script>

<div class="scroll">
	<table>
		{#if caption}<caption>{caption}</caption>{/if}
		{@render children()}
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	caption {
		caption-side: top;
		text-align: left;
		padding-bottom: 8px;
		font-size: 12.5px;
		color: var(--mute);
	}

	/* Células vêm do conteúdo passado pelo pai, por isso precisam de :global. */
	.scroll :global(th) {
		padding: 10px 12px;
		border-bottom: 1px solid var(--line);
		font-size: 12px;
		font-weight: 500;
		color: var(--mute);
		text-align: left;
		white-space: nowrap;
	}
	.scroll :global(td) {
		padding: 12px;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	.scroll :global(tr:last-child td) {
		border-bottom: 0;
	}
	.scroll :global(th.r),
	.scroll :global(td.r) {
		text-align: right;
	}
	.scroll :global(th:first-child),
	.scroll :global(td:first-child) {
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--bg);
	}
</style>
