<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { CustomInput } from "$lib/custominput";
    import { CustomSelect } from "$lib/customselect";
    import { CustomSuperDebug } from "$lib/customsuperdebug";
    import Entityselector from "$lib/entityselector/entityselector.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { usersettings } from "$lib/stores/usersettings.svelte";
    import { json } from "@sveltejs/kit";
    import { mode } from "mode-watcher";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

    const { data } = $props();

    let item = $state(data.item);
    let message = $state("");
    let loading = $state(false);
    let robot = $state("");
    let queuename = "";

    async function init() {
        if (!browser) return;
        queuename = await auth.client.RegisterQueue(
            { queuename: "", jwt: auth.access_token },
            async (msg, payload, user, jwt) => {
                console.log("payload", payload);
                if (payload == null) return;
                if (payload.command == "invokecompleted") {
                    let keys = Object.keys(payload.data);
                    keys.forEach((key) => {
                        let param = item.Parameters.find((x) => x.name == key);
                        console.log("key param ", key, param, payload.data[key]);
                        if (param) {
                            param.value = payload.data[key];
                        }
                    });
                    item = item;
                }
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
        } catch (e) {}
    });

    function beforeSubmit(submission: any, next: any) {
        next();
    }
</script>

<svelte:head>
    <link
        rel="stylesheet"
        href="{base}/font-awesome/css/font-awesome.min.css"
    />
</svelte:head>
<div>
    {message}
</div>
<div>
    <Entityselector
        queryas={usersettings.currentworkspace}
        width="md:w-fit w-64"
        class="mb-4 md:mb-0"
        disabled={loading}
        collectionname="users"
        basefilter={{ _type: "user", _rpaheartbeat: { $exists: true } }}
        bind:value={robot}
    />
    {#each item.Parameters as param}
        <div>
            {param?.name}
        </div>
        <CustomInput
            bind:value={param.value}
            label={param.name}
            type={param.type}
        />
    {/each}
    <!-- <CustomInput
    bind:value={queueText}
    > -->

    <!-- </CustomInput> -->
    <HotkeyButton
        onclick={async () => {
            let payload: any = {};

            item.Parameters.forEach((param: any) => {
                payload[param.name] = param.value;
            });
            // var keys = Object.keys(this.arguments);
            // for (let i = 0; i < keys.length; i++) {
            //     const key = keys[i];
            //     const param = this.model.Parameters.find((x) => x.name == key);
            //     if (param && param.type == "System.String")
            //         this.arguments[key] = this.arguments[key] ?? "";
            //     if (param && param.type == "System.Int32")
            //         this.arguments[key] = parseInt(this.arguments[key]);
            //     if (param && param.type == "System.Boolean")
            //         this.arguments[key] = this.parseBoolean(
            //             this.arguments[key],
            //         );
            //     if (param && param.type == "System.DateTime") {
            //         if (
            //             this.arguments[key] != null &&
            //             this.arguments[key] != ""
            //         ) {
            //             this.arguments[key] = new Date(
            //                 this.arguments[key],
            //             ).toISOString();
            //         } else {
            //             this.arguments[key] = undefined;
            //         }
            //     }
            //     if (
            //         param &&
            //         param.type == "System.String[]" &&
            //         Array.isArray(this.arguments[key]) == false
            //     ) {
            //         var arr = this.arguments[key].split(",");
            //         this.arguments[key] = arr;
            //     }
            //     if (
            //         param &&
            //         param.type == "System.Int32[]" &&
            //         Array.isArray(this.arguments[key]) == false
            //     ) {
            //         var arr = this.arguments[key].split(",");
            //         arr = arr.map((x) => parseInt(x));
            //         this.arguments[key] = arr;
            //     }
            //     if (
            //         param &&
            //         param.type == "System.Boolean[]" &&
            //         Array.isArray(this.arguments[key]) == false
            //     ) {
            //         var arr = this.arguments[key].split(",");
            //         arr = arr.map((x) => this.parseBoolean(x));
            //         this.arguments[key] = arr;
            //     }
            //     if (
            //         param &&
            //         param.type == "System.DateTime[]" &&
            //         Array.isArray(this.arguments[key]) == false
            //     ) {
            //         var arr = this.arguments[key].split(",");
            //         arr = arr.map((x) => new Date(x).toISOString());
            //         this.arguments[key] = arr;
            //     }
            //     console.log(key, this.arguments[key]);
            // }
            // const rpacommand = {
            //     command: "invoke",
            //     workflowid: this.model._id,
            //     data: { ...this.arguments },
            // };
            // for (let i = 0; i < keys.length; i++) {
            //     const key = keys[i];
            //     const param = this.model.Parameters.find((x) => x.name == key);
            //     // console.log(key, this.arguments[key])
            //     if (
            //         param &&
            //         param.type == "System.String[]" &&
            //         Array.isArray(this.arguments[key]) == true
            //     ) {
            //         this.arguments[key] = this.arguments[key].join(",");
            //     }
            //     if (
            //         param &&
            //         param.type == "System.Int32[]" &&
            //         Array.isArray(this.arguments[key]) == true
            //     ) {
            //         this.arguments[key] = this.arguments[key].join(",");
            //     }
            //     if (
            //         param &&
            //         param.type == "System.Boolean[]" &&
            //         Array.isArray(this.arguments[key]) == true
            //     ) {
            //         this.arguments[key] = this.arguments[key].join(",");
            //     }
            //     if (
            //         param &&
            //         param.type == "System.DateTime[]" &&
            //         Array.isArray(this.arguments[key]) == true
            //     ) {
            //         this.arguments[key] = this.arguments[key].join(",");
            //     }
            //     console.log(key, this.arguments[key]);
            // }
            // const result: any = await NoderedUtil.Queue({
            //     queuename: this.user._id,
            //     replyto: this.queuename,
            //     data: rpacommand,
            //     expiration: parseInt(this.timeout),
            //     striptoken: true,
            // });

            const rpacommand = {
                command: "invoke",
                workflowid: data.id,
                data: payload,
            };
            console.log(JSON.stringify(rpacommand));

            await auth.client.QueueMessage({
                queuename: robot,
                data: rpacommand,
                replyto: queuename,
                jwt: auth.access_token,
            });
        }}
        aria-label="Submit">Submit</HotkeyButton
    >
</div>

<CustomSuperDebug formData={item} />
