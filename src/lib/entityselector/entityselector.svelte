<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";

    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as Command from "$lib/components/ui/command/index.js";
    import { ChevronsUpDown } from "lucide-svelte";

    import { auth } from "$lib/stores/auth.svelte";
    let {
        value = $bindable(),
        collectionname = "entities",
        basefilter = {},
        returnObject = false,
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
        return "Select one";
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
    let open = $state(false);
    function closeAndRefocusTrigger() {
        open = false;
        // tick().then(() => document.getElementById(triggerId)?.focus());
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger class={buttonVariants({ variant: "outline" })}>
        {#await triggerContent()}
            Loading...
        {:then triggerContent}
            {triggerContent}
        {/await}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
