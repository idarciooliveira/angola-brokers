<script lang="ts">
	import type { Snippet } from 'svelte';

	let { src, name, children }: { src?: string; name: string; children?: Snippet } = $props();

	// Sem logótipo, mostra as iniciais no mesmo espaço para os nomes ficarem alinhados.
	const initials = $derived.by(() => {
		const words = name.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
		if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
		return words
			.slice(0, 2)
			.map((w) => w[0])
			.join('');
	});
</script>

<span class="brk">
	<span class="mark" class:empty={!src} aria-hidden="true">
		{#if src}
			<img {src} alt="" loading="lazy" decoding="async" />
		{:else}
			{initials}
		{/if}
	</span>
	{#if children}{@render children()}{:else}{name}{/if}
</span>

<style>
	.brk {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		vertical-align: middle;
	}
	.mark {
		flex: none;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
	}
	.mark img {
		display: block;
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
	.mark.empty {
		border-radius: 6px;
		background: var(--soft);
		color: var(--mute);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
