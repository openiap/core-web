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
        ...restProps
    } = $props();

    const triggerContent = $derived(async () => {
        let id;
        if (returnObject) {
            id = value?._id;
        } else {
            id = value;
        }
        let item = await auth.client.FindOne<any>({
            collectionname,
            query: { _id: id },
            jwt: auth.access_token,
        });
        if (item != null) {
            return "(" + item._type + ") " + item.name;
        }
        return "Select Entitiy";
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
        });
    }
    let isOpen = $state(false);
    function closeAndRefocusTrigger() {
        isOpen = false;
    }
</script>

<Popover.Root bind:open={isOpen} {...restProps}>
    <Popover.Trigger
        disabled={loading}
        class={" dark:bg-bw1000 flex items-center justify-between border rounded-[10px] px-2 dark:border-bw600 dark:text-bw500 min-w-[260px] dark:hover:bg-bw700 dark:hover:border-bw500 "}
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
                placeholder="Search entity..."
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
                            closeAndRefocusTrigger();
                        }}
                        value={item._id}
                        class="text-sm"
                    >
                        ({item._type}) {item.name}
                    </Command.Item>
                {/each}
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
