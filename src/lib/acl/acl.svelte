<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
    import { EntitySelector } from "$lib/entityselector/index.js";
    import { auth } from "$lib/stores/auth.svelte.js";
    import {
        ChevronDown,
        ChevronUp,
        ListCheck,
        SquarePlus,
        Trash2,
    } from "lucide-svelte";
    import { Ace } from "./index.js";
    import { toast } from "svelte-sonner";

    let {
        class: className = "mb-10",
        value = $bindable(null),
        open = $bindable(null),
        loading = false,
    } = $props();
    let newid = $state("");

    async function addace(id: string) {
        if (value._acl == null) {
            value._acl = [];
        }
        var item = await auth.client.FindOne<any>({
            collectionname: "users",
            query: { _id: id },
            jwt: auth.access_token,
        });
        const exists = value._acl.some((ace: any) => ace._id === item._id);
        if (!exists) {
            value._acl = [
                ...value._acl,
                { _id: item._id, name: item.name, rights: 65535 },
            ];
        } else {
            toast.error("Role already exists in ACL");
        }
        newid = "";
    }
    // Not sure why this is here
    // $effect(() => {
    //     if (newid != "") {
    //         addace(newid);
    //         newid = "";
    //     }
    // });
</script>

<Accordion.Root
    type="single"
    class={`w-full ${open ? " border rounded-[10px] dark:border-bw600 dark:bg-bw850 dark:text-bw100" : ""}` +
        " " +
        className}
    value={open}
>
    <Accordion.Item value="item-1" class="border-0 p-0 m-0">
        <Hotkeybutton
            aria-label="Access Control List"
            class={open == "item-1"
                ? "flex items-center justify-between space-x-2 w-full border-0"
                : "max-w-52 dark:hover:bg-bw700 dark:hover:border-bw500"}
            variant="base"
            size="base"
            onclick={() => {
                if (open == "item-1") {
                    open = "";
                } else {
                    open = "item-1";
                }
            }}
        >
            <div class="flex items-center space-x-2">
                <ListCheck class="w-4 h-4" />
                <span> Access Control List </span>
            </div>
            {#if open == "item-1"}
                <ChevronUp class="w-4 h-4" />
            {:else}
                <ChevronDown class="w-4 h-4" />
            {/if}
        </Hotkeybutton>
        <Accordion.Content class="px-2.5 border-0 py-1">
            {#each value._acl as ace, i}
                <div
                    class="flex flex-col lg:flex-row items-center justify-between border dark:border-bw600 dark:bg-bw1000 p-0.75 rounded-lg my-1.5"
                >
                    <Ace bind:value={value._acl[i]} {loading} />
                    <Hotkeybutton
                        aria-label="Delete"
                        disabled={loading}
                        class="ml-2.5 m-1"
                        variant="danger"
                        size="base"
                        onclick={() => {
                            value._acl.splice(i, 1);
                            if (value._acl.length == 0) {
                                delete value._acl;
                            }
                            value = { ...value };
                        }}
                    >
                        <Trash2 class="w-4 h-4" />
                        Delete</Hotkeybutton
                    >
                </div>
            {/each}
            <div class={"flex space-x-4 mt-4"}>
                <EntitySelector
                    bind:value={newid}
                    collectionname="users"
                    {loading}
                ></EntitySelector>
                <Hotkeybutton
                    aria-label="Add"
                    disabled={loading}
                    variant="success"
                    size="base"
                    onclick={() => {
                        addace(newid);
                    }}
                >
                    <SquarePlus class="w-4 h-4" />
                    Add
                </Hotkeybutton>
            </div>
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>
