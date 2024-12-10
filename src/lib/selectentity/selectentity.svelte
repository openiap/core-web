<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    let { value = $bindable(), ...restProps } = $props();

    let base:any = $state(null);
    const triggerContent = $derived(async () => {
        let item = await auth.client.FindOne<any>({collectionname: "users", query: {_id: value}, jwt: auth.access_token});
        if(item != null) {
            return item.name;
        }
        return "Select one";
    });
    const entities = $derived(async () => {
        let result:any[] = [];
        if(base == null && value != null) {
            base = await auth.client.FindOne({collectionname: "users", query: {_id: value}, jwt: auth.access_token});
        }
        result = await auth.client.Query({collectionname: "users", query: {_id: value}, jwt: auth.access_token});
        console.log("entities", result);
        return result;
    });
</script>

<Select.Root type="single" {...restProps} bind:value>
    <Select.Trigger>
        {#await triggerContent()}
            Loading...
        {:then triggerContent}
            {triggerContent}
        {/await}
    </Select.Trigger>
    <Select.Content>
        {#await entities()}
            <Select.Item value="">Loading...</Select.Item>
        {:then entities}
            {#each entities as item}
                <Select.Item value={item._id}>({item._type}){item.name}</Select.Item>
            {/each}
        {/await}
    </Select.Content>
</Select.Root>
