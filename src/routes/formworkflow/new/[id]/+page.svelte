<script lang="ts">
    import { base } from "$app/paths";
    import 'formiojs/dist/formio.builder.min.css';
    import { onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { data as datacomponent } from "$lib/entities/data.svelte.js";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    const { data } = $props();
    datacomponent.parsesettings(data.settings);
    let message = $state("");
    let queuename = "";
    async function init() {
        if(!browser) return;
        queuename = await auth.client.RegisterQueue({queuename: "", jwt: auth.access_token},
        (msg, payload, user, jwt) => {
            console.log(payload)
            if(payload._id != null && payload._id != "") {
                goto(base + "/formworkflow/" + payload._id);
            }
        });
        console.log("Registered temp queue as", queuename, "now, send empty message to", data.item.queue);
        await auth.client.QueueMessage({queuename: data.item.queue, data: {}, replyto: queuename, jwt: auth.access_token});
    }
    init();
    onDestroy(() => {
        if(queuename != null && queuename != "") {
            auth.client.UnRegisterQueue({queuename, jwt: auth.access_token}).catch((error) => {
            });
        }
    });
</script>
<div>
    {message}
</div>
