<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import {
    HotkeyButton,
    buttonVariants,
  } from "$lib/components/ui/hotkeybutton/index.js";
  import Label from "$lib/components/ui/label/label.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { EntitySelector } from "$lib/entityselector";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { StatusCard } from "$lib/statuscard/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import {
    Box,
    Check,
    Filter,
    HandHelping,
    Pencil,
    Rows2,
    SquarePlus,
    SquareStack,
    Trash2,
    VenetianMask,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let query = $state({});

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let queue: any = $state("");
  let filter = $state(false);
  let filterby: "all" | "new" | "successful" | "failed" | "processing" = "all";

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname: "workitems",
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      selected_items = selected_items.filter((i) => i !== item._id);
      ref.reload();
    } else {
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/workitem/edit/${item._id}`);
  }
  async function GetData() {
    try {
      if (filterby == "all") {
        // @ts-ignore
        delete query.state;
      } else {
        // @ts-ignore
        query.state = filterby;
      }
      entities = await datacomponent.GetData(
        data.page,
        "workitems",
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error getting data", {
        description: error.message,
      });
    }
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      await GetData();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function filterData() {
    // sveltepage.url.pathname = base + `/${page}/${queue}`;
    // replaceState(sveltepage.url, sveltepage.state);

    query = { ...query, wiqid: queue };
    if (queue) {
      await GetData();
    }
  }
</script>

<div class="lg:flex lg:justify-between mb-2 md:mb-4">
  <div
    class="flex flex-col w-full xl:flex-row xl:space-x-5 space-y-4 xl:space-y-0 mb-4 lg:mb-0"
  >
  <div class="flex flex-col md:flex-row md:space-x-5 space-y-4 md:space-y-0">

    <SearchInput bind:searchstring />
    <EntitySelector
      class="w-full xl:w-[284px]"
      height="h-7"
      collectionname="mq"
      bind:value={queue}
      basefilter={{ _type: "workitemqueue" }}
      handleChangeFunction={() => goto(base + `/workitem/${queue}`)}
      name="Queue"
    />
  </div>
    <div class="w-fit">
      <Popover.Root open={filter}>
        <Popover.Trigger
          disabled={loading}
          class={buttonVariants({ variant: "base", size: "sm" }) +
            " border-dashed w-full"}
          ><Filter />
          Filter</Popover.Trigger
        >
        <Popover.Content class="w-fit bg-bw50 dark:bg-popover py-2 px-1">
          <RadioGroup.Root value="All" class="flex flex-col">
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <Rows2 class="h-4 w-4" />
                <Label for="r1" class="cursor-pointer">All</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="All"
                id="r1"
                disabled={loading}
                onclick={async () => {
                  filterby = "all";
                  await GetData();
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <VenetianMask class="h-4 w-4" />
                <Label for="r2" class="cursor-pointer">New</Label>
              </div>

              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="new"
                id="r2"
                disabled={loading}
                onclick={async () => {
                  filterby = "new";
                  await GetData();
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <SquareStack class="h-4 w-4" />
                <Label for="r3" class="cursor-pointer">Successful</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="successful"
                id="r3"
                disabled={loading}
                onclick={async () => {
                  filterby = "successful";
                  await GetData();
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <Box class="h-4 w-4" />
                <Label for="r4" class="cursor-pointer">Failed</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="failed"
                id="r4"
                disabled={loading}
                onclick={async () => {
                  filterby = "failed";
                  await GetData();
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2 space-x-20">
              <div class="flex items-center space-x-2 w-full">
                <HandHelping class="h-4 w-4" />
                <Label for="r5" class="cursor-pointer">Processing</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="processing"
                id="r5"
                disabled={loading}
                onclick={async () => {
                  filterby = "processing";
                  await GetData();
                }}
              />
            </div>
            <Separator />
            <div class="flex items-center px-2">
              <div class="flex items-center space-x-2 w-full">
                <!-- <Label for="r1" class="cursor-pointer">Apply filter</Label> -->
                <Check class="h-4 w-4" />
                <HotkeyButton
                  size="ghost"
                  onclick={async () => {
                    await GetData();
                  }}
                  aria-label="Apply filter"
                  class="m-0 p-0"
                  variant="ghostfull"
                >
                  Apply filter
                </HotkeyButton>
              </div>
            </div>
          </RadioGroup.Root>
        </Popover.Content>
      </Popover.Root>
    </div>
  </div>
  <div>
    <HotkeyButton
      title="Create Work Item (Insert Key)"
      data-shortcut="ins"
      size="sm"
      variant="base"
      disabled={loading}
      aria-label="Create Work Item"
      onclick={() => {
        loading = true;
        goto(base + `/workitem/new/${queue ? queue : "new"}`);
      }}
    >
      <SquarePlus />
      Create Work Item</HotkeyButton
    >
  </div>
</div>

<Entities
  collectionname={data.collectionname}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet wiq(item: any)}
    <HotkeyButton
      class="hover:underline"
      variant="ghostfull"
      size="ghost"
      onclick={() => goto(base + `/workitem/${item.wiqid}`)}
    >
      {item.wiq}
    </HotkeyButton>
  {/snippet}

  {#snippet state(item: any)}
    {#if item != null && item.state != null && item.state != ""}
      <StatusCard bind:title={item.state as string} />
    {:else}
      <StatusCard title="Unknown" />
    {/if}
  {/snippet}
  {#snippet errortype(item: any)}
    {#if item != null && item.errortype != null && item.errortype != ""}
      <StatusCard bind:title={item.errortype as string} />
    {:else}
      <StatusCard title="No error" />
    {/if}
  {/snippet}
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2">
      <HotkeyButton
        aria-label="Edit"
        disabled={loading}
        onclick={() => single_item_click(item)}
        size="tableicon"
        variant="icon"
      >
        <Pencil />
      </HotkeyButton>
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
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
