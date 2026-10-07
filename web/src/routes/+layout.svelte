<script lang="ts">
	import '../styles/tokens.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { formatDate } from '#lib/format';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const sections = [
		{ href: '/', label: 'Resumo' },
		{ href: '/mercado', label: 'Mercado' },
		{ href: '/corretoras', label: 'Corretoras' },
		{ href: '/simulador', label: 'Simulador' },
		{ href: '/aprender', label: 'Aprender' },
		{ href: '/fontes', label: 'Fontes' }
	];

	const isCurrent = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Painel BODIVA</title>
</svelte:head>

<header class="top">
	<div class="wrap bar">
		<a class="logo" href="/"><i></i>Painel BODIVA</a>
		<nav aria-label="Secções">
			{#each sections as { href, label } (href)}
				<a {href} aria-current={isCurrent(href) ? 'page' : undefined}>{label}</a>
			{/each}
		</nav>
		<span class="stamp">Dados de {formatDate(data.asOf)}</span>
	</div>
</header>

<main class="wrap">
	{@render children()}
</main>

<footer>
	<div class="wrap">
		<p>
			Dados da BODIVA e dos preçários das corretoras. Informação, não aconselhamento financeiro.
		</p>
	</div>
</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-block: 14px;
	}
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #000;
		color: #fff;
		border-radius: 99px;
		padding: 8px 16px;
		font-family: var(--serif);
		font-size: 17px;
		white-space: nowrap;
		text-decoration: none;
	}
	.logo i {
		width: 10px;
		height: 10px;
		background: #fff;
		display: inline-block;
	}
	nav {
		display: flex;
		gap: 2px;
		background: var(--soft);
		border-radius: 99px;
		padding: 4px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	nav::-webkit-scrollbar {
		display: none;
	}
	nav a {
		padding: 7px 14px;
		border-radius: 99px;
		white-space: nowrap;
		color: #111;
		text-decoration: none;
	}
	nav a:hover {
		background: #ececee;
	}
	nav a[aria-current='page'] {
		background: #000;
		color: #fff;
	}
	.stamp {
		font-size: 12px;
		color: var(--mute);
		white-space: nowrap;
	}
	main {
		padding-block: 36px 72px;
	}
	footer {
		border-top: 1px solid var(--line);
		padding-block: 28px;
		font-size: 12.5px;
		color: var(--mute);
	}
	@media (max-width: 900px) {
		.stamp {
			display: none;
		}
		.bar {
			flex-wrap: wrap;
		}
		nav {
			order: 3;
			width: 100%;
		}
	}
</style>
