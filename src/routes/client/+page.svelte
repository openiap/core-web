<script lang="ts" module>
  export let page = "client";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { MapPinHouse, User } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    if (item.user != null && item.user._id != "") {
      goto(base + `/user/${item.user._id}`);
    }
  }
  async function getData() {
    loading = true;
    try {
      entities = JSON.parse(
        await auth.client.CustomCommand({
          command: "getclients",
          jwt: auth.access_token,
        }),
      );
      data.total_count = entities.length;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    loading = false;
  }
</script>

<div class="mb-4">
  <Searchinput bind:searchstring />
</div>

<Entities
  collectionname={data.collectionname}
  bind:searchstring
  {page}
  {single_item_click}
  total_count={data.total_count}
  multi_select={false}
  bind:entities
  bind:this={ref}
  bind:loading
  custom_reload={() => {
    getData();
  }}
>
  {#snippet id(item: any)}
    <button
      type="button"
      onclick={() => single_item_click(item)}
      aria-label="View item details">{item.id}</button
    >
  {/snippet}
  {#snippet action(item: any)}
    {#if item.user != null}
      <HotkeyButton
        aria-label="Go to User"
        disabled={loading}
        onclick={() => goto(base + `/user/${item.user._id}`)}
        size="tableicon"
        variant="icon"><User /></HotkeyButton
      >
    {/if}
    <HotkeyButton
      aria-label="View on Map"
      disabled={loading}
      onclick={() => {
        window.open(
          `https://www.iplocation.net/?query=${item.remoteip}`,
          "_blank",
        );
      }}
      size="tableicon"
      variant="icon"><MapPinHouse /></HotkeyButton
    >
  {/snippet}
</Entities>
