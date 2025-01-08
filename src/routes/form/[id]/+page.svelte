<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Input } from "$lib/components/ui/input";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { Formio } from "formiojs";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

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
            if (
                ref != null &&
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
    <link
        rel="stylesheet"
        href="{base}/font-awesome/css/font-awesome.min.css"
    />
    <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
    <link rel="stylesheet" href="{base}/formio.form.min.css" />
    <link rel="stylesheet" href="{base}/formio.builder.min.css" />
</svelte:head>
<div>
    {message}
</div>
<div>
    <div class="flex items-center justify-start space-x-4 mb-4">
        {#if data && data.item && data.item.name}
            <Input
                class="max-w-sm"
                type="text"
                placeholder="Enter form name"
                bind:value={data.item.name}
            />
        {/if}
        <Button onclick={saveform}>Update form</Button>
    </div>
    <div class="bootstrap-scope formio-dialog-content" bind:this={ref}></div>
</div>
