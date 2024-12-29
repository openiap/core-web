<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Trash2 } from "lucide-svelte";
  import SuperDebug, { superForm } from "sveltekit-superforms";
  import { memberSchema } from "../../../schema.js";
  import { zod } from "sveltekit-superforms/adapters";
    import { Acl } from "$lib/acl/index.js";
    import { auth } from "$lib/stores/auth.svelte.js";

  const key = "workspace";
  let showdebug = $state(false);
  const { data } = $props();
  const form = superForm(data.form, {
    dataType: "json",
    validators: zod(memberSchema),
  });
  const { form: formData, enhance, message } = form;

  async function accept() {
    await auth.client.CustomCommand({ command: "acceptinvite", data: JSON.stringify($formData), jwt: auth.access_token });
    goto(base + `/${key}/${$formData.workspaceid}/member`)
  }
  async function decline() {
    await auth.client.CustomCommand({ command: "declineinvite", data: JSON.stringify($formData), jwt: auth.access_token });
    goto(base + `/${key}/${$formData.workspaceid}/member`)
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
{#if $formData.status == "pending"}
  {$formData.invitedbyname} has invited you to join {$formData.workspacename}.<br />
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

{#if formData != null && showdebug == true}
  <SuperDebug data={formData} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
