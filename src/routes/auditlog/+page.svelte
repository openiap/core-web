<script lang="ts">
  import {
    buttonVariants,
    HotkeyButton,
  } from "$lib/components/ui/hotkeybutton";
  import Label from "$lib/components/ui/label/label.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { StatusCard } from "$lib/statuscard/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import {
    BookCopy,
    Box,
    Check,
    Filter,
    HandHelping,
    LogIn,
    MapPinHouse,
    MapPinPlus,
    MapPinX,
    Rows2,
    ShieldCheck,
    ShieldMinus,
    ShieldOff,
    SquareStack,
    TriangleAlert,
    VenetianMask,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let entities = $state(data.entities);
  let filterOpen = $state(false);
  let filterby = $state("all");

  function single_item_click(item: any) {}

  async function GetData() {
    loading = true;
    try {
      let query: any = {};
      if (filterby == "all" || filterby == null || filterby == "") {
        query = {};
      } else {
        query.type = filterby;
      }

      entities = await datacomponent.GetData(
        "auditlog",
        "audit",
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error while getting data", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
</script>

<div class="lg:flex space-y-4 lg:space-y-0 mb-4 lg:space-x-5">
  <SearchInput bind:searchstring />
  <div>
    <Popover.Root open={filterOpen}>
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
              <LogIn class="h-4 w-4" />
              <Label for="r2" class="cursor-pointer">jwtsignin</Label>
            </div>

            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="jwtsignin"
              id="r2"
              disabled={loading}
              onclick={async () => {
                filterby = "jwtsignin";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2">
            <div class="flex items-center space-x-2 w-full">
              <BookCopy class="h-4 w-4" />
              <Label for="r3" class="cursor-pointer">impersonate</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="impersonate"
              id="r3"
              disabled={loading}
              onclick={async () => {
                filterby = "impersonate";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2">
            <div class="flex items-center space-x-2 w-full">
              <MapPinPlus class="h-4 w-4" />
              <Label for="r4" class="cursor-pointer">assignplan</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="assignplan"
              id="r4"
              disabled={loading}
              onclick={async () => {
                filterby = "assignplan";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2 space-x-20">
            <div class="flex items-center space-x-2 w-full">
              <MapPinX class="h-4 w-4" />
              <Label for="r5" class="cursor-pointer">unassignplan</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="unassignplan"
              id="r5"
              disabled={loading}
              onclick={async () => {
                filterby = "unassignplan";
                await GetData();
              }}
            />
          </div>

          <div class="flex items-center py-1 px-2 space-x-20">
            <div class="flex items-center space-x-2 w-full">
              <ShieldCheck class="h-4 w-4" />
              <Label for="r5" class="cursor-pointer">ensureagent</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="ensureagent"
              id="r5"
              disabled={loading}
              onclick={async () => {
                filterby = "ensureagent";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2 space-x-20">
            <div class="flex items-center space-x-2 w-full">
              <ShieldOff class="h-4 w-4" />
              <Label for="r5" class="cursor-pointer">killagent</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="killagent"
              id="r5"
              disabled={loading}
              onclick={async () => {
                filterby = "killagent";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2 space-x-20">
            <div class="flex items-center space-x-2 w-full">
              <ShieldMinus class="h-4 w-4" />
              <Label for="r5" class="cursor-pointer">removeagent</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="removeagent"
              id="r5"
              disabled={loading}
              onclick={async () => {
                filterby = "removeagent";
                await GetData();
              }}
            />
          </div>
          <div class="flex items-center py-1 px-2 space-x-20">
            <div class="flex items-center space-x-2 w-full">
              <TriangleAlert class="h-4 w-4" />
              <Label for="r5" class="cursor-pointer">issue</Label>
            </div>
            <RadioGroup.Item
              class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
              value="issue"
              id="r5"
              disabled={loading}
              onclick={async () => {
                filterby = "issue";
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

<Entities
  collectionname={data.collectionname}
  show_delete={false}
  multi_select={false}
  query={{}}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet success(item: any)}
    <StatusCard title={item.success ? "Success" : "Failed"} />
  {/snippet}
  {#snippet action(item: any)}
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
