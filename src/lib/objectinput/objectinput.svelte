<script lang="ts">
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    let { value = $bindable(), disabled = false, ...restProps } = $props();

    let json = JSON.stringify(value, null, 2);
    let intermediateJson = $state(json);
    let errormessage = $state("");

    $effect(() => {
        errormessage = "";
        const testjson = JSON.stringify(value, null, 2);
        if (testjson !== json) {
            // External changes detected
            json = testjson;
            intermediateJson = json;
        } else if (intermediateJson !== json) {
            // Internal changes detected
            try {
                value = JSON.parse(intermediateJson);
                json = testjson; // Sync `json` after successful parse
                errormessage = "";
            } catch (error: any) {
                errormessage = error.message;
            }
        }
    });
</script>

<Textarea {disabled} bind:value={intermediateJson} {...restProps}></Textarea>
{#if errormessage}
    <div class="text-red-500">{errormessage}</div>
{/if}
