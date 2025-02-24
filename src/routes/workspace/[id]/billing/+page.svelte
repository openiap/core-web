<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";
  import {
      Clock,
      Info,
      LucideBadgeDollarSign,
      Minus,
      Plus,
      Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  const { data } = $props();
  // TODO: product hack for backward compatibility
  for (let i = 0; i < data.resources.length; i++) {
    const r = data.resources[i];
    if (r.name == "Agent Instance") {
      r.target = "agent" as any;
    }
    for (let y = 0; y < r.products.length; y++) {
      const p = r.products[y];
      if (r.target == "customer") {
        p.assign = (p as any).customerassign;
      }
      if (r.target == "agent") {
        p.assign = (p as any).customerassign;
      }
    }
  }
  $effect(() => {
    if (
      data.id != usersettings.currentworkspace &&
      usersettings.currentworkspace != ""
    ) {
      goto(base + "/workspace/" + usersettings.currentworkspace + "/billing");
    } else if (usersettings.currentworkspace == "") {
      goto(base + "/workspace");
    }
  });
  let loading = $state(false);
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);
  let key = $state(0);
  let toggleSheet = $state(false);
  let sheetresource = $state<Resource>(null as any);
  let meterprompt = $state(false);
  let meterusageprompt = $state(false);
  let metervalue = $state(1);
  let selectedmeter = $state<ResourceUsage>(null as any);
  let metervalues: { quantity: number; result: any } = $state({
    quantity: 0,
    result: null,
  });

  let confirmprice = $state(false);
  let confirmpriceresource: Resource = $state(null as any);
  let confirmpriceproduct: any = $state(null as any);
  let confirmpricenextinvoice: any = $state(null as any);
  let confirmpriceperiod_start: String = $state(null as any);
  let confirmpriceperiod_end: String = $state(null as any);

  async function GetData() {
    try {
      loading = true;
      entities = await auth.client.Query<ResourceUsage>({
        collectionname: "config",
        query: { _type: "resourceusage", customerid: data.id },
        jwt: auth.access_token,
      });
      resources = await auth.client.Query<Resource>({
        collectionname: "config",
        query: { _type: "resource" },
        jwt: auth.access_token,
      });
      cleanResources();
      key++;
    } catch (error: any) {
      toast.error("Error getting data", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }

  const canincrease = $derived((resource: Resource, product: Product) => {
    if (product.allowdirectassign == false) return false;
    if (resource.allowdirectassign == false) return false;
    if (resource.target != "customer") return false;
    if (resource.assign == "singlevariant") {
      // let exists = entities.find(
      //   (x) =>
      //     x.resourceid == resource._id &&
      //     x.product.stripeprice == product.stripeprice,
      // );
      let exists = entities.find(
        (x) =>
          (x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice) ||
          (x.product.lookup_key == product.lookup_key &&
            product.lookup_key != null &&
            product.lookup_key != ""),
      );
      if (!exists) {
        // if already exists, allow it
        exists = entities.find(
          (x) =>
            x.resourceid == resource._id &&
            x.product.stripeprice != product.stripeprice,
        );
        if (exists && exists.quantity > 0) {
          return false;
        }
      }
    }
    if (product.assign == "single" || product.assign == "metered") {
      // let exists = entities.find(
      //   (x) =>
      //     x.resourceid == resource._id &&
      //     x.product.stripeprice == product.stripeprice,
      // );
      let exists = entities.find(
        (x) =>
          (x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice) ||
          (x.product.lookup_key == product.lookup_key &&
            product.lookup_key != null &&
            product.lookup_key != ""),
      );
      if (exists == null || exists.quantity == 0) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  });
  const candecrease = $derived((resource: Resource, product: Product) => {
    if (product.allowdirectassign == false) return false;
    if (resource.allowdirectassign == false) return false;
    if (quantity(resource, product) == 0) return false;
    if (resource.target != "customer") return false;
    if (resource.assign == "singlevariant") {
      // let exists = entities.find(
      //   (x) =>
      //     x.resourceid == resource._id &&
      //     x.product.stripeprice == product.stripeprice,
      // );
      let exists = entities.find(
        (x) =>
          (x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice) ||
          (x.product.lookup_key == product.lookup_key &&
            product.lookup_key != null &&
            product.lookup_key != ""),
      );
      if (exists == null || exists.quantity == 0) {
        return false;
      }
    }
    if (product.assign == "single" || product.assign == "metered") {
      // let exists = entities.find(
      //   (x) =>
      //     x.resourceid == resource._id &&
      //     x.product.stripeprice == product.stripeprice,
      // );
      let exists = entities.find(
        (x) =>
          (x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice) ||
          (x.product.lookup_key == product.lookup_key &&
            product.lookup_key != null &&
            product.lookup_key != ""),
      );
      if (exists == null || exists.quantity == 0) {
        return false;
      }
    }
    return true;
  });
  async function increment(resource: Resource, product: Product) {
    try {
      loading = true;
      let target: any = null;
      if (resource.target == "customer") {
        target = data.billingaccount;
      } else if (resource.target == "workspace") {
        data.workspace = await auth.client.FindOne({
          collectionname: "users",
          query: { _type: "workspace", _id: usersettings.currentworkspace },
          jwt: auth.access_token,
        });
        target = data.workspace;
        if (target == null) throw new Error("Please select a Workspace first");
      }
      if (
        confirmprice == false &&
        auth.config.stripe_api_key != null &&
        auth.config.stripe_api_key != ""
      ) {
        try {
          confirmpriceresource = resource;
          confirmpriceproduct = product;
          confirmpricenextinvoice = JSON.parse(
            await auth.client.CustomCommand({
              command: "getnextinvoice",
              id: data.billingaccount?._id,
              data: JSON.stringify({
                lookupkey: product.lookup_key,
                stripeprice: product.stripeprice,
                productname: product.name,
                quantity: 1,
              }),
              jwt: auth.access_token,
            }),
          );
          const period_start = new Date(
            confirmpricenextinvoice.period_start * 1000,
          );
          const period_end = new Date(
            confirmpricenextinvoice.period_end * 1000,
          );
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          confirmpriceperiod_start =
            period_start.getDate() +
            " " +
            monthNames[period_start.getMonth()] +
            " " +
            period_start.getFullYear();
          confirmpriceperiod_end =
            period_end.getDate() +
            " " +
            monthNames[period_end.getMonth()] +
            " " +
            period_end.getFullYear();

          if (confirmpricenextinvoice?.lines?.data != null) {
            confirmpricenextinvoice.lines = confirmpricenextinvoice.lines.data;
          }
          loading = false;
          confirmprice = true;
          // svelte-ignore state_referenced_locally
          return;
        } catch (error) {}
      } else {
        confirmprice = false;
      }
      const { result, link } = JSON.parse(
        await auth.client.CustomCommand({
          command: "createresourceusage",
          data: JSON.stringify({
            target,
            billingid: data.billingaccount?._id,
            workspaceid: usersettings.currentworkspace,
            resourceid: resource._id,
            productname: product.name,
          }),
          jwt: auth.access_token,
        }),
      );
      if (link != null && link != "") {
        document.location.href = link;
      }
      toast.success("Resource assigned");
      await GetData();
    } catch (error: any) {
      toast.error("Error assigning resource", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function decrement(resource: Resource, product: Product) {
    try {
      loading = true;
      let target: any = null;
      if (resource == null) throw new Error("Resource not found");
      if (product == null) throw new Error("Product not found");
      let resourceusage: ResourceUsage = entities.find(
        (x) =>
          (x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice) ||
          (x.product.lookup_key == product.lookup_key &&
            product.lookup_key != null &&
            product.lookup_key != ""),
      ) as any;
      if (resourceusage == null) {
        throw new Error(
          "Failed finding resource. Click Detail Usage to remove",
        );
      }
      if (resource.target == "customer") {
        target = data.billingaccount;
      } else {
        toast.error("Please click Detailed Usage to remove");
        return;
      }
      await auth.client.CustomCommand({
        command: "removeresourceusage",
        id: resourceusage._id,
        jwt: auth.access_token,
      });
      toast.success("Resource unassigned");
      await GetData();
    } catch (error: any) {
      toast.error("Error unassigning resource", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function removeresourceusage(resourceusage: ResourceUsage) {
    try {
      loading = true;
      await auth.client.CustomCommand({
        command: "removeresourceusage",
        id: resourceusage._id,
        jwt: auth.access_token,
      });
      toast.success("Resource unassigned");
      await GetData();
    } catch (error: any) {
      toast.error("Error unassigning resource", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  async function addvalues(resourceusage: ResourceUsage) {
    try {
      if (metervalue == 0)
        throw new Error("Value must be greater or less than 0");
      loading = true;
      await auth.client.CustomCommand({
        command: "reportresourceusage",
        id: resourceusage._id,
        data: JSON.stringify({ quantity: metervalue }),
        jwt: auth.access_token,
      });
      toast.success("Value successfully added");
      await GetData();
    } catch (error: any) {
      toast.error("Error adding value", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  function quantity(resource: Resource, product: Product) {
    let usage = entities.filter(
      (x) =>
        (x.resourceid == resource._id &&
          x.product.stripeprice == product.stripeprice) ||
        (x.product.lookup_key == product.lookup_key &&
          product.lookup_key != null &&
          product.lookup_key != ""),
    );
    if (usage.length == null) return 0;
    let quantity = usage.reduce((a, b) => a + b.quantity, 0);
    return quantity;
  }
  function rquantity(resource: Resource) {
    let exists = entities.filter((x) => x.resourceid == resource._id);
    if (exists == null || exists.length === 0) return 0;
    let quantity = 0;
    exists.forEach((x) => {
      quantity += x.quantity;
    });
    return quantity;
  }
  function cleanResources() {
    for (let i = 0; i < resources.length; i++) {
      let resource = resources[i];
      for (let y = 0; y < resource.products.length; y++) {
        let product = resource.products[y];
        let remove = product.deprecated && quantity(resource, product) == 0;
        if (remove) {
          resource.products.splice(y, 1);
          y--;
        }
      }

      let remove =
        (resource.deprecated && rquantity(resource) == 0) ||
        resource.products.length == 0;
      if (remove) {
        resources.splice(i, 1);
        i--;
      }
    }
  }
  cleanResources();

  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");

  const cardRoot = "w-full h-[430px] dark:bg-bw850 grid grid-rows-4";
  const cardHeader = "text-center";
  const cardTitle = "text-bw950 dark:text-bw100";
  const cardDiv = "flex flex-col justify-between row-span-4";
</script>

<header class="mb-6">
  <div>
    <div class="text-bw500 mb-2">
      Detailed billing information for all workspaces attached to this billing
      account.
    </div>
  </div>
</header>

<div class="grid lg:grid-cols-3 gap-4 lg:gap-10">
  {#each resources as resource}
    <Card.Root class={cardRoot}>
      <Card.Header class={cardHeader}>
        <Card.Title class={cardTitle}>{resource.name}</Card.Title>
      </Card.Header>
      <div class={cardDiv}>
        <Card.Content>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each resource.products as product}
                {#key key}
                  <tr>
                    <td>{product.name}</td>
                    <td class="text-center">{quantity(resource, product)}</td>
                    <td class="flex justify-end mb-2">
                      {#if canincrease(resource, product)}
                        <HotkeyButton
                          disabled={loading}
                          onclick={() => increment(resource, product)}
                          ><Plus />
                        </HotkeyButton>
                      {:else}
                        <HotkeyButton disabled={true}><Plus /></HotkeyButton>
                      {/if}
                      {#if candecrease(resource, product)}
                        <HotkeyButton
                          class="ms-2"
                          disabled={loading}
                          onclick={() => decrement(resource, product)}
                          ><Minus />
                        </HotkeyButton>
                      {:else}
                        <HotkeyButton class="ms-2" disabled={true}
                          ><Minus /></HotkeyButton
                        >
                      {/if}
                    </td>
                  </tr>
                {/key}
              {/each}
            </tbody>
          </table>
        </Card.Content>
        <Card.Footer class="flex justify-between">
          <HotkeyButton
            disabled={rquantity(resource) == 0 || loading}
            onclick={() => {
              sheetresource = resource;
              toggleSheet = true;
            }}
          >
            <LucideBadgeDollarSign />
            Detailed Usage
          </HotkeyButton>
        </Card.Footer>
      </div>
    </Card.Root>
  {/each}
</div>

<Sheet.Root bind:open={toggleSheet}>
  <Sheet.Content class="bg-bw200 dark:bg-bw1000">
    <Sheet.Header>
      <Sheet.Title>
        <div class="flex items-center">
          <Info class="p-1" /> Detailed Usage
        </div></Sheet.Title
      >
      <Sheet.Description>
        View and manage your usage in all workspaces
      </Sheet.Description>
    </Sheet.Header>
    <div class="border rounded-[10px] my-4">
      <ScrollArea class="max-h-[70vh] bg-bw100 dark:bg-bw1000 rounded-[10px]">
        {#each entities.filter((x) => x.resourceid == sheetresource._id) as resource, index}
          {#if index != 0}
            <div class="mx-3">
              <Separator />
            </div>
          {/if}
          <div class="flex items-center justify-between p-4">
            <p class="text-muted-foreground text-sm max-w-[200px]">
              {resource.name}<br />
              {#if resource.product.assign == "metered"}
                <HotkeyButton
                  disabled={loading}
                  onclick={async () => {
                    try {
                      loading = true;
                      metervalues = JSON.parse(
                        await auth.client.CustomCommand({
                          command: "getmeteredresourceusage",
                          id: resource._id,
                          jwt: auth.access_token,
                        }),
                      );
                      selectedmeter = resource;
                      meterusageprompt = true;
                    } catch (error: any) {
                      toast.error("Error getting data", {
                        description: error.message,
                      });
                    } finally {
                      loading = false;
                    }
                  }}
                >
                  <Clock />
                </HotkeyButton>
              {/if}
              {#if resource.product.assign == "metered" && isAdmin}
                <HotkeyButton
                  disabled={loading}
                  onclick={() => {
                    selectedmeter = resource;
                    meterprompt = true;
                  }}
                >
                  <Plus />
                </HotkeyButton>
              {/if}
            </p>
            <HotkeyButton
              variant="danger"
              size="icon"
              disabled={loading}
              onclick={() => removeresourceusage(resource)}
            >
              <Trash2 />
            </HotkeyButton>
          </div>
        {/each}
      </ScrollArea>
    </div>
  </Sheet.Content>
</Sheet.Root>

<AlertDialog.Root bind:open={meterprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Manually add value to meter</AlertDialog.Title>
      <AlertDialog.Description>
        Add to {selectedmeter.name}<br />
        Please type the value to add to the meter
        <CustomInput bind:value={metervalue} type="number" />
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton disabled={loading} onclick={() => (meterprompt = false)}
        >Cancel</HotkeyButton
      >
      <HotkeyButton
        disabled={loading}
        onclick={() => {
          addvalues(selectedmeter);
          meterprompt = false;
        }}>Continue</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
<AlertDialog.Root bind:open={meterusageprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Manually add value to meter</AlertDialog.Title>
      <AlertDialog.Description>
        Consumption for {selectedmeter.name}<br />
        quantity: {metervalues.quantity}<br />
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        disabled={loading}
        onclick={() => (meterusageprompt = false)}>Cancel</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={meterprompt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Manually add value to meter</AlertDialog.Title>
      <AlertDialog.Description>
        Add to {selectedmeter.name}<br />
        Please type the value to add to the meter
        <CustomInput bind:value={metervalue} type="number" />
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton disabled={loading} onclick={() => (meterprompt = false)}
        >Cancel</HotkeyButton
      >
      <HotkeyButton
        disabled={loading}
        onclick={() => {
          addvalues(selectedmeter);
          meterprompt = false;
        }}>Continue</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={confirmprice}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Next invoice</AlertDialog.Title>
      <AlertDialog.Description>
        {#if confirmpricenextinvoice && confirmpricenextinvoice.lines}
          <!-- Adding {confirmpriceresource.name} / {confirmpriceproduct.name}<br />
          Will issue an invoice for the period<br /> -->
          {confirmpriceperiod_start} - {confirmpriceperiod_end}<br />
          With a total of
          {confirmpricenextinvoice.total_excluding_tax / 100}
          {confirmpricenextinvoice.currency}
          {#if confirmpricenextinvoice.tax != null && confirmpricenextinvoice?.tax > 0}
            plus {confirmpricenextinvoice.tax / 100}
            {confirmpricenextinvoice.currency} in taxes
          {/if}
          <br />
          <br />
          <b>Lines:</b>
          <br />
          <ul>
            {#each confirmpricenextinvoice.lines as line}
              <li>
                {line.description}
                {line.amount / 100}
                {line.currency}
              </li>
            {/each}
          </ul>
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton disabled={loading} onclick={() => (confirmprice = false)}
        >Cancel</HotkeyButton
      >
      <HotkeyButton
        disabled={loading}
        onclick={() => {
          increment(confirmpriceresource, confirmpriceproduct);
        }}>Continue</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
