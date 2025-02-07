<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";
  import { Info, ReceiptText, Trash, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  const { data } = $props();
  let loading = $state(false);
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);
  let key = $state(0);
  let toggleSheet = $state(false);
  let sheetresource = $state<Resource>(null as any);

  async function GetData() {
    try {
      loading = true;
      entities = await auth.client.Query<ResourceUsage>({
        collectionname: "config",
        query: {
          _type: "resourceusage",
          workspaceid: usersettings.currentworkspace,
        },
        jwt: auth.access_token,
      });
      resources = await auth.client.Query<Resource>({
        collectionname: "config",
        query: {
          _type: "resource",
          target: { $in: ["workspace", "agent", "member"] },
        },
        jwt: auth.access_token,
      });
      cleanResources();
      key++;
    } catch (error: any) {
      toast.error("Error loading data", { description: error.message });
    } finally {
      loading = false;
    }
  }

  const canincrease = $derived((resource: Resource, product: Product) => {
    if (loading) return false;
    if (product.allowdirectassign == false) return false;
    if (resource.allowdirectassign == false) return false;
    if (resource.assign == "singlevariant") {
      let exists = entities.find(
        (x) =>
          x.resourceid == resource._id &&
          x.product.stripeprice != product.stripeprice,
      );
      if (exists && exists.quantity > 0) {
        return false;
      }
    }
    if (product.assign == "single" || product.assign == "metered") {
      let exists = entities.find(
        (x) =>
          x.resourceid == resource._id &&
          x.product.stripeprice == product.stripeprice,
      );
      if (exists == null || exists.quantity == 0) {
        return true;
      } else {
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
          x.resourceid == resource._id &&
          x.product.stripeprice == product.stripeprice,
      ) as any;
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

        let usage = entities.filter(
          (x) =>
            x.workspaceid == usersettings.currentworkspace &&
            ((x.resourceid == resource._id &&
              x.product.stripeprice == product.stripeprice) ||
              (x.product.lookup_key == product.lookup_key &&
                product.lookup_key != null &&
                product.lookup_key != "")),
        );
        if (usage.length == 1) {
          resourceusage = usage[0];
        }
      } else if (resource.target == "agent") {
        let usage = entities.filter(
          (x) =>
            x.workspaceid == usersettings.currentworkspace &&
            ((x.resourceid == resource._id &&
              x.product.stripeprice == product.stripeprice) ||
              (x.product.lookup_key == product.lookup_key &&
                product.lookup_key != null &&
                product.lookup_key != "")),
        );
        if (usage.length == 1) {
          resourceusage = usage[0];
        } else {
          throw new Error("Remove plan from agent page or click Detail Usage");
        }
      }
      if (resourceusage == null) {
        throw new Error(
          "Failed finding resource. Click Detail Usage to remove",
        );
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
</script>

<header>
  <div>
    <div class="text-bw500 mb-2">
      This is the billable useage for "{data?.billingaccount?.name}"
    </div>
  </div>
</header>

<div class="flex flex-wrap gap-4">
  {#each resources as resource}
    <Card.Root class="w-[450px] h-[500px] flex flex-col justify-around">
      <Card.Header>
        <Card.Title>{resource.name}</Card.Title>
      </Card.Header>
      <Card.Content>
        <table class="w-full">
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
                  <td>{quantity(resource, product)}</td>
                  <td>
                    {#if canincrease(resource, product)}
                      <Button
                        variant="outline"
                        size="base"
                        disabled={loading}
                        onclick={() => increment(resource, product)}
                        >Increase</Button
                      >
                    {:else}
                      <Button
                        variant="outline"
                        size="base"
                        disabled={true}
                        onclick={() => increment(resource, product)}
                        >Increase</Button
                      >
                    {/if}
                    <Button
                      variant="outline"
                      size="base"
                      disabled={quantity(resource, product) == 0 || loading}
                      onclick={() => decrement(resource, product)}
                      >Decrease</Button
                    >
                  </td>
                </tr>
              {/key}
            {/each}
          </tbody>
        </table>
      </Card.Content>
      <Card.Footer class="flex justify-between">
        <Button
          variant="outline"
          size="base"
          disabled={loading}
          onclick={() => {
            sheetresource = resource;
            toggleSheet = true;
          }}
        >
          <Info />
          Detailed Usage
        </Button>
      </Card.Footer>
    </Card.Root>
  {/each}
</div>

<Sheet.Root bind:open={toggleSheet}>
  <Sheet.Content class="bg-bw200 dark:bg-bw1000">
    <Sheet.Header>
      <Sheet.Title>
        <div class="flex items-center">
          <Info class="p-1" /> Detailed Usage
        </div>
      </Sheet.Title>
      <Sheet.Description>
        View and manage your usage in workspace:
      </Sheet.Description>
      <div class="font-semibold">
        {data?.billingaccount?.name}
      </div>
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
              {resource.name}
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
