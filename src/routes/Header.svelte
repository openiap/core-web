<script lang="ts">
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

	let sidebar = Sidebar.useSidebar();
	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
	let isMobile = $state(false);

	function login() {
		window.localStorage.setItem("redirect", window.location.pathname);
		auth.login();
	}
	function reset() {
		usersettings.reset();
		goto(base + `/`);
	}
	function checkMobile() {
		const currentState =
			typeof navigator !== "undefined" &&
			/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
		if (currentState) {
			isMobile = true;
			sidemenu.status = false;
		} else {
			isMobile = false;
			sidemenu.status = true;
		}
	}
	checkMobile();
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
				if (isMobile) {
					sidebar.toggle();
				} else {
					sidemenu.status = !sidemenu.status;
				}
			}}
			class="me-2 text-bw500"
			title={sidemenu.status ? "Close sidebar" : "Open sidebar"}
		>
			{#if sidemenu.status}
				<ArrowLeftToLine class="block dark:text-bw500" />
			{:else}
				<ArrowRightToLine class="block dark:text-bw500" />
			{/if}
		</HotkeyButton>

		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#each pagename().split("/") as page, index}
					<Breadcrumb.Item class="hidden md:block ">
						{#if pagename().split("/").length - 1 !== index}
							<Breadcrumb.Link
								href="{base}/{pagename()
									.split('/')
									.splice(0, index + 1)
									.join('/')}">{page.trim()}</Breadcrumb.Link
							>
						{:else}
							<div class="font-bold text-[16px] dark:text-bw100">
								{capitalizeFirstLetter(page.trim())}
							</div>
						{/if}
					</Breadcrumb.Item>
					{#if pagename().split("/").length - 1 !== index}
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
