<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import { CustomInput } from "$lib/custominput";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { Formio } from "formiojs";
    import { Check } from "lucide-svelte";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

    const { data } = $props();

    let builder: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    let loading = $state(false);

    async function createfrom() {
        loading = true;
        try {
            // @ts-ignore
            if (Formio == null || typeof Formio.builder !== "function") {
                console.log("Formio not loaded, try again in 200ms");
                setTimeout(async () => {
                    createfrom();
                }, 200);
                return;
            }
        } catch (error) {
            console.log("Formio not loaded, try again in 200ms");
            setTimeout(async () => {
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
        loading = false;
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
            <CustomInput
                class="max-w-sm"
                type="text"
                placeholder="Enter form name"
                bind:value={data.item.name}
            />
        {/if}
        <HotkeyButton
            onclick={saveform}
            variant="success"
            size="base"
            disabled={loading}
            aria-label="Update form"
            type="submit"
            data-shortcut="ctrl+s"
        >
            <Check />
            Update form</HotkeyButton
        >
    </div>
    <div class="bootstrap-scope formio-dialog-content" bind:this={ref}></div>
</div>
