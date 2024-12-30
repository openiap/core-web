<script lang="ts" module>
  export let page = "invites";
  export let collectionname = "users";
  export let basequery = { 
    _type: "member", 
    "status": {"$in": ["pending", "rejected" ] }
    };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { data as data1 } from "$lib/entities/data.svelte.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
    import SuperDebug from "sveltekit-superforms";

  let { data } = $props();


  const userid = auth.profile.sub;
  const email = auth.profile.email;
  let query:any = {...basequery, ...{"$or": [{"userid": userid}, {"email": email}]}};
  usersettings.loadpage(data.settings);
  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  function single_item_click(item: any) {
    goto(base + `/workspace/${item.workspaceid}/accept/${item.token}`);
  }
</script>

<div class="mb-4 font-bold">All {page}s</div>
<Hotkeybutton
  class="mb-4"
  aria-label="Add workspace"
  variant="default"
  onclick={() => goto(base + `/${page}/new`)}>
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
>
</Entities>
