<script lang="ts">
	let { title, hint }: { title: string; hint?: string } = $props();
</script>

<div class="sec">
	<h2>{title}</h2>
	{#if hint}<small>{hint}</small>{/if}
</div>

<style>
	.sec {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 44px 0 14px;
	}
	.sec::before {
		content: '';
		width: 18px;
		height: 18px;
		background: #000;
		flex: none;
	}
	h2 {
		font-size: 26px;
	}
	small {
		margin-left: auto;
		font-size: 12px;
		color: var(--mute);
	}
</style>
