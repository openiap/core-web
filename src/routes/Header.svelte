<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import Search from "$lib/search/search.svelte";
	import NavUser from "$lib/sidebar/nav-user.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { sidemenu } from "$lib/stores/sidemenu.svelte";
	import { usersettings } from "$lib/stores/usersettings.svelte.js";
	import {
		ArrowLeftToLine,
		ArrowRightToLine,
		Github,
		Trash2,
	} from "lucide-svelte";
	import Moon from "lucide-svelte/icons/moon";
	import Sun from "lucide-svelte/icons/sun";
	import { toggleMode } from "mode-watcher";
	import { capitalizeFirstLetter } from "../helper";
	import type { Workspace } from "./workspace/schema";
	let pathname = $state(
		$state.snapshot(
			$page.url.pathname
				.replace(base, "")
				.replace("/", "")
				.split("/")
				.map(
					(x) => x.toLowerCase().charAt(0).toUpperCase() + x.slice(1),
				)
				.join("/"),
		),
	);
	const workspacecache = new Map();

	let sidebar = Sidebar.useSidebar();
	$effect(() => {
		if (pathname != $state.snapshot($page.url.pathname)) {
			updateBreadcrumb();
		}
	});
	async function updateBreadcrumb() {
		let _pathname = $page.url.pathname
			.replace(base, "")
			.replace("/", "")
			.split("/")
			.map((x) => x.toLowerCase().charAt(0).toUpperCase() + x.slice(1));
		if (_pathname.length == 0) {
			pathname = _pathname.join("/");
		} else {
			if (_pathname[0] == "Workspace") {
				if (_pathname.length > 1 && _pathname[1].length == 24) {
					if (workspacecache.has(_pathname[1])) {
						_pathname[1] = workspacecache.get(_pathname[1]);
					} else {
						const workspace = await auth.client.FindOne<Workspace>({
							collectionname: "users",
							query: { _id: _pathname[1] },
							jwt: auth.access_token,
						});
						if (workspace != null) {
							_pathname[1] = workspace.name;
							workspacecache.set(_pathname[1], workspace.name);
						}
					}
				}
			}
			pathname = _pathname.join("/");
		}
	}
	if (browser) {
		updateBreadcrumb();
	}

	function login() {
		window.localStorage.setItem("redirect", window.location.pathname);
		auth.login();
	}
	function reset() {
		usersettings.reset();
		goto(base + `/`);
	}
</script>

<header
	class="flex h-16 shrink-0 items-center justify-between px-4 rounded mx-2"
>
	<div class="flex items-center">
		<!-- <Sidebar.Trigger class="-ml-1" /> -->
		<HotkeyButton
			variant="ghost"
			size="icon"
			onclick={() => {
				if (sidebar.isMobile) {
					sidebar.toggle();
				} else {
					sidebar.toggle();
					sidemenu.status = !sidemenu.status;
				}
			}}
			class="me-2 text-bw500"
			title={sidemenu.status ? "Close sidebar" : "Open sidebar"}
		>
			{#if sidebar.isMobile}
				<ArrowRightToLine class="block dark:text-bw500" />
			{:else if sidemenu.status}
				<ArrowLeftToLine class="block dark:text-bw500" />
			{:else}
				<ArrowRightToLine class="block dark:text-bw500" />
			{/if}
		</HotkeyButton>

		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#each pathname.split("/") as page, index}
					<Breadcrumb.Item class="hidden md:block ">
						{#if pathname.split("/").length - 1 !== index}
							<Breadcrumb.Link
								href="{base}/{pathname
									.split('/')
									.splice(0, index + 1)
									.join('/').toLowerCase()}">{page.trim()}</Breadcrumb.Link
							>
						{:else}
							<div class="font-bold text-[16px] dark:text-bw100">
								{capitalizeFirstLetter(page.trim())}
							</div>
						{/if}
					</Breadcrumb.Item>
					{#if pathname.split("/").length - 1 !== index}
						<div class="hidden md:block dark:text-bw500">/</div>
					{/if}
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="flex items-center justify-end">
		<div class="flex space-x-5 items-center">
			<Search />
			<HotkeyButton
				onclick={() =>
					window.open("https://github.com/openiap", "_blank")}
				variant="headericon"
				size="icon"
				aria-label="Visit us at Github"
				title="Github"
			>
				<Github />
			</HotkeyButton>
			<HotkeyButton
				variant="headericon"
				size="icon"
				aria-label="Clear cookies"
				onclick={reset}
				title="Clear filters and settings"
			>
				<Trash2 />
			</HotkeyButton>
			<HotkeyButton
				onclick={toggleMode}
				variant="headericon"
				size="icon"
				aria-label="Toggle darkmode"
				title="Toggle theme"
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
					variant="success"
					aria-label="Signin"
					onclick={login}
					data-shortcut={"ctrl+q,meta+q"}>Signin</HotkeyButton
				>
			{/if}
		</div>
	</div>
</header>
