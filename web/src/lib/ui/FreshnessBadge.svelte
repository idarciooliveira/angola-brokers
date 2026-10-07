<script lang="ts">
	import { formatDate } from '#lib/format';

	let {
		state,
		date
	}: {
		state: 'ok' | 'stale' | 'uncertain';
		date?: string;
	} = $props();

	const when = $derived(date ? formatDate(date) : '');

	const text = $derived.by(() => {
		if (state === 'ok') return when ? `Verificado em ${when}` : 'Verificado';
		if (state === 'stale') return when ? `Antigo, de ${when}` : 'Antigo';
		return 'Por confirmar';
	});
</script>

<span class="badge" class:ok={state === 'ok'} class:q={state !== 'ok'}>{text}</span>

<style>
	.badge {
		display: inline-block;
		font-size: 12px;
		border-radius: 99px;
		padding: 1px 9px;
		white-space: nowrap;
	}
	.ok {
		background: #e3f4e8;
		color: var(--up);
	}
	.q {
		background: var(--warn-soft);
		color: var(--warn);
	}
</style>
