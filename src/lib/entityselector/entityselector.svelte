<script lang="ts">
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import { ChevronDown, ChevronUp, Check, X } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    let {
        value = $bindable(),
        collectionname = "entities",
        basefilter = {},
        loading = false,
        class: className = "",
        height = "h-8",
        handleChangeFunction = () => {},
        name = "Entity",
        projection = {},
        width = "w-full md:w-1/2 lg:w-1/3",
        queryas = null,
        allowunselect = false,
        propertyname = "",
        rendername = null,
        rendercontent = null,
        selectiontype = "single",
        maxselections = 1,
        ...restProps
    } = $props();

    let placeholder = `Search ${name}`;
    let entities: any[] = $state([]);
    let isOpen = $state(false);
    let selectedItems: any[] = $state([]);

    // Initialize selectedItems based on value
    $effect(() => {
        if (selectiontype === "multiple" && Array.isArray(value)) {
            initializeSelectedItems();
        }
    });

    async function initializeSelectedItems() {
        if (!Array.isArray(value) || value.length === 0) {
            selectedItems = [];
            return;
        }

        let _basefilter = $state.snapshot(basefilter);
        var query: any = { ..._basefilter };
        let _value = $state.snapshot(value);

        if (propertyname === "") {
            // If value contains full objects
            selectedItems = _value.map(v => v).filter(v => v !== null && v !== undefined);
        } else {
            // If value contains property values, we need to fetch the full objects
            const ids = _value.filter(v => v !== null && v !== undefined);
            if (ids.length === 0) {
                selectedItems = [];
                return;
            }

            try {
                const items = await auth.client.Query({
                    collectionname,
                    query: {
                        ..._basefilter,
                        [propertyname]: { $in: ids }
                    },
                    jwt: auth.access_token,
                    projection,
                    queryas,
                });
                selectedItems = items;
            } catch (error: any) {
                toast.error("Error loading selected items", {
                    description: error.message,
                });
                selectedItems = [];
            }
        }
    }

    async function getCurrentItem() {
        if (selectiontype === "multiple") {
            return selectedItems;
        }

        let _basefilter = $state.snapshot(basefilter);
        var query: any = { ..._basefilter };
        let _value = $state.snapshot(value);

        if (_value == "") {
            return null;
        }
        if (_value == null) {
            return null;
        }

        if (propertyname == "") {
            if (!_value._id) {
                return null;
            }
            query._id = _value._id;
        } else {
            if (typeof _value == "string") {
                query[propertyname] = _value;
            } else if (typeof _value == "object") {
                query[propertyname] = _value[propertyname];
            }
        }

        let item = await auth.client.FindOne<any>({
            collectionname,
            query,
            jwt: auth.access_token,
            queryas,
        });
        return item;
    }

    const triggerContent = $derived(async () => {
        let result = await getCurrentItem();
        return result;
    });

    async function loadSearchResult(search: string) {
        let query = { ...basefilter };
        if (search != null && search != "") {
            query = { ...basefilter, name: { $regex: search, $options: "i" } };
        }
        try {
            entities = await auth.client.Query({
                collectionname,
                query,
                top: 8,
                jwt: auth.access_token,
                projection,
                queryas,
            });
            if (entities.length == 8) {
                const item = await auth.client.FindOne<any>({
                    collectionname,
                    query: {
                        ...basefilter,
                        name: search,
                    },
                    jwt: auth.access_token,
                    projection,
                    queryas,
                });
                if (item != null) {
                    if (entities.find((x) => x._id == item._id) == null) {
                        entities.unshift(item);
                        entities.pop();
                    }
                }
            }
        } catch (error: any) {
            toast.error("Error loading entities", {
                description: error.message,
            });
            entities = [];
        }
    }

    function closeAndRefocusTrigger() {
        isOpen = false;
    }

    function isItemSelected(item: any) {
        if (selectiontype !== "multiple") {
            return false;
        }
        return selectedItems.some(selected => selected._id === item._id);
    }

    function toggleItem(item: any) {
        if (isItemSelected(item)) {
            selectedItems = selectedItems.filter(selected => selected._id !== item._id);
        } else {
            if (selectedItems.length >= maxselections) {
                // If reached max selections, remove the first one
                selectedItems = [...selectedItems.slice(1), item];
            } else {
                selectedItems = [...selectedItems, item];
            }
        }

        // Update the value based on selection type
        if (propertyname === "") {
            value = selectedItems;
        } else {
            value = selectedItems.map(item => item[propertyname]);
        }
        
        handleChangeFunction(value, selectedItems);
    }

    function removeSelectedItem(item: any) {
        selectedItems = selectedItems.filter(selected => selected._id !== item._id);
        
        // Update the value based on selection type
        if (propertyname === "") {
            value = selectedItems;
        } else {
            value = selectedItems.map(item => item[propertyname]);
        }
        
        handleChangeFunction(value, selectedItems);
    }
