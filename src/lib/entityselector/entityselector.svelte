<script lang="ts">
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import { ChevronDown, ChevronUp } from "lucide-svelte";

    let {
        value = $bindable(),
        collectionname = "entities",
        basefilter = {},
        returnObject = false,
        loading = false,
        class: className = "",
        height = "h-8",
        handleChangeFunction = () => {},
        name = "Entity",
        projection = {},
        noitem = false,
        ...restProps
    } = $props();

    let placeholder = `Select ${name}`;

    const triggerContent = $derived(async () => {
        let id;
        if (value == "") {
            return placeholder;
        }
        if (value == null) {
            return placeholder;
        }
        if (returnObject) {
            id = value?._id;
        } else {
            id = value;
        }
        if(id == null) {
            return placeholder;
        }
        let item = await auth.client.FindOne<any>({
            collectionname,
            query: { _id: id },
            jwt: auth.access_token,
        });
        if (item != null) {
            return "(" + item._type + ") " + item.name;
        }
        return placeholder;
    });

    let entities: any[] = $state([]);
    async function loadSearchResult(search: string) {
        let query = { ...basefilter };
        if (search != null && search != "") {
            query = { ...basefilter, name: { $regex: search, $options: "i" } };
        }
        entities = await auth.client.Query({
            collectionname,
            query,
            top: 8,
            jwt: auth.access_token,
            projection,
        });
        if (noitem) {
            if (name === "workitem queue") {
                entities.unshift({
                    _id: "",
                    name: `(no workitem queue)`,
                    value: null,
                    _type: null,
                } as any);
            } else {
                entities.unshift({
                    _id: null,
                    name: `(no ${name})`,
                    value: null,
                    _type: null,
                } as any);
            }
        }
    }
    let isOpen = $state(false);
    function closeAndRefocusTrigger() {
        isOpen = false;
    }
</script>

<Popover.Root bind:open={isOpen} {...restProps}>
    <Popover.Trigger
        disabled={loading}
        class={" w-64 dark:bg-bw1000 flex items-center justify-between border rounded-[10px] px-3 py-1 dark:border-bw600 dark:text-bw500  dark:hover:bg-bw700 dark:hover:border-bw500 text-sm " +
            " " +
            height +
            " " +
            className}
    >
        {#await triggerContent()}
            Loading...
        {:then triggerContent}
            {triggerContent}
        {/await}
        {#if isOpen}
            <ChevronUp class="ml-2 h-4 w-4 " />
        {:else}
            <ChevronDown class="ml-2 h-4 w-4" />
        {/if}
    </Popover.Trigger>
    <Popover.Content class="w-80">
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
            <Command.List>
                <Command.Empty>No entity found.</Command.Empty>
                {#each entities as item}
                    <Command.Item
                        onSelect={() => {
                            if (returnObject) {
                                value = item;
                            } else {
                                value = item._id;
                            }
                            handleChangeFunction();
                            closeAndRefocusTrigger();
                        }}
                        value={item._id}
                        class="text-sm"
                    >
                        {item._type ? `(${item._type})` : ""}
                        {item.name}
                    </Command.Item>
                {/each}
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
