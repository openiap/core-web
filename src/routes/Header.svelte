<script lang="ts">
	import { page } from "$app/stores";
	import logo from "$lib/images/logo.png";
	import github from "$lib/images/github.svg";
	import Sun from "lucide-svelte/icons/sun";
	import Moon from "lucide-svelte/icons/moon";
	import { toggleMode } from "mode-watcher";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
	import { base } from "$app/paths";
	import { auth } from "$lib/stores/auth.svelte";
	function login() {
		auth.userManager.signinRedirect();
	}
	function logout() {
		auth.userManager.signoutRedirect();
	}
</script>

<header>
	<div class="corner">
		<a href="/">
			<img src={logo} alt="Logo" />
		</a>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li
				aria-current={$page.url.pathname === base + "/"
					? "page"
					: undefined}
			>
				<a href="{base}/">Home</a>
			</li>
			{#if auth.isAuthenticated == true}
				<li
					aria-current={$page.url.pathname === base + "/user"
						? "page"
						: undefined}
				>
					<a href="{base}/user">Users</a>
				</li>
				<li
					aria-current={$page.url.pathname.startsWith(base + "/role")
						? "page"
						: undefined}
				>
					<a href="{base}/role">Roles</a>
				</li>
				<li
					aria-current={$page.url.pathname.startsWith(
						base + "/entities",
					)
						? "page"
						: undefined}
				>
					<a href="{base}/entities">Entities</a>
				</li>
			{/if}
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner flex justify-end">
		<div class="flex gap-1.5">
			<a href="https://github.com/openiap">
				<img src={github} alt="GitHub" />
			</a>
			<HotkeyButton onclick={toggleMode} variant="outline" size="icon">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</HotkeyButton>
			{#if auth.isAuthenticated == true}
				<HotkeyButton
					onclick={logout}
					data-shortcut={"Control+q,Meta+q"}>Signout</HotkeyButton
				>
			{:else}
				<HotkeyButton onclick={login} data-shortcut={"Control+q,Meta+q"}
					>Signin</HotkeyButton
				>
			{/if}
		</div>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.corner {
		width: 3em;
		height: 3em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}
	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current="page"]::before {
		--size: 6px;
		content: "";
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
