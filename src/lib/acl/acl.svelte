<script lang="ts">
    import { Ace } from "./index.js";
    import Button from "$lib/components/ui/button/button.svelte";
    import { EntitySelector } from "$lib/entityselector/index.js";
    import * as Accordion from "$lib/components/ui/accordion/index.js";

    import { auth } from "$lib/stores/auth.svelte.js";
    let { value = $bindable(null), open = $bindable(null) } = $props();
    let newid = $state("");

    async function addace(id: string) {
        var item = await auth.client.FindOne<any>({
            collectionname: "users",
            query: { _id: id },
            jwt: auth.access_token,
        });
        value._acl.push({ _id: item._id, name: item.name, rights: 65535 });
    }
    $effect(() => {
        if (newid != "") {
            addace(newid);
            newid = "";
        }
    });
</script>

<Accordion.Root type="single" class="my-2" value={open}>
    <Accordion.Item value="item-1">
        <Accordion.Trigger>Access Control List</Accordion.Trigger>
        <Accordion.Content>
            {#each value._acl as ace, i}
                <div
                    class="flex flex-row justify-between my-2 border p-2 rounded-lg"
                >
                    <Ace bind:value={value._acl[i]} />
                    <Button
                        onclick={() => {
                            value._acl.splice(i, 1);
                            value = { ...value };
                        }}>Delete</Button
                    >
                </div>
            {/each}
            <div class="flex space-x-2">
                <EntitySelector bind:value={newid} collectionname="users"
                ></EntitySelector>
                <Button
                    onclick={() => {
                        addace(newid);
                    }}
                >
                    Add
                </Button>
            </div>
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>
