<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import posthog from "posthog-js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { toast } from "svelte-sonner";
  import { superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { memberSchema } from "../../../schema.js";

  const { data } = $props();
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(memberSchema),
  });
  const { form: formData, enhance, message } = form;

  async function accept() {
    try {
      if (
        // guest user
        $formData.userid != "65cb30c40ff51e174095573c" && 
        auth.isAuthenticated == false
      ) {
        window.localStorage.setItem("redirect", window.location.pathname);
        auth.login();
        return;
      }
      await auth.client.CustomCommand({
        command: "acceptinvite",
        data: JSON.stringify($formData),
        jwt: auth.access_token,
      });
      toast.success("Accepted successfully", {
        description: "",
      });
      usersettings.currentworkspace = $formData.workspaceid;
      if(usersettings.currentworkspace != null && usersettings.currentworkspace != "") {
        try {
          posthog.group("workspace", usersettings.currentworkspace);
        } catch (error) {
        }
      }
      usersettings.persist();
      goto(base + `/workspace/${$formData.workspaceid}/member`);
    } catch (error: any) {
      toast.error("Error while accepting", {
        description: error.message,
      });
    }
  }
  async function decline() {
    try {
      await auth.client.CustomCommand({
        command: "declineinvite",
        data: JSON.stringify($formData),
        jwt: auth.access_token,
      });
      toast.error("Declined successfully", {
        description: "",
      });
      goto(base + `/workspace/${$formData.workspaceid}/member`);
    } catch (error: any) {
      toast.error("Error while declining", {
        description: error.message,
      });
    }
  }
  let status = $page.status;
</script>

{#if $message}
  <div class:success={status == 200} class:error={status >= 400}>
    {$message}
  </div>
{/if}
{#if $formData.workspacename}
  <form method="POST" use:enhance>
    {#if $formData.status == "pending"}
      {$formData.invitedbyname} has invited you to join {$formData.workspacename}.<br
      />
      <br />
      <Button variant="outline" onclick={accept}>Accept</Button>
      <Button variant="outline" onclick={decline}>Decline</Button>
    {:else if $formData.status == "accepted"}
      You have accepted the invitation to join {$formData.workspacename}.<br />
    {:else if $formData.status == "rejected"}
      You have declined the invitation to join {$formData.workspacename}.<br />
      <Button variant="outline" onclick={accept}>Accept</Button>
    {/if}
  </form>
{/if}
<CustomSuperDebug {formData} />
