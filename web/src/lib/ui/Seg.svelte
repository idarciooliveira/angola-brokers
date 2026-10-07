<script lang="ts" generics="T extends string">
	let {
		options,
		value = $bindable(),
		label
	}: {
		options: { value: T; label: string }[];
		value: T;
		label: string;
	} = $props();
</script>

<div class="seg" role="group" aria-label={label}>
	{#each options as o (o.value)}
		<button type="button" aria-pressed={value === o.value} onclick={() => (value = o.value)}>
			{o.label}
		</button>
	{/each}
</div>

<style>
	.seg {
		display: inline-flex;
		flex-wrap: wrap;
		background: var(--soft);
		border-radius: 99px;
		padding: 3px;
	}
	button {
		border: 0;
		background: none;
		padding: 6px 14px;
		border-radius: 99px;
		font-size: 13px;
	}
	button[aria-pressed='true'] {
		background: var(--bg);
		box-shadow: 0 0 0 1px var(--line);
	}
</style>
