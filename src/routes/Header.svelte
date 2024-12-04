<script lang="ts">
	// import { page } from "$app/stores";
	// import logo from "$lib/images/logo.png";
	import Sun from "lucide-svelte/icons/sun";
	import Moon from "lucide-svelte/icons/moon";
	import { toggleMode } from "mode-watcher";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
	// import { base } from "$app/paths";
	import { auth } from "$lib/stores/auth.svelte";
	import { Github } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import Search from "$lib/search/search.svelte";

	// let props = $props();

	function login() {
		auth.login();
	}
	function logout() {
		auth.logout();
	}
</script>

<header>
	<!-- <div class="corner">
		<a href="/">
			<img src={logo} alt="Logo" />
		</a>
	</div> -->

	<div class="flex items-center justify-center">
		<div class="flex gap-1.5">
			<!-- <Button
				variant="outline"
				onclick={() => {
					props.openHelp = true;
				}}
			>
				<HelpCircle />
			</Button> -->
			<Search />
			<a href="https://github.com/openiap">
				<Button variant="outline" aria-label="Visit us at Github">
					<Github width="100%" />
				</Button>
			</a>
			<HotkeyButton
				onclick={toggleMode}
				variant="outline"
				size="icon"
				aria-label="Toggle darkmode"
			>
				<Sun
					class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</HotkeyButton>
			{#if auth.isAuthenticated == true}
				<HotkeyButton
					aria-label="Signout"
					onclick={logout}
					data-shortcut={"Control+q,Meta+q"}>Signout</HotkeyButton
				>
			{:else}
				<HotkeyButton
					aria-label="Signin"
					onclick={login}
					data-shortcut={"Control+q,Meta+q"}>Signin</HotkeyButton
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

	a:hover {
		color: var(--color-theme-1);
	}
</style>
