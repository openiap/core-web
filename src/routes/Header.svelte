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
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { page } from "$app/stores";

	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
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

<header 
class="flex h-16 shrink-0 items-center justify-between px-4 rounded mx-2.5 my-2.5"
>
	<div class="flex items-center">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#each pagename().split("/") as page, index}
					<Breadcrumb.Item class="hidden md:block">
						{#if pagename().split("/").length - 1 !== index}
							<Breadcrumb.Link
								href="{base}/{page.trim()}"
								>{page.trim()}</Breadcrumb.Link
							>
						{:else}
							{page.trim()}
						{/if}
					</Breadcrumb.Item>
					{#if pagename().split("/").length - 1 !== index}
						<Breadcrumb.Separator
							class="hidden md:block"
						/>
					{/if}
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="flex items-center justify-center">
		<div class="flex space-x-5 items-center">
			<Search />
			<Button
				onclick={() =>
					window.open("https://github.com/openiap", "_blank")}
				variant="icon"
				size="iconnew"
				aria-label="Visit us at Github"
			>
				<Github />
			</Button>
			<Button
				variant="icon"
				size="iconnew"
				aria-label="Clear cookies"
				onclick={reset}
			>
				<Trash2 />
			</Button>
			<Button
				onclick={toggleMode}
				variant="icon"
				size="iconnew"
				aria-label="Toggle darkmode"
			>
				<Sun
					class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>

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
