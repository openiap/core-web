<script lang="ts" module>
  export let page = "member";
  export let collectionname = "users";
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { data as data1 } from "$lib/entities/data.svelte.js";
  import { toast } from "svelte-sonner";
  import Search from "$lib/search/search.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { readonly } from "svelte/store";
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      <!-- <Input type="text" bind:value={item.token} readonly onclick={()=> { copylink(item.workspaceid, item.token)}} /> -->
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
  {#snippet action(item: any)}
    <Button
      aria-label="Edit"
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
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
