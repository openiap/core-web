<script lang="ts">
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";
  import { toast } from "svelte-sonner";
  import { Check } from "lucide-svelte";
  import SuperDebug from "sveltekit-superforms";

  const { data } = $props();
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);
  let key = $state(0);
  let toggleSheet = $state(false);
  let sheetresource = $state<Resource>(null as any);

  async function GetData() {
    entities = await auth.client.Query<ResourceUsage>({
      collectionname: "config",
      query: { _type: "resourceusage", workspaceid: data.id },
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
    key++;
  }

  const canincrease = $derived((resource: Resource, product: Product) => {
    // return true;
    if (product.allowdirectassign == false) return false;
    if (resource.allowdirectassign == false) return false;
    if (resource.customerassign == "singlevariant") {
      let exists = entities.find(
        (x) =>
          x.resourceid == resource._id &&
          x.product.stripeprice != product.stripeprice,
      );
      if (exists && exists.quantity > 0) {
        return false;
      }
    }
    if (
      product.customerassign == "single" ||
      product.customerassign == "metered"
    ) {
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
      await auth.client.CustomCommand({
        command: "createresourceusage",
        data: JSON.stringify({
          target,
          billingid: data.billingaccount._id,
          workspaceid: data.workspace?._id,
          resourceid: resource._id,
          productname: product.name,
        }),
        jwt: auth.access_token,
      });
      toast.success("Resource assigned");
      await GetData();
    } catch (error: any) {
      toast.error("Error assigning resource", {
        description: error.message,
      });
    }
  }
  async function decrement(resource: Resource, product: Product) {
    try {
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
            x.resourceid == resource._id &&
            x.product.stripeprice == product.stripeprice &&
            x.workspaceid == target._id,
        );
        if (usage.length == 1) {
          resourceusage = usage[0];
        }
      }
      await auth.client.CustomCommand({
        command: "removeresourceusage",
        data: JSON.stringify({
          target,
          resourceusageid: resourceusage._id,
        }),
        jwt: auth.access_token,
      });
      toast.success("Resource unassigned");
      await GetData();
    } catch (error: any) {
      toast.error("Error unassigning resource", {
        description: error.message,
      });
    }
  }
  function removeresource(resource: Resource) {
    let exists = entities.filter((x) => x.resourceid == resource._id);
    if (exists == null || exists.length === 0) return;
    exists.forEach((x) => {
      x.quantity = 0;
    });
    key++;
  }
  function quantity(resource: Resource, product: Product) {
    let usage = entities.filter(
      (x) =>
        x.resourceid == resource._id &&
        x.product.stripeprice == product.stripeprice,
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
</script>

<header>{data?.billingaccount?.name} billing usage</header>
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
                      disabled={quantity(resource, product) == 0}
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
          onclick={() => {
            sheetresource = resource;
            toggleSheet = true;
          }}
        >
          <Check />
          Detailed Usage
        </Button>
      </Card.Footer>
    </Card.Root>
  {/each}
</div>

<!-- <SuperDebug data={{entities, resources}} />
 -->
<Sheet.Root bind:open={toggleSheet}>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>Select columns</Sheet.Title>
      <Sheet.Description>
        Select what columns to show in the table.
      </Sheet.Description>
    </Sheet.Header>
    <div class="grid gap-4 py-4">
      <ScrollArea class="max-h-[70vh]">
        {#each entities.filter((x) => x.resourceid == sheetresource._id) as resource}
          <div class=" flex items-center space-x-4 rounded-md border p-4">
            <div class="flex-1 space-y-1">
              <p class="text-muted-foreground text-sm">
                {resource.name}
              </p>
            </div>
          </div>
        {/each}
      </ScrollArea>
    </div>
    <Sheet.Footer>
      <Button
        variant="outline"
        size="base"
        onclick={() => {
          toggleSheet = false;
        }}
      >
        Close
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
