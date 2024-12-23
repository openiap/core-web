<script lang="ts">
    import ChevronLeft from "lucide-svelte/icons/chevron-left";
    import ChevronRight from "lucide-svelte/icons/chevron-right";
    import { MediaQuery } from "runed";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";

    const isDesktop = new MediaQuery("(min-width: 768px)");

    let {
        total_count = $bindable(0),
        page_index = $bindable(0),
        onnext = (item: any) => {},
        onprevious = (item: any) => {},
        onpageclick = (item: any) => {},
    } = $props();
    const perPage = 5;
    const siblingCount = $derived(isDesktop.matches ? 3 : 0);

    const calculateitems = () => {
        if (page_index === 0) {
            return 1;
        } 
        else if (total_count){
        }else {
            return `${page_index * perPage + 1} of ${page_index * perPage + 5}`;
        }
    };
</script>

<div class="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
    Showing item {calculateitems()} of
    {total_count}
</div>

<Pagination.Root
    count={total_count}
    {perPage}
    {siblingCount}
    page={page_index + 1}
>
    {#snippet children({ pages, currentPage })}
        <Pagination.Content>
            <Pagination.Item>
                <!-- <Pagination.PrevButton onclick={() => onnext()}> -->
                <HotkeyButton
                    disabled={!total_count || page_index + 1 === 1}
                    onclick={() => onprevious()}
                    data-shortcut="ArrowLeft"
                    variant="default"
                >
                    <ChevronLeft class="size-4" />
                    <span class="hidden sm:block">Previous</span>
                </HotkeyButton>
                <!-- </Pagination.PrevButton> -->
            </Pagination.Item>
            {#each pages as page (page.key)}
                {#if page.type === "ellipsis"}
                    <Pagination.Item>
                        <Pagination.Ellipsis />
                    </Pagination.Item>
                {:else}
                    <Pagination.Item tabindex={-1}>
                        <Pagination.Link
                            tabindex={-1}
                            {page}
                            isActive={!total_count ||
                                currentPage === page.value}
                            onclick={() => onpageclick(page.value)}
                        >
                            {page.value}
                        </Pagination.Link>
                    </Pagination.Item>
                {/if}
            {/each}
            <Pagination.Item>
                <!-- <Pagination.NextButton onclick={() => onprevious()}> -->
                <HotkeyButton
                    disabled={!total_count ||
                        currentPage === Math.ceil(total_count / 5)}
                    onclick={() => onnext()}
                    data-shortcut="ArrowRight"
                    variant="default"
                >
                    <span class="hidden sm:block">Next</span>
                    <ChevronRight class="size-4" />
                </HotkeyButton>
                <!-- </Pagination.NextButton> -->
            </Pagination.Item>
        </Pagination.Content>
    {/snippet}
</Pagination.Root>

