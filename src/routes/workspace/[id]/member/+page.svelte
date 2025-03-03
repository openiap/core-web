<script lang="ts" module>
  export let page = "member";
  export let collectionname = "users";
</script>

<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { CustomSelect } from "$lib/customselect";
    import { data as datacomponent } from "$lib/entities/data.svelte.js";
    import { Entities } from "$lib/entities/index.js";
    import { SearchInput } from "$lib/searchinput/index.js";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { usersettings } from "$lib/stores/usersettings.svelte.js";
    import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
    import { Trash2 } from "lucide-svelte";
    import { toast } from "svelte-sonner";

  let { data } = $props();
  $effect(() => {
    if (data.id != usersettings.currentworkspace && usersettings.currentworkspace != "") {
      goto(base + "/workspace/" + usersettings.currentworkspace + "/member");
    } else if (usersettings.currentworkspace == "") {
      goto(base + "/workspace");
    }
  });
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  usersettings.currentworkspace = data.id as any;
  let searchstring = $state(datacomponent.settings?.searchstring);
  let query = $derived(() => ({
    _type: "member",
    workspaceid: usersettings.currentworkspace,
    status: { $ne: "rejected" },
  }));

  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "removemember",
        id: item._id,
        jwt: auth.access_token,
      });
      selected_items = selected_items.filter((i) => i !== item._id);
      toast.success("Deleted successfully", {
        description: "",
      });
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function deleteitems(ids: string[]) {
    try {
      for (let id of ids) {
        await auth.client.CustomCommand({
          command: "removemember",
          id,
          jwt: auth.access_token,
        });
      }
      ref.reload();
      selected_items = [];
      toast.success("Deleted " + ids.length + " items successfully", {
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

<div class="mb-4">
  <SearchInput bind:searchstring />
</div>

<Entities
  {collectionname}
  query={query()}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet status(item: any)}
    {#if item.status == "pending"}
      <HotkeyButton
        aria-label="Copy Invite Link"
        disabled={loading}
        onclick={() => copylink(item.workspaceid, item.token)}
        size="sm"
      >
        Copy Invite Link
      </HotkeyButton>
    {:else}
      <Label>{item.status}</Label>
    {/if}
  {/snippet}
  {#snippet role(item: any)}
    <CustomSelect
    width=""
      class="h-6"
      type="single"
      bind:value={item.role}
      triggerContent={() => item.role}
      selectitems={[
        { name: "member", value: "member" },
        { name: "admin", value: "admin" },
      ]}
      onValueChangeFunction={async () => {
        try {
          await auth.client.CustomCommand({
            command: "updatemember",
            data: JSON.stringify(item),
            jwt: auth.access_token,
          });
          toast.success("Updated successfully", {
            description: "",
          });
        } catch (error: any) {
          toast.error("Error while updating", {
            description: error.message,
          });
        }
        ref.reload();
      }}
    />
  {/snippet}
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Delete"
      disabled={loading}
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="tableicon"
      variant="danger"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
