<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    let { value = $bindable(), ...restProps } = $props();

    let collections: string[] = $state([]);
    const triggerContent = $derived(
        () =>
            collections.find((item: any) => item === value) ??
            "Select a collection",
    );
    async function getData() {
        collections = (await auth.client.ListCollections({jwt: auth.access_token})).map(
            (col) => col.name,
        );
    }
    $effect(() => {
        getData();
    });
</script>

<Select.Root type="single" {...restProps} bind:value>
    <Select.Trigger
        class="h-8 w-64 py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw400 dark:bg-bw800 focus:outline-none"
        >{triggerContent()}</Select.Trigger
    >
    <Select.Content
        class="dark:bg-bw850 border dark:border-bw600 dark:text-bw100"
    >
        {#each collections as collection}
            <Select.Item
                class={` ${value === collection && "border dark:border-bw600 dark:bg-bw700 "} rounded-[10px] dark:text-bw100`}
                value={collection}>{collection}</Select.Item
            >
        {/each}
    </Select.Content>
</Select.Root>
