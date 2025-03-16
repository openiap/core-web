<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ArrowLeft } from "lucide-svelte";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
    import { toast } from "svelte-sonner";

  const { data } = $props();
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
  });
  const { form: formData, message } = form;
  try {
    formData.set(data.item);
  } catch (error: any) {
    toast.error("Error while enhancing", {
      description: error.message,
    });
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="font-bold mb-4">View Mail History</div>

<div>
  <HotkeyButton
    class="mb-4"
    aria-label="Back"
    onclick={() => goto(base + `/mailhistory`)}
  >
    <ArrowLeft />
    Back</HotkeyButton
  >

  <div class="mb-4">
    <div class="font-bold">Name</div>
    <div>{data.item.name}</div>
  </div>

  <div class="flex items-center space-x-2 mb-4">
    <Switch disabled checked={data.item.readcount} />
    <div class="space-y-1 leading-none">
      <div>{data.item.readcount ? "Read" : "Unread"}</div>
    </div>
  </div>

  <table class="mb-4">
    <thead>
      <tr>
        <th>No.</th>
        <th>Dates</th>
        <th>Domain</th>
        <th>Agent</th>
      </tr>
    </thead>
    <tbody>
      {#if data.item.opened.length > 0}
        {#each data.item.opened as item, index}
          <tr>
            <td>
              {index + 1}
            </td>
            <td>{item.dt}</td>
            <td>{item.domain}</td>
            <td>{item.agent}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<CustomSuperDebug {formData} />
