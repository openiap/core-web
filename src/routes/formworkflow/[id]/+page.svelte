<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { CustomSuperDebug } from "$lib/customsuperdebug";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { Formio } from "formiojs";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

    const { data } = $props();

    let form: any = null as any;
    let ref = $state(null) as any;
    let message = $state("");
    let submitbutton = $state("");
    let queuename = "";
    async function init() {
        if (!browser) return;
        queuename = await auth.client.RegisterQueue(
            { queuename: "", jwt: auth.access_token },
            async (msg, payload, user, jwt) => {
                if (payload.state == "processing") {
                    message = "Processing . . .";
                } else {
                    message = "";
                }
                if (
                    payload.state != "" &&
                    payload.state != null &&
                    data.item.state != payload.state
                ) {
                    // toast.success(payload.state, {description: "Form changed state from " + data.item.state + " to " + payload.state , duration: 5000});
                    toast.success(payload.state, {
                        description: "Form is " + payload.state,
                        duration: 5000,
                    });
                }
                let _item = await auth.client.FindOne<any>({
                    collectionname: "workflow_instances",
                    query: { _id: payload._id },
                    jwt: auth.access_token,
                });
                if (_item == null) {
                    console.error(
                        "workflow_instances '" + payload._id + "' not found",
                    );
                    return;
                }
                data.item = _item;
                if (
                    data.item.form != data.form?._id &&
                    data.item.form != null &&
                    data.item.form != ""
                ) {
                    let _form = await auth.client.FindOne<any>({
                        collectionname: "forms",
                        query: { _id: data.item.form },
                        jwt: auth.access_token,
                    });
                    if (_form == null) {
                        console.error(
                            "Form '" + data.item.form + "' not found",
                        );
                        return;
                    }
                    data.form = _form;
                } else if (data.item.form == null || data.item.form == "") {
                    goto(base + "/");
                    return;
                }
                createfrom();
            },
        );
    }
    init();
    onDestroy(() => {
        if (queuename != null && queuename != "") {
            auth.client
                .UnRegisterQueue({ queuename, jwt: auth.access_token })
                .catch((error) => {});
        }
        try {
            if (form != null) form.destroy();
        } catch (e) {}
    });

    function beforeSubmit(submission: any, next: any) {
        next();
    }
    function traversecomponentsPostProcess(
        components: any,
        componentData: any,
    ) {
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
                        traversecomponentsPostProcess(
                            subcomponents,
                            componentData,
                        );
                    }
                }
            }
        }
    }
    function traversecomponentsMakeDefaults(components: any) {
        if (!components) return;
        for (let y = 0; y < components.length; y++) {
            const item = components[y];
            if (item.type == "datagri{ submitbutton: string; }d") {
                if (
                    data.item.payload[item.key] === null ||
                    data.item.payload[item.key] === undefined
                ) {
                    const obj: any = {};
                    for (let x = 0; x < item.components.length; x++) {
                        obj[item.components[x].key] = "";
                    }
                    data.item.payload[item.key] = [obj];
                } else {
                    if (Array.isArray(data.item.payload[item.key])) {
                    } else {
                        const keys = Object.keys(data.item.payload[item.key]);
                        const arr: any[] = [];
                        for (let x = 0; x < keys.length; x++) {
                            arr.push(data.item.payload[item.key][keys[x]]);
                        }
                        data.item.payload[item.key] = arr;
                    }
                }
            }
            if (item.type == "button" && item.action == "submit") {
                data.item.payload[item.key] = false;
            }
        }
        if (data.item.payload != null && data.item.payload != undefined) {
            if (
                data.item.payload.values != null &&
                data.item.payload.values != undefined
            ) {
                const keys = Object.keys(data.item.payload.values);
            }
        }
        if (data.item.payload != null && data.item.payload != undefined) {
            if (
                data.item.payload.values != null &&
                data.item.payload.values != undefined
            ) {
                const keys = Object.keys(data.item.payload.values);
                for (let i = 0; i < keys.length; i++) {
                    const values = data.item.payload.values[keys[i]];
                    for (let y = 0; y < components.length; y++) {
                        const item = components[y];
                        if (item.key == keys[i]) {
                            if (Array.isArray(values)) {
                                const obj2: any = {};
                                for (let x = 0; x < values.length; x++) {
                                    obj2[x] = values[x];
                                }
                                if (
                                    item.data != null &&
                                    item.data != undefined
                                ) {
                                    item.data.values = obj2;
                                    item.data.json = JSON.stringify(values);
                                } else {
                                    item.values = values;
                                }
                            } else {
                                if (
                                    item.data != null &&
                                    item.data != undefined
                                ) {
                                    item.data.values = values;
                                    item.data.json = JSON.stringify(values);
                                } else {
                                    item.values = values;
                                }
                            }
                        }
                    }
                }
            }
        }
        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "table") {
                for (let x = 0; x < item.rows.length; x++) {
                    for (let y = 0; y < item.rows[x].length; y++) {
                        const subcomponents = item.rows[x][y].components;
                        traversecomponentsMakeDefaults(subcomponents);
                    }
                }
            }
        }
    }
    function traversecomponentsAddCustomValidate(components: any) {
        if (!components) return;
        for (let y = 0; y < components.length; y++) {
            const item = components[y];
            if (item.type == "file") {
                item.storage = "url";
                item.url = "/upload";
            }
        }
    }
    async function createfrom() {
        try {
            // @ts-ignore
            if (Formio == null || typeof Formio.builder !== "function") {
                setTimeout(async () => {
                    createfrom();
                }, 200);
                return;
            }
        } catch (error) {
            setTimeout(async () => {
                createfrom();
            }, 200);
            return;
        }
        try {
            if (form != null) form.destroy();
        } catch (e) {}

        try {
            if (data.form != null && data.form.schema != null) {
                let protocol = "http:";
                if (auth.config?.wsurl.startsWith("wss")) protocol = "https:";

                traversecomponentsMakeDefaults(data.form.schema);
                traversecomponentsAddCustomValidate(data.form.schema);

                Formio.setBaseUrl(protocol + "//" + auth.config?.domain);
                Formio.setProjectUrl(protocol + "//" + auth.config?.domain);
                // @ts-ignore
                form = await Formio.createForm(ref, data.form.schema, {
                    breadcrumbSettings: { clickable: true },
                    buttonSettings: { showCancel: false },
                    readOnly: data.item.state != "idle",
                    hooks: {
                        beforeSubmit: beforeSubmit,
                        customValidation: async (
                            submission: any,
                            next: any,
                        ) => {
                            if (data.item == null) {
                                return;
                            }
                            if (data.item.payload == null) {
                                data.item.payload = { submitbutton: "" };
                            }
                            data.item.submission = submission;
                            data.item.userData = submission;
                            if (submission.data != null)
                                data.item.payload = submission.data;
                            traversecomponentsPostProcess(
                                data.form.schema.components,
                                submission.data,
                            );
                            next();
                        },
                    },
                });
                form.on("submit", async (submission: any) => {
                    await auth.client.QueueMessage({
                        queuename: data.item.queue,
                        data: data.item.payload,
                        replyto: queuename,
                        jwt: auth.access_token,
                    });
                });
                form.on("submitDone", function (submission: any) {});
                form.on("submitButton", async function (submission: any) {});
                form.on("customEvent", function (submission: any) {});
                if (
                    data.item.payload != null &&
                    data.item.payload != undefined
                ) {
                    form.submission = {
                        data: $state.snapshot(data.item.payload),
                    };
                }
                form.on("error", (error: any) => {
                    message = error.message ? error.message : error;
                    console.error(message);
                });
            } else {
                if (data.item != null) {
                    try {
                        data.item.state = "failed";
                        await auth.client.UpdateOne({
                            collectionname: "workflow_instances",
                            item: data.item,
                            jwt: auth.access_token,
                        });
                        message = "No form found, workflow marked as failed";
                    } catch (error: any) {
                        message =
                            "No form found, failed to update workflow " +
                            error.message;
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    let firstrun = $state(true);
    if (browser) {
        $effect(() => {
            if (ref != null && firstrun == true) {
                createfrom();
                // firstrun = false;
            }
        });
        createfrom();
    }
</script>

<svelte:head>
    <link
        rel="stylesheet"
        href="{base}/font-awesome/css/font-awesome.min.css"
    />
    <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
    <link rel="stylesheet" href="{base}/formio.form.min.css" />
</svelte:head>
<div>
    {message}
</div>
<div>
    <div class="bootstrap-scope formio-dialog-content" bind:this={ref}></div>
</div>

<CustomSuperDebug formData={data.item} />
<CustomSuperDebug formData={data.form} />
