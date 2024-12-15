<script lang="ts" module>
  export let page = "agent";
  export let collectionname = "agents";
  export let query = { _type: "agent" };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    DollarSign,
    Pencil,
    Play,
    Square,
    Trash2,
    User,
    Webhook,
    Eye,
    Wrench,
  } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";

  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      entities = entities.filter((entity: any) => entity._id != item._id);
    } else {
      console.error(Error("deletecount is " + deletecount));
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<h1>All {page}s</h1>
<Hotkeybutton
  aria-label="add"
  title="add"
  variant={"outline"}
  onclick={() => goto(base + `/${page}/new`)}>Add {page}</Hotkeybutton
>
<Hotkeybutton
  aria-label="packages"
  title="package"
  variant={"outline"}
  onclick={() => goto(base + `/package`)}>Packages</Hotkeybutton
>
<Hotkeybutton aria-label="reload" title="reload" variant={"outline"}
  >Reload</Hotkeybutton
>

<RadioGroup.Root value="All" class="flex space-x-2 my-2">
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="All" id="r1" />
    <Label for="r1" class="cursor-pointer">All</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="Daemon" id="r2" />
    <Label for="r2" class="cursor-pointer">Daemon</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="Pods" id="r3" />
    <Label for="r3" class="cursor-pointer">Pods</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="Docker" id="r4" />
    <Label for="r4" class="cursor-pointer">Docker</Label>
  </div>
  <div class="flex items-center space-x-2">
    <RadioGroup.Item value="Assistant" id="r5" />
    <Label for="r5" class="cursor-pointer">Assistant</Label>
  </div>
</RadioGroup.Root>

<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput
      type="text"
      id="searchstring"
      placeholder="Searchstring or JSON query"
      bind:value={searchstring}
      data-shortcut={"Control+f,Meta+f"}
    />
  </div>
</div>
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
  {#snippet action(item: any)}
    <Button aria-label="start" title="start" size="icon" variant="secondary">
      <Play />
    </Button>
    <Button aria-label="stop" title="stop" size="icon" variant="secondary">
      <Square />
    </Button>
    <Button
      aria-label="run"
      title="run"
      size="icon"
      variant="secondary"
      onclick={() => goto(base + `/${page}/${item._id}/run`)}
    >
      <Wrench />
    </Button>
    <Button
      aria-label="webhook"
      title="webhook"
      size="icon"
      variant="secondary"
    >
      <Webhook />
    </Button>
    <Button
      aria-label="edit"
      title="edit"
      size="icon"
      variant="secondary"
      onclick={() => goto(base + `/${page}/${item._id}`)}
    >
      <Pencil />
    </Button>
    <Button
      aria-label="billing"
      title="billing"
      size="icon"
      variant="secondary"
    >
      <DollarSign />
    </Button>
    <Button aria-label="user" title="user" size="icon" variant="secondary">
      <User />
    </Button>
    <Button
      aria-label="delete"
      title="delete"
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
  {/snippet}
</Entities>
