<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import {
    buttonVariants,
    HotkeyButton,
  } from "$lib/components/ui/hotkeybutton";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { StatusCard } from "$lib/statuscard/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import {
    Box,
    Check,
    Ellipsis,
    Filter,
    HandHelping,
    Play,
    Receipt,
    RefreshCcw,
    Rows2,
    Square,
    SquarePen,
    SquarePlus,
    SquareStack,
    Trash2,
    User,
    VenetianMask,
    Webhook,
    Wrench,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let loading = $state(false);
  let knownpods: any = [];
  let clients: any = [];
  // svelte-ignore non_reactive_update
  let filterby: "all" | "daemon" | "pods" | "docker" | "assistant" =
    usersettings.agentfilter;
  let filter = $state(false);
  console.log(filterby);
  if (browser && filterby == "pods") {
    GetData().catch((error: any) => {
      toast.error("Error while getting data", {
        description: error.message,
      });
    });
  }
  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: item._id,
        name: item.slug,
        jwt: auth.access_token,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function GetData() {
    loading = true;
    try {
      let query: any = { _type: "agent" };
      if (filterby == "all") {
      } else if (filterby == "daemon") {
        query = { _type: "agent", daemon: true };
      } else if (filterby == "assistant") {
        query = { _type: "agent", assistant: true };
      } else if (filterby == "docker") {
        query = { _type: "agent", docker: true };
      } else if (filterby == "pods") {
        if (knownpods.length == 0) {
          await getPods(true);
        }
        query = {
          _id: { $in: knownpods.map((x: any) => x.metadata.labels.agentid) },
        };
      }
      if (
        usersettings.currentworkspace != null &&
        usersettings.currentworkspace != ""
      ) {
        query._workspaceid = usersettings.currentworkspace;
      } else {
        delete query._workspaceid;
      }
      const _entities = await datacomponent.GetData(
        "agent",
        "agents",
        query,
        auth.access_token,
      );
      if (filterby == "pods") {
        entities = _entities.filter((x: any) =>
          knownpods.some((y: any) => x._id === y.metadata.labels.agentid),
        );
        for (let i = 0; i < entities.length; i++) {
          let item = entities[i];
          getStatus(item);
        }
      } else {
        entities = _entities;
      }
    } catch (error: any) {
      toast.error("Error while getting data", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function deleteitems(ids: string[]) {
    let haderror = false;
    loading = true;
    showWarning = false;
    let counter = 0;
    try {
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        var item = entities.find((x: any) => x._id == id);
        if (item) {
          try {
            await auth.client.CustomCommand({
              command: "deleteagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            counter++;
            selected_items = selected_items.filter((x: any) => x != item._id);
            GetData();
          } catch (error: any) {
            haderror = true;
            toast.error("Error while deleting", {
              description: error.message,
            });
            return;
          }
        }
      }
      if (!haderror) {
        toast.success("Successfully deleted " + counter + " agent(s)", {
          description: "",
        });
      }
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
    usersettings.persist();
  }
  function single_item_click(item: any) {
    loading = true;
    goto(base + `/agent/${item._id}`);
  }
  function getStatus(model: any) {
    var instances = knownpods.filter(
      (x: any) =>
        (x.metadata.labels &&
          (x.metadata.labels.app == model.slug ||
            x.metadata.labels.slug == model.slug)) ||
        x.metadata.name == model.slug,
    );
    for (var x = 0; x < instances.length; x++) {
      var instance = instances[x];
      model.status = "missing";
      if (instance.status && instance.status.phase) {
        model.status = instance.status.phase;
      }
      if (model.status == "running" || model.status == "Running") {
        if (
          instance.status != null &&
          instance.status.containerStatuses != null &&
          instance.status.containerStatuses.length > 0
        ) {
          model.status = instance.status.containerStatuses[0].started
            ? "running"
            : "stopped " +
              instance.status.containerStatuses[0].state.waiting.reason;
        }
      }
      if (instance.metadata.deletionTimestamp) model.status = "deleting";
    }
    if (instances.length == 0) {
      model.status = "missing";
    }
    if (model.status == "missing") {
      if (model.image == null) {
        var cli1 = clients.filter(
          (x: any) =>
            x.user?._id == model.runas &&
            (x.agent == "nodeagent" || x.agent == "assistant"),
        );
        if (cli1 != null && cli1.length > 0) {
          model.status = "online";
        }
      } else if (model.image.indexOf("nodered") > -1) {
        var cli2 = clients.filter(
          (x: any) => x.user?._id == model.runas && x.agent == "nodered",
        );
        if (cli2 != null && cli2.length > 0) {
          model.status = "online";
        }
      } else if (model.image.indexOf("agent") > -1) {
        var cli3 = clients.filter(
          (x: any) =>
            x.user?._id == model.runas &&
            (x.agent == "nodeagent" || x.agent == "python"),
        );
        if (cli3 != null && cli3.length > 0) {
          model.status = "online";
        }
      }
    }
  }
  async function getPods(force: boolean) {
    loading = true;
    try {
      if (knownpods.length == 0 || force == true) {
        knownpods = JSON.parse(
          await auth.client.CustomCommand({
            command: "getagentpods",
            jwt: auth.access_token,
          }),
        );
      }
      if (clients.length == 0 || force == true) {
        clients = JSON.parse(
          await auth.client.CustomCommand({
            command: "getclients",
            jwt: auth.access_token,
          }),
        );
      }

      for (var x = 0; x < entities.length; x++) {
        getStatus(entities[x]);
      }
    } catch (error: any) {
      toast.error("Error while getting pods", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }

  async function handleAccept() {
    loading = true;
    try {
      showWarning = false;
      await auth.client.CustomCommand({
        command: "deleteagent",
        id: deleteData._id,
        name: deleteData.slug,
        jwt: auth.access_token,
      });
      selected_items = [];
      toast.success("Deleted successfully", {
        description: "",
      });
      await GetData();
      await getPods(false);
      usersettings.persist();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      showWarning = false;
      loading = false;
    }
  }
  if (browser) {
    getPods(false);
  }
  $effect(() => {
    let needsUpdate = false;

    if (data.entities.length != entities.length) {
      needsUpdate = true;
    } else if (
      data.entities.length > 0 &&
      data.entities[0]._id != entities[0]._id
    ) {
      needsUpdate = true;
    } else if (data.entities.length == 0) {
      needsUpdate = true;
    }
    if (needsUpdate) {
      data.entities = entities;
      getPods(false);
    }
  });
  function parseImage(name:string) {
    if (name == null || name == "") return "";
    let parts = name.split("/");
    if (parts.length > 1 && parts[0].indexOf(".") > -1) {
      name = parts[parts.length - 1];
    }
    if (name.indexOf(":") > -1) {
      name = name.split(":")[0];
    }
    return name;
  }
</script>

<div
  class={"xl:flex xl:items-center xl:justify-between mb-2 xl:mb-4 xl:space-x-4"}
>
  <div class="xl:flex xl:items-center xl:space-x-5 mb-2 xl:mb-0 w-full">
    <SearchInput bind:searchstring class="w-full xl:w-[284px] mb-2 xl:mb-0" />
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
          <RadioGroup.Root value={filterby} class="flex flex-col">
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <Rows2 class="h-4 w-4" />
                <Label for="r1" class="cursor-pointer">All</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="all"
                id="r1"
                disabled={loading}
                onclick={async () => {
                  filterby = "all";
                  usersettings.agentfilter = filterby;
                  usersettings.persist();
                  await GetData();
                  await getPods(false);
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <VenetianMask class="h-4 w-4" />
                <Label for="r2" class="cursor-pointer">Daemon</Label>
              </div>

              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="daemon"
                id="r2"
                disabled={loading}
                onclick={async () => {
                  filterby = "daemon";
                  usersettings.agentfilter = filterby;
                  usersettings.persist();
                  await GetData();
                  await getPods(false);
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <SquareStack class="h-4 w-4" />
                <Label for="r3" class="cursor-pointer">Pods</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="pods"
                id="r3"
                disabled={loading}
                onclick={async () => {
                  filterby = "pods";
                  usersettings.agentfilter = filterby;
                  usersettings.persist();
                  await GetData();
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2">
              <div class="flex items-center space-x-2 w-full">
                <Box class="h-4 w-4" />
                <Label for="r4" class="cursor-pointer">Docker</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="docker"
                id="r4"
                disabled={loading}
                onclick={async () => {
                  filterby = "docker";
                  usersettings.agentfilter = filterby;
                  usersettings.persist();
                  await GetData();
                  await getPods(false);
                }}
              />
            </div>
            <div class="flex items-center py-1 px-2 space-x-20">
              <div class="flex items-center space-x-2 w-full">
                <HandHelping class="h-4 w-4" />
                <Label for="r5" class="cursor-pointer">Assistant</Label>
              </div>
              <RadioGroup.Item
                class="dark:border-bw500 dark:text-bw100 dark:hover:bg-600"
                value="assistant"
                id="r5"
                disabled={loading}
                onclick={async () => {
                  filterby = "assistant";
                  usersettings.agentfilter = filterby;
                  usersettings.persist();
                  await GetData();
                  await getPods(false);
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
                    usersettings.agentfilter = filterby;
                    usersettings.persist();
                    await GetData();
                    await getPods(false);
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
  <div
    class="md:flex overflow-auto md:overflow-visible md:items-center xl:justify-end gap-4 md:gap-0 md:space-x-5 mb-2 xl:mb-0"
  >
    <HotkeyButton
      title="Create Agent (Insert Key)"
      data-shortcut="ins"
      class="touraddagent mb-2 sm:mb-0"
      size="sm"
      variant="base"
      aria-label="Create Agent"
      disabled={loading}
      onclick={() => {
        loading = true;
        goto(base + `/agent/new`);
      }}
    >
      <SquarePlus />
      Create Agent</HotkeyButton
    >
    <HotkeyButton
      aria-label="Packages"
      size="sm"
      variant="base"
      disabled={loading}
      onclick={() => {
        loading = true;
        goto(base + `/package`);
      }}
    >
      <Box />
      Packages</HotkeyButton
    >
    <HotkeyButton
      aria-label="Reload"
      size="sm"
      variant="base"
      disabled={loading}
      onclick={async () => {
        await GetData();
        await getPods(true);
      }}
    >
      <RefreshCcw />
      Reload</HotkeyButton
    >
  </div>
</div>

<Entities
  collectionname={data.collectionname}
  bind:searchstring
  delete_selected={deleteitems}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet status(item: any)}
    {#if item && item.status}
      <StatusCard bind:title={item.status as string} />
    {:else}
      <StatusCard title="missing" />
    {/if}
  {/snippet}
  {#snippet _productname(item: any)}
    {#if item && item._productname != null && item._productname != ""}
      {item._productname}
    {:else}
      Free tier
    {/if}
  {/snippet}
  {#snippet image(item: any)}
    {parseImage(item.image)}
  {/snippet}  
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2.5">
      <HotkeyButton
        aria-label="Start"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            loading = true;
            await auth.client.CustomCommand({
              command: "startagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            toast.success("Started successfully", {
              description: "",
            });
            await getPods(true);
          } catch (error: any) {
            toast.error("Error while starting", {
              description: error.message,
            });
          } finally {
            loading = false;
          }
        }}
      >
        <Play />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Stop"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={async () => {
          try {
            loading = true;
            await auth.client.CustomCommand({
              command: "stopagent",
              id: item._id,
              name: item.slug,
              jwt: auth.access_token,
            });
            toast.success("Stopped successfully", {
              description: "",
            });
            await getPods(true);
          } catch (error: any) {
            toast.error("Error while stopping", {
              description: error.message,
            });
          } finally {
            loading = false;
          }
        }}
      >
        <Square />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Debug"
        size="tableicon"
        variant="icon"
        disabled={loading}
        onclick={() => goto(base + `/agent/${item._id}`)}
      >
        <Wrench />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Open in Web"
        title="Open in web"
        size="tableicon"
        variant="icon"
        disabled={(item.webserver != true && item.webserver != "true") ||
          (item.status != "running" && item.status != "Running") ||
          loading}
        onclick={() => window.open(auth.weburl(item.slug), "_blank")}
      >
        <Webhook />
      </HotkeyButton>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="text-bw500 dark:text-bw300"
          ><Ellipsis /></DropdownMenu.Trigger
        >
        <DropdownMenu.Content class="w-44 mr-6 bg-bw50 dark:bg-bw800">
          <DropdownMenu.Item
            class="cursor-pointer border border-transparent hover:border-bw500 rounded-[10px]"
            disabled={loading}
            onclick={() => single_item_click(item)}
          >
            <div class="flex items-center">
              <SquarePen class="mr-2 size-4" />
              <span> Edit</span>
            </div>
          </DropdownMenu.Item>

          <!-- <DropdownMenu.Item class="cursor-pointer">
              <div class="flex items-center">
                <Webhook class="mr-2 size-4" />
                <span>Webhook</span>
              </div>
            </DropdownMenu.Item> -->

          {#if item._workspaceid != null && item._workspaceid != ""}
            <DropdownMenu.Item
              class="cursor-pointer border border-transparent hover:border-bw500 rounded-[10px]"
              onclick={() => {
                loading = true;
                goto(base + `/workspace/${item._workspaceid}`);
              }}
            >
              <div class="flex items-center">
                <Receipt class="mr-2 size-4" />
                <span>Workspace</span>
              </div>
            </DropdownMenu.Item>
          {/if}

          <DropdownMenu.Item
            class="cursor-pointer border border-transparent hover:border-bw500 rounded-[10px]"
            disabled={loading}
            onclick={() => goto(base + `/user/${item.runas}`)}
          >
            <div class="flex items-center">
              <User class="mr-2 size-4" />
              <span>User</span>
            </div>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="cursor-pointer border border-transparent hover:border-bw500 rounded-[10px] hover:bg-opacity-50"
            disabled={loading}
            onclick={() => {
              deleteData = item;
              showWarning = !showWarning;
            }}
          >
            <div class="flex items-center">
              <Trash2 class="mr-2 size-4" />
              <span>Delete Agent</span>
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/snippet}
</Entities>

<Warningdialogue
  bind:showWarning
  type="delete"
  onaccept={handleAccept}
  disabled={loading}
></Warningdialogue>