</script>

<Popover.Root bind:open={isOpen} {...restProps}>
    <Popover.Trigger
        disabled={loading}
        class={"dark:bg-bw1000 flex items-center justify-between border border-bw600 rounded-[10px] px-3 py-1 dark:border-bw600 placeholder:text-bw500 dark:placeholder:text-bw500 text-bw950 dark:text-bw100 dark:hover:bg-bw700 dark:hover:border-bw500 text-sm shadow-light dark:shadow-dark " +
            " " +
            height +
            " " +
            width +
            " " +
            className}
    >
        {#await triggerContent()}
            Loading...
        {:then triggerContent}
            {#if selectiontype === "multiple"}
                <div class="flex flex-wrap gap-1 overflow-hidden items-center mr-2 max-w-[calc(100%-24px)]">
                    {#if selectedItems.length === 0}
                        <span class="text-bw500">Select {name}</span>
                    {:else}
                        {#each selectedItems as item, i (item._id)}
                            <div class="flex items-center bg-bw200 dark:bg-bw800 px-2 py-0.5 rounded-md">
                                {#if rendername}
                                    {@render rendername(item)}
                                {:else}
                                    {item.name}
                                {/if}
                                <button type="button" class="ml-1" on:click|stopPropagation={() => removeSelectedItem(item)}>
                                    <X class="h-3 w-3" />
                                </button>
                            </div>
                        {/each}
                    {/if}
                </div>
            {:else}
                <div class="mr-2 max-w-[calc(100%-24px)] overflow-hidden text-ellipsis">
                    {#if rendercontent == null}
                        {triggerContent}
                    {:else}
                        {@render rendercontent(triggerContent)}
                    {/if}
                </div>
            {/if}
        {:catch error}
            {error.message}
        {/await}
        {#if isOpen}
            <ChevronUp class="ml-2 h-4 w-4 " />
        {:else}
            <ChevronDown class="ml-2 h-4 w-4" />
        {/if}
    </Popover.Trigger>
    <Popover.Content class="w-fit">
        {#await loadSearchResult("")}{/await}

        <Command.Root shouldFilter={false}>
            <Command.Input
                {placeholder}
                onkeyup={async (e) => {
                    // @ts-ignore
                    let value = e.target.value;
                    await loadSearchResult(value);
                }}
            />
            <Command.List class="py-[5px]">
                <Command.Empty>No entity found.</Command.Empty>
                {#if allowunselect == true}
                    <Command.Item
                        title={"No " + name}
                        onSelect={() => {
                            if (selectiontype === "multiple") {
                                selectedItems = [];
                                value = [];
                            } else {
                                value = "";
                            }
                            handleChangeFunction(value, null);
                            closeAndRefocusTrigger();
                        }}
                        value={""}
                        class="text-sm cursor-pointer mx-2 rounded-[10px]"
                    >
                        Unselect {name}
                    </Command.Item>
                {/if}
                {#each entities as item}
                    <Command.Item
                        onSelect={() => {
                            if (selectiontype === "multiple") {
                                toggleItem(item);
                                // Keep the popover open for multiple selections
                            } else {
                                // Single selection logic
                                if (propertyname == "") {
                                    value = item;
                                } else {
                                    value = item[propertyname];
                                }
                                handleChangeFunction(value, item);
                                closeAndRefocusTrigger();
                            }
                        }}
                        value={item._id}
                        class="text-sm cursor-pointer mx-2 rounded-[10px] flex items-center justify-between"
                    >
                        <span>
                            {#if rendername}
                                {@render rendername(item)}
                            {:else}
                                {item.name}
                            {/if}
                        </span>
                        {#if selectiontype === "multiple" && isItemSelected(item)}
                            <Check class="h-4 w-4 ml-2" />
                        {/if}
                    </Command.Item>
                {/each}
            </Command.List>
            {#if selectiontype === "multiple"}
                <div class="border-t border-bw300 dark:border-bw700 p-2 flex justify-end">
                    <button 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                        on:click={closeAndRefocusTrigger}
                    >
                        Apply ({selectedItems.length}/{maxselections})
                    </button>
                </div>
            {/if}
        </Command.Root>
    </Popover.Content>
</Popover.Root>
