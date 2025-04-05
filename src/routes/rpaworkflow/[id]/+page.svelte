<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { CustomInput } from "$lib/custominput";
    import { CustomSuperDebug } from "$lib/customsuperdebug";
    import { CustomSwitch } from "$lib/customswitch/index.js";
    import Entityselector from "$lib/entityselector/entityselector.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { usersettings } from "$lib/stores/usersettings.svelte";
    import { onDestroy } from "svelte";
    import { toast } from "svelte-sonner";

    const { data } = $props();
    if (data.item == null) {
        goto(base + "/rpaworkflow");
    }
    if (data.item.Parameters == null) {
        data.item.Parameters = [];
    }

    let item = $state(data.item);
    let message = $state("");
    let loading = $state(false);
    let output = $state("");
    let robot = $state(data.item._createdbyid);
    let queuename = "";

    async function init() {
        if (!browser) return;
        queuename = await auth.client.RegisterQueue(
            { queuename: "", jwt: auth.access_token },
            async (msg, payload, user, jwt) => {
                if (payload == null) return;

                if (payload.command == "timeout") {
                    loading = false;
                    output = payload.command + "\n" + output;
                } else if (payload.command == "invokefailed") {
                    loading = false;
                    if (payload && payload.data && payload.data.Message) {
                        output =
                            payload.command +
                            ": " +
                            payload.data.Message +
                            "\n" +
                            output;
                    } else {
                        output =
                            payload.command +
                            ": " +
                            JSON.stringify(payload) +
                            "\n" +
                            output;
                    }
                } else if (payload.command == "error") {
                    loading = false;
                    if (payload && payload.data && payload.data.Message) {
                        output =
                            payload.command +
                            ": " +
                            payload.data.Message +
                            "\n" +
                            output;
                    } else {
                        output =
                            payload.command +
                            ": " +
                            JSON.stringify(payload) +
                            "\n" +
                            output;
                    }
                } else if (payload.command == "invokecompleted") {
                    loading = false;
                    output = payload.command + "\n" + output;
                    let keys = Object.keys(payload.data);
                    keys.forEach((key) => {
                        let param = item.Parameters.find((x) => x.name == key);
                        if (param) {
                            param.value = payload.data[key];
                        }
                    });
                    item = item;
                } else {
                    loading = true;
                    output = payload.command + "\n" + output;
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
    function parseBoolean(s: any): boolean {
        let val: string;
        if (typeof s === "number") {
            val = s.toString();
        } else if (typeof s === "string") {
            val = s.toLowerCase().trim();
        } else if (typeof s === "boolean") {
            val = s.toString();
        } else {
            throw new Error("Unknown type!");
        }
        switch (val) {
            case "true":
            case "yes":
            case "1":
                return true;
            case "false":
            case "no":
            case "0":
            case null:
                return false;
            default:
                return Boolean(s);
        }
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
<div class="mb-10">
    <Entityselector
        queryas={usersettings.currentworkspace}
        width="md:w-fit w-64"
        class="mb-10"
        disabled={loading}
        collectionname="users"
        basefilter={{ _type: "user", _rpaheartbeat: { $exists: true } }}
        bind:value={robot}
        name="Robot"
        propertyname="_id"
    >
        {#snippet rendername(item: any)}
            {item.name}
        {/snippet}
        {#snippet rendercontent(item: any)}
            {#if item == null}
                Filter by project
            {:else}
                {item.name}
            {/if}
        {/snippet}</Entityselector
    >
    {#each item.Parameters as param}
        <div class="mb-2">
            {param?.name} : {#if param != null && param.value != null && param.value.indexOf && param.value.indexOf("[]")}comma
                seperated list of
            {/if}
            {param?.type}
        </div>
        {#if param?.type == "System.Boolean"}
            <CustomSwitch
                class="mb-10"
                disabled={loading}
                bind:checked={param.value}
                aria-readonly
            />
            <span> {param.value ? "On" : "Off"} </span><br />
        {:else if param?.type == "System.Int32"}
            <CustomInput
                class="mb-10"
                bind:value={param.value}
                label={param.name}
                type="number"
            />
        {:else}
            <CustomInput
                class="mb-10"
                bind:value={param.value}
                label={param.name}
                type={param.type}
            />
        {/if}
    {/each}
    <HotkeyButton
        data-shortcut="enter,ctrl+s"
        disabled={loading || robot == ""}
        onclick={async () => {
            try {
                let payload: any = {};

                item.Parameters.forEach((param: any) => {
                    payload[param.name] = param.value;
                });
                for (let i = 0; i < item.Parameters.length; i++) {
                    const key = item.Parameters[i].name;
                    const param = item.Parameters[i];
                    if (param && param.type == "System.String")
                        payload[key] = payload[key] ?? "";
                    if (param && param.type == "System.Int32")
                        payload[key] = parseInt(payload[key]);
                    if (param && param.type == "System.Boolean")
                        payload[key] = parseBoolean(payload[key]);
                    if (param && param.type == "System.DateTime") {
                        if (payload[key] != null && payload[key] != "") {
                            payload[key] = new Date(payload[key]).toISOString();
                        } else {
                            payload[key] = undefined;
                        }
                    }
                    if (
                        param &&
                        param.type == "System.String[]" &&
                        Array.isArray(payload[key]) == false
                    ) {
                        var arr = payload[key].split(",");
                        payload[key] = arr;
                    }
                    if (
                        param &&
                        param.type == "System.Int32[]" &&
                        Array.isArray(payload[key]) == false
                    ) {
                        let arr = payload[key].split(",");
                        arr = arr.map((x: any) => parseInt(x));
                        payload[key] = arr;
                    }
                    if (
                        param &&
                        param.type == "System.Boolean[]" &&
                        Array.isArray(payload[key]) == false
                    ) {
                        let arr = payload[key].split(",");
                        arr = arr.map((x: any) => parseBoolean(x));
                        payload[key] = arr;
                    }
                    if (
                        param &&
                        param.type == "System.DateTime[]" &&
                        Array.isArray(payload[key]) == false
                    ) {
                        let arr = payload[key].split(",");
                        arr = arr.map((x: any) => new Date(x).toISOString());
                        payload[key] = arr;
                    }
                }

                const rpacommand = {
                    command: "invoke",
                    workflowid: data.id,
                    data: payload,
                };
                await auth.client.QueueMessage({
                    queuename: robot,
                    data: rpacommand,
                    replyto: queuename,
                    striptoken: true,
                    jwt: auth.access_token,
                });
            } catch (error: any) {
                toast.error("Error sending message to robot", {
                    description: error.message,
                });
            }
        }}
        aria-label="Submit">Submit</HotkeyButton
    >
</div>
<pre>{output}</pre>
<CustomSuperDebug formData={item} />
