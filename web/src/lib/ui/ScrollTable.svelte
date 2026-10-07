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
	/* Só para leitores de ecrã. */
	caption {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
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
