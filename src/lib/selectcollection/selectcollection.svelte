<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    let { value = $bindable(), ...restProps } = $props();

    
    let collections: string[] = $state([]);
    const triggerContent = $derived(() => collections.find((item: any) => item === value) ?? "Select a collection");
    async function getData() {
        collections = (await auth.client.ListCollections()).map(
            (col) => col.name,
        );
    }
    $effect(() => {
        getData();
        console.log("value", value);
    });
</script>

<Select.Root type="single" {...restProps} bind:value>
    <Select.Trigger>{triggerContent()}</Select.Trigger>
    <Select.Content>
        {#each collections as collection}
            <Select.Item value={collection}>{collection}</Select.Item>
        {/each}
    </Select.Content>
</Select.Root>
