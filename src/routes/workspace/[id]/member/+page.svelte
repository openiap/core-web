<script lang="ts" module>
  export let page = "member";
  export let collectionname = "users";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings?.searchstring);
  let query = {
    _type: "member",
    workspaceid: data.id,
    status: { $ne: "rejected" },
  };

  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "removemember",
        id: item._id,
      });
      selected_items = selected_items.filter((i) => i !== item._id);
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function deleteitems(ids: string[]) {
    try {
      for (let id of ids) {
        await auth.client.CustomCommand({ command: "removemember", id });
        entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
      }
      selected_items = [];
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function single_item_click(item: any) {}
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function copylink(workspaceid: string, token: string) {
    const baseurl = window.location.origin;
    const url = `${baseurl}${base}/workspace/${workspaceid}/accept/${token}`;
    const el = document.createElement("textarea");
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    toast.success("Link copied to clipboard", {
      description: "",
    });
  }
</script>

<Searchinput bind:searchstring />

<HotkeyButton
  aria-label="Invite"
  onclick={() => goto(base + `/workspace/${data.id}/invite`)}
  >Invite user to workspace</HotkeyButton
>
<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  bind:selected_items
  bind:entities
>
  {#snippet status(item: any)}
    {#if item.status == "pending"}
      <Button
        aria-label="Copy"
        onclick={() => copylink(item.workspaceid, item.token)}
        variant="secondary"
      >
        Copy invite link
      </Button>
    {:else}
      <Label>{item.status}</Label>
    {/if}
  {/snippet}
  {#snippet role(item: any)}
    <select
      bind:value={item.role}
      onchange={async () => {
        try {
          await auth.client.CustomCommand({
            command: "updatemember",
            data: JSON.stringify(item),
          });
          toast.success("Updated successfully", {
            description: "",
          });
        } catch (error: any) {
          toast.error("Error while updating", {
            description: error.message,
          });
        }
        // Run again to "reset"
        entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
      }}
    >
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
  {/snippet}
  {#snippet action(item: any)}
    <Button
      aria-label="Delete"
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
