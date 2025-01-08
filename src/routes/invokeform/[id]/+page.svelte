<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { Formio } from "formiojs";
    import "formiojs/dist/formio.builder.min.css";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";
    import SuperDebug from "sveltekit-superforms";

    const { data } = $props();

    let showdebug = $state(false);
    let form: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    let submitbutton = $state("");
    let queuename = "";
    async function init() {
        if(!browser) return;
        queuename = await auth.client.RegisterQueue({queuename: "", jwt: auth.access_token},
        async (msg, payload, user, jwt) => {
            console.log(msg.queuename, payload);
            if(payload.state != "" && payload.state != null && data.item.state != payload.state) {
                // toast.success(payload.state, {description: "Form changed state from " + data.item.state + " to " + payload.state , duration: 5000});
                toast.success(payload.state, {description: "Form is " + payload.state , duration: 5000});
            }
            let _item = await auth.client.FindOne<any>({collectionname: "workflow_instances", query: {_id: payload._id}, jwt: auth.access_token});
            if(_item == null) { console.error("workflow_instances '" + payload._id + "' not found"); return; }
            data.item = _item
            if(data.item.form != data.form?._id && data.item.form != null && data.item.form != "") {
                let _form = await auth.client.FindOne<any>({collectionname: "forms", query: {_id: data.item.form}, jwt: auth.access_token});
                if(_form == null) { console.error("Form '" + data.item.form + "' not found"); return; }
                data.form = _form;                
            } else if (data.item.form == null || data.item.form == "") {
                console.log("No form, go to frontpage");
                goto(base + "/");
                return;
            }
            createfrom();
        });
    }
    init();
    onDestroy(() => {
        if(queuename != null && queuename != "") {
            auth.client.UnRegisterQueue({queuename, jwt: auth.access_token}).catch((error) => {
            });
        }
        try {
            if(form != null) form.destroy();
        } catch (e) {}
    });


    function beforeSubmit(submission:any, next:any) {
        next();
    }
    function traversecomponentsPostProcess(components: any, componentData: any) {
        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "button" && item.action == "submit") {
                if (componentData[item.key] == true) {
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
                        traversecomponentsPostProcess(subcomponents, componentData);
                    }
                }
            }
        }
    }
    async function createfrom() {
        try {
            // @ts-ignore
            if (Formio == null || typeof Formio.builder !== "function") {
                setTimeout(() => {
                    createfrom();
                }, 200);
                return;
            }
        } catch (error) {
            setTimeout(() => {
                createfrom();
            }, 200);
            return;
        }
        try {
            if(form != null) form.destroy();
        } catch (e) {}

        try {
            if (data.form != null && data.form.schema != null) {
                // @ts-ignore
                form = await Formio.createForm(ref, data.form.schema, {
                    breadcrumbSettings: { clickable: true },
                    buttonSettings: { showCancel: false },
                    readOnly: (data.item.state != "idle"),
                    hooks: {
                        beforeSubmit: beforeSubmit,
                        customValidation: async (
                            submission: any,
                            next: any,
                        ) => {
                            if(data.item == null) {
                                return;
                            }
                            if(data.item.payload == null) {
                                data.item.payload = {submitbutton: ""};
                            }
                            data.item.submission = submission;
                            data.item.userData = submission;
                            if(submission.data != null) data.item.payload = submission.data;
                            traversecomponentsPostProcess(
                                data.form.schema.components,
                                submission.data,
                            );
                            next();
                        },
                    },
                });
                form.on("submit", async (submission: any) => {
                    console.log("submit", data.item.queue);
                    await auth.client.QueueMessage({queuename: data.item.queue, data: data.item.payload, replyto: queuename, jwt: auth.access_token});
                });
                form.on("submitDone", function (submission:any) {
                });
                form.on("submitButton", async function (submission:any) {

                });
                form.on("customEvent", function (submission:any) {
                });
                if (
                    data.item.payload != null &&
                    data.item.payload != undefined
                ) {
                    console.log("set form data", data.item.payload);
                    form.submission = {
                        data: $state.snapshot(data.item.payload),
                    };
                }
                form.on("error", (error: any) => {
                    message = error.message ? error.message : error;
                    console.error(message);
                });
            }
        } catch (e) {
        }
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (
                ref != null &&
                data.form != null &&
                data.form.schema != null &&
                data.form.schema.components.length > 0 &&
                firstrun == true
            ) {
                createfrom();
                firstrun = false;
            }
        });
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
    <div class="bootstrap-scope" bind:this={ref}></div>
</div>

{#if data.item != null && showdebug == true}
    <SuperDebug data={data.item} />
{/if}
{#if data.form != null && showdebug == true}
    <SuperDebug data={data.form} />
{/if}

<HotkeyButton
    hidden
    class="hidden"
    aria-label="Toggle debug"
    data-shortcut={"Control+d,Meta+d"}
    onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
