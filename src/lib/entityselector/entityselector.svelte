<script lang="ts">
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import { ChevronDown, ChevronUp } from "lucide-svelte";
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
        ...restProps
    } = $props();

    let placeholder = `Search ${name}`;
    let entities: any[] = $state([]);
    let isOpen = $state(false);

    async function getCurrentItem() {
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
        let item = await getCurrentItem();
        return item;
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
            {#if rendercontent == null}
                {triggerContent}
            {:else}
                {@render rendercontent(triggerContent)}
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
                            value = "";
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
                            if (propertyname == "") {
                                // new thing removed _id to return object instead of the id for workitemqueue (agent and mq req obj) and agent schedule (req obj)
                                value = item;
                            } else {
                                value = item[propertyname];
                            }
                            handleChangeFunction(value, item);
                            closeAndRefocusTrigger();
                        }}
                        value={item._id}
                        class="text-sm cursor-pointer mx-2 rounded-[10px]"
                    >
                        {#if rendername}
                            {@render rendername(item)}
                        {:else}
                            {item.name}
                        {/if}
                    </Command.Item>
                {/each}
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
