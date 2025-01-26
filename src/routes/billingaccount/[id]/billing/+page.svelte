<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";
  import { Check, Trash } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  const { data } = $props();
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);
  let key = $state(0);
  let toggleSheet = $state(false);
  let sheetresource = $state<Resource>(null as any);

  async function GetData() {
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
    key++;
  }

  const canincrease = $derived((resource: Resource, product: Product) => {
    // return true;
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
    if (
      product.assign == "single" ||
      product.assign == "metered"
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
      const { result, link } = JSON.parse(
        await auth.client.CustomCommand({
          command: "createresourceusage",
          data: JSON.stringify({
            target,
            billingid: data.billingaccount._id,
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
            x.workspaceid == usersettings.currentworkspace &&
            ((x.resourceid == resource._id &&
              x.product.stripeprice == product.stripeprice) ||
              (x.product.lookup_key == product.lookup_key &&
                product.lookup_key != null &&
                product.lookup_key != "")),
        );
        // let usage = entities.filter(
        //   (x) =>
        //     x.resourceid == resource._id &&
        //     x.product.stripeprice == product.stripeprice &&
        //     x.workspaceid == target._id,
        // );

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
</script>
<header>
  <Button
    variant="outline"
    size="base"
    onclick={() => {
      goto(base + "/billingaccount/" + data.billingaccount?._id);
    }}
  >
  {data?.billingaccount?.name}
  </Button> 's billing usage.
  {#if data.billingaccount?.stripeid != null && data.billingaccount?.stripeid != ""}
    <Button
      variant="outline"
      size="base"
      onclick={async () => {
        try {
          const link = await auth.client.CustomCommand({
          command: "getbillingportallink",
          id: data.billingaccount._id,
          jwt: auth.access_token,
        });
        if(link != null && link != "") {
          document.location.href = link;
        } else {
          toast.error("Error opening billing portal");
        }        
        } catch (error:any) {
          toast.error("Error opening billing portal", {
            description: error.message,
          });
        }
      }}
    >
      Open Billing Portal
    </Button>
  {/if}
  <Button
  variant="outline"
  size="base"
  onclick={() => {
    goto(base + "/billingaccount/" + data.billingaccount?._id);
  }}
>
{data?.billingaccount?.name}
</Button> 's billing usage

</header>

<!-- <SuperDebug data={{entities, resources}} /> -->

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
                <Button
                  variant="outline"
                  size="base"
                  onclick={() => decrement(sheetresource, resource.product)}
                >
                  <Trash />
                </Button>
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
