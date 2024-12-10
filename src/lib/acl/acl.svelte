<script lang="ts">
    import { Ace } from "./index.js";
    let { value = $bindable(null) } = $props();
</script>

{#each value._acl as ace, i}
<Ace bind:value={value._acl[i]} />
{/each}
