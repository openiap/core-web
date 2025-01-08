<script lang="ts">
    import { Formio, FormBuilder } from 'formiojs';
    import { base } from "$app/paths";
    import 'formiojs/dist/formio.builder.min.css';
    import { onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { Input } from "$lib/components/ui/input";
    import Button from "$lib/components/ui/button/button.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import SuperDebug from 'sveltekit-superforms';

    const { data } = $props();

    let builder: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    let submitbutton = $state("");
    function beforeSubmit() {

    }
    function traversecomponentsPostProcess(components: any, data: any) {
        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "button" && item.action == "submit") {
                if (data[item.key] == true) {
                    submitbutton = item.key;
                    data.item.payload.submitbutton = item.key;
                }
            }
        }

        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "table") {
                for (let x = 0; x < item.rows.length; x++) {
                    for (let y = 0; y < item.rows[x].length; y++) {
                        const subcomponents = item.rows[x][y].components;
                        traversecomponentsPostProcess(subcomponents, data);
                    }

                }
            }
        }
    }
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
            if(data.form != null && data.form.schema != null) {
                // @ts-ignore
                builder = await createForm(ref, data.form.schema, {
                    breadcrumbSettings: { clickable: true },
                        buttonSettings: { showCancel: false },
                        hooks: {
                            beforeSubmit: beforeSubmit,
                            customValidation: async (submission:any, next:any) => {
                                // $(".alert-success").hide();
                                // setTimeout(() => {
                                //     // just to be safe
                                //     $(".alert-success").hide();
                                // }, 200);
                                data.item.submission = submission;
                                data.item.userData = submission;
                                data.item.payload = submission.data;
                                traversecomponentsPostProcess(data.form.schema.components, submission.data);
                                next();
                            }
                        }
                });
            }
        } catch (e) {
            console.log(e);
        }
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (ref != null && data.form != null && data.form.schema != null &&
                data.form.schema.components.length > 0 &&
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
    <!-- <script src="{base}/formio.full.min.js"></script>
    <link rel="stylesheet" href="{base}/formio.form.min.css" /> -->
    <link rel="stylesheet" href="{base}/bootstrap-scope.css" />
    <link rel="stylesheet" href="{base}/bootstrap-formio-dialog2.css" />
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

<SuperDebug data={data.form} />
<SuperDebug data={data.item} />