<script lang="ts">
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { CustomSelect } from "$lib/customselect";
    import Entities from "$lib/entities/entities.svelte";
    import Searchinput from "$lib/searchinput/searchinput.svelte";
    import { History, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-svelte";
    import { data as datacomponent } from "$lib/entities/data.svelte.js";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";

    const { data } = $props();
    // let ref: any;
    let loading = $state(false);
    datacomponent.parsesettings(data.settings);

    let searchstring = $state(datacomponent.settings.searchstring);
    let selected_items = $state([]);
    let collections: any[] = $state(data.collections);
    let entities = $state(data.entities);
    let collectionname = $state("");
    collectionname = data.collectionname;
    let isAdmin = data.isAdmin;
    let showWarningEntityDelete = $state(false);
    let page = $derived(() => "entities-" + collectionname);
    function single_item_click(item: any) {
        goto(base + `/entities/${collectionname}/edit/${item._id}`);
    }
    console.log("entities", data.entities);
    console.log("collectionname", data.collectionname);
</script>

<h1>hi mon {collectionname}</h1>
<div
    class="flex flex-col xl:flex-row xl:items-center xl:justify-between xl:space-x-4 xl:mb-2"
>
    <div
        class="grid grid-cols-1 md:grid-cols-2 xl:flex xl:items-center gap-2 xl:gap-0 xl:space-x-4 mb-2"
    >
        <Searchinput bind:searchstring class="xl:w-[240px]" />
        <!-- <div class="block xl:hidden">
            <CustomSelect
                class="h-7"
                width="w-full"
                type="single"
                {loading}
                bind:value={collectionname}
                triggerContent={() => collectionname}
                onValueChangeFunction={(item: any) => {
                    selectcollectionandtab(item);
                }}
                selectitems={collections}
            />
        </div> -->
    </div>

    <div
        class="grid grid-cols-1 md:grid-cols-2 lg:flex gap-2 lg:gap-0 lg:space-x-4 mb-2"
    >
        <!-- <HotkeyButton size="sm" disabled={loading} onclick={getCollections}>
            <RefreshCcw />
            Refresh</HotkeyButton
        > -->
        {#if isAdmin}
            <HotkeyButton
                size="sm"
                variant="danger"
                disabled={loading}
                onclick={async () => {
                    showWarningEntityDelete = true;
                }}
            >
                <Trash2 />
                Delete {collectionname}</HotkeyButton
            >
        {/if}
        <HotkeyButton
            size="sm"
            data-shortcut="n,ins"
            disabled={loading}
            onclick={() => {
                goto(base + `/entities/${collectionname}/new`);
            }}
        >
            <Plus />
            Add to {collectionname}</HotkeyButton
        >
    </div>
</div>
{#key collectionname}
    <Entities
        {collectionname}
        page={page()}
        total_count={data.total_count}
        bind:searchstring
        bind:selected_items
        bind:entities
        {single_item_click}
        bind:loading
    >
        {#snippet action(item: any)}
            <HotkeyButton
                aria-label="history"
                disabled={loading}
                onclick={() =>
                    goto(
                        base +
                            `/entities/${collectionname}/history/${item._id}`,
                    )}
                size="tableicon"
                variant="icon"
            >
                <History />
            </HotkeyButton>
            <HotkeyButton
                aria-label="edit"
                disabled={loading}
                onclick={() => single_item_click(item)}
                size="tableicon"
                variant="icon"
            >
                <Pencil />
            </HotkeyButton>
        {/snippet}
    </Entities>
{/key}
