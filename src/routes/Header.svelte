<script lang="ts">
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { Button } from "$lib/components/ui/button";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
	import Search from "$lib/search/search.svelte";
	import NavUser from "$lib/sidebar/nav-user.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { usersettings } from "$lib/stores/usersettings.svelte.js";
	import { Github, Trash2 } from "lucide-svelte";
	import Moon from "lucide-svelte/icons/moon";
	import Sun from "lucide-svelte/icons/sun";
	import { toggleMode } from "mode-watcher";

	function login() {
		window.localStorage.setItem("redirect", window.location.pathname);
		auth.login();
	}
	async function logout() {
		await auth.logout();
	}
	function reset() {
		usersettings.reset();
		goto(base + `/`);
	}
</script>

<header>
	<div class="flex items-center justify-center">
		<div class="flex space-x-2 items-center">
			<Search />
			<a href="https://github.com/openiap">
				<Button
					variant="outline"
					aria-label="Visit us at Github"
					size="icon"
					class="bg-indigo-600 hover:opacity-80 text-white"
				>
					<Github width="100%" />
				</Button>
			</a>
			<Button
				variant="outline"
				aria-label="Clear cookies"
				onclick={reset}
				class="bg-indigo-600 hover:opacity-80 text-white"
			>
				<Trash2 />
			</Button>
			<HotkeyButton
				onclick={toggleMode}
				variant="outline"
				aria-label="Toggle darkmode"
				class="bg-indigo-600 hover:opacity-80 text-white"
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
				<NavUser
					user={{
						name: auth.profile.name as string,
						email: auth.profile.email as string,
						avatar: "",
					}}
				/>
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
