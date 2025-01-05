<script lang="ts">
    // import { Formio, FormBuilder } from 'formiojs';
    import { base } from "$app/paths";
    // import 'formiojs/dist/formio.builder.min.css';
    import { onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { Input } from "$lib/components/ui/input";
    import Button from "$lib/components/ui/button/button.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    const { data } = $props();

    let builder: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    async function createfrom() {
        try {
            // @ts-ignore
            if (Formio == null || typeof Formio.builder !== "function") {
                console.log("Formio not loaded, try again in 200ms");
                setTimeout(() => {
                    createfrom();
                }, 200);
                return;
            }
        } catch (error) {
            console.log("Formio not loaded, try again in 200ms");
            setTimeout(() => {
                createfrom();
            }, 200);
            return;
        }

        try {
            // builder = await Formio.createForm(ref, data.item.schema, {
            // @ts-ignore
            builder = await Formio.builder(ref, data.item.schema, {
                builder: {
                    basic: false,
                    advanced: false,
                    data: {
                        display: "form",
                        components: [],
                    },
                },
            });
        } catch (e) {
            console.log(e);
        }
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (ref != null &&
                data.item.schema.components.length > 0 &&
                firstrun == true
            ) {
                console.log("calling createfrom()");
                createfrom();
                firstrun = false;
            }
        });
        onDestroy(() => {
            try {
                builder.destroy();
            } catch (e) {}
        });
    }

    async function saveform() {
        message = "";
        if (data.item.name == "") {
            message = "Please enter form name";
            return;
        }
        // @ts-ignore
        data.item.components = builder.schema;

        try {
            const result = await auth.client.UpdateOne({
                collectionname: "forms",
                item: { ...data.item, _type: "form" },
                jwt: auth.access_token,
            });
            toast.success("Form created");
            goto(base + `/form`);
        } catch (error: any) {
            message = error.message;
            toast.error("Error", {
                description: error.message,
            });
        } finally {
        }
    }
</script>

<svelte:head>
    <script src="{base}/formio.full.min.js"></script>
    <link rel="stylesheet" href="{base}/formio.form.min.css" />
    <link rel="stylesheet" href="{base}/bootstrap-scope.css" />
</svelte:head>
<div>
    {message}
</div>
<div>
    {#if data && data.item && data.item.name}
        <Input
            type="text"
            placeholder="Enter form name"
            bind:value={data.item.name}
        />
    {/if}
    <Button onclick={saveform}>Update form</Button>
    <div class="bootstrap-scope" bind:this={ref}></div>
</div>
