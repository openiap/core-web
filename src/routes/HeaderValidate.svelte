<script lang="ts">
	import { browser } from "$app/environment";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
	import { auth } from "$lib/stores/auth.svelte";
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
	let realpathname = $state(
		$state.snapshot($page.url.pathname.replace(base, "").replace("/", "")),
	);
	const workspacecache = new Map();

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
		realpathname = $state.snapshot(
			$page.url.pathname.replace(base, "").replace("/", ""),
		);

		if (_pathname.length == 0) {
			pathname = _pathname.join("/");
		} else {
			if (
				_pathname[0] == "Workspace" ||
				_pathname[0] == "Billingaccount"
			) {
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

	async function logout() {
		await auth.logout();
	}
</script>

<header
	class="flex h-16 shrink-0 items-center justify-between px-4 rounded mx-2"
>
	<div class="flex items-center">
		<!-- <Breadcrumb.Root>
			<Breadcrumb.List>
				{#each pathname.split("/") as page, index}
					<Breadcrumb.Item class="hidden md:block ">
						{#if pathname.split("/").length - 1 !== index}
							<Breadcrumb.Link
								href="{base}/{realpathname
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
					{#if pathname.split("/").length - 1 !== index}
						<div class="hidden md:block dark:text-bw500">/</div>
					{/if}
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root> -->
	</div>
	<div class="flex items-center justify-end">
		<div class="flex space-x-5 items-center">
			<HotkeyButton
				onclick={toggleMode}
				variant="headericon"
				size="icon"
				aria-label="Toggle Theme"
			>
				<Sun
					class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</HotkeyButton>

			{#if auth.profile != null && Object.keys(auth.profile).length > 0}
				<!-- <NavUser /> -->
				<HotkeyButton
					onclick={logout}
					variant="danger"
					aria-label="Sign Out"
					
				>
					Signout
				</HotkeyButton>
			{/if}
		</div>
	</div>
</header>
