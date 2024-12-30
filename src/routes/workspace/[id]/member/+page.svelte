<script lang="ts" module>
  export let page = "member";
  export let collectionname = "users";
</script>

<script lang="ts">
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Entities } from "$lib/entities/index.js";
  import { Pencil, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import { data as data1 } from "$lib/entities/data.svelte.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let query = {
    _type: "member",
    workspaceid: data.id,
    status: { $ne: "rejected" },
  };

  usersettings.loadpage(data.settings);

  let searchstring = $state(data.searchstring);
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
      entities = await data1.GetData(page, collectionname, query);
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
        entities = await data1.GetData(page, collectionname, query);
      }
      selected_items = [];
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error:any) {
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
      } catch (error:any) {
        toast.error("Error while updating", {
          description: error.message,
        });        
      }
      // Run again to "reset"
      entities = await data1.GetData(page, collectionname, query);
    }}>
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
