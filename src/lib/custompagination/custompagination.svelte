<script lang="ts">
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
	import * as Pagination from "$lib/components/ui/pagination/index.js";
	import ChevronLeft from "lucide-svelte/icons/chevron-left";
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	let { total_count = 0, page_index = 0, pagename, ...restProps } = $props();
	const perPage = 5;
	const calculateitems = () => {
		if (page_index === 0) {
			return `${1} to ${page_index * perPage + 5}`;
		} else {
			return `${page_index * perPage + 1} to ${page_index * perPage + 5 < total_count ? page_index * perPage + 5 : total_count}`;
		}
	};
	const buttonClass =
		"bg-black text-white  dark:bg-neutral-400 dark:text-black  ";
</script>

<Pagination.Root count={total_count} perPage={5} {...restProps}>
	{#snippet children({ pages, currentPage })}
		<div class="my-2 flex items-center">
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton class={buttonClass}>
						<HotkeyButton
							href="#"
							data-shortcut="ArrowLeft"
							variant="ghostfull"
							disabled={!total_count || page_index + 1 === 1}
						>
							<ChevronLeft class="size-4" />
							<span class="hidden sm:block">Previous</span>
						</HotkeyButton>
					</Pagination.PrevButton>
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === "ellipsis"}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link
								{page}
								isActive={currentPage === page.value}
							>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton class={buttonClass}>
						<HotkeyButton
							href="#"
							data-shortcut="ArrowRight"
							variant="ghostfull"
							disabled={!total_count ||
								currentPage === Math.ceil(total_count / 5)}
						>
							<span class="hidden sm:block">Next</span>
							<ChevronRight class="size-4" />
						</HotkeyButton>
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>
		</div>
		<p class="text-center text-sm">
			Showing {calculateitems()} of {total_count}
			{pagename.includes("entities") ? "items" : pagename + "s"}
		</p>
	{/snippet}
</Pagination.Root>
