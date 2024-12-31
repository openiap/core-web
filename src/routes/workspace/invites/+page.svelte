<script lang="ts" module>
  export let page = "invites";
  export let collectionname = "users";
  export let basequery = {
    _type: "member",
    status: { $in: ["pending", "rejected"] },
  };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Plus } from "lucide-svelte";

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

  function single_item_click(item: any) {
    goto(base + `/workspace/${item.workspaceid}/accept/${item.token}`);
  }
</script>

<Hotkeybutton
  class="mb-4"
  aria-label="Add workspace"
  variant="default"
  onclick={() => goto(base + `/${page}/new`)}
>
  <Plus />
  Add {page}</Hotkeybutton
>
<Searchinput bind:searchstring />

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  multi_select={false}
  {single_item_click}
  bind:selected_items
  bind:entities
></Entities>
