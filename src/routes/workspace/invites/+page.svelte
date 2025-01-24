<script lang="ts" module>
  export let page = "invites";
  export let collectionname = "users";
  export let basequery = {
    _type: "member",
    // status: { $in: ["pending", "rejected"] },
  };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);

  const userid = auth.profile.sub;
  const email = auth.profile.email;
  let query: any = {
    ...basequery,
    ...{ $or: [{ userid: userid }, { email: email }] },
  };
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  function single_item_click(item: any) {
    if (item.status == "accepted") {
      goto(base + `/workspace/${item.workspaceid}/member`);
      return;
    }
    goto(base + `/workspace/${item.workspaceid}/accept/${item.token}`);
  }
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
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }

  async function handleAccept() {
    try {
      await deleteitem(deleteData);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<SearchInput bind:searchstring />

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  multi_select={false}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Delete"
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="tableicon"
      variant="danger"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}</Entities
>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
