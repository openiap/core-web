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
  import { Clock, LucideBadgeDollarSign, Minus, Plus, Trash } from "lucide-svelte";
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
  async function addhours(resourceusage: ResourceUsage) {
    try {
      loading = true;
      await auth.client.CustomCommand({
        command: "reportresourceusage",
        id: resourceusage._id,
        data: JSON.stringify({quantity: 1}),
        jwt: auth.access_token,
      });
      toast.success("Hours added");
      await GetData();
    } catch (error: any) {
      toast.error("Error adding hours", {
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
  <Button
    variant="outline"
    size="base"
    disabled={loading}
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
      disabled={loading}
      onclick={async () => {
        try {
          const link = await auth.client.CustomCommand({
            command: "getbillingportallink",
            id: data.billingaccount._id,
            jwt: auth.access_token,
          });
          if (link != null && link != "") {
            document.location.href = link.split('"').join("");
          } else {
            toast.error("Error opening billing portal");
          }
        } catch (error: any) {
          toast.error("Error opening billing portal", {
            description: error.message,
          });
        }
      }}
    >
      Open Billing Portal
    </Button>
    <Button
      variant="outline"
      size="base"
      disabled={loading}
      onclick={async () => {
        try {
          const link = await auth.client.CustomCommand({
            command: "syncbillingaccount",
            id: data.billingaccount._id,
            jwt: auth.access_token,
          });
          toast.success("Billing account synced");
        } catch (error: any) {
          toast.error("Error opening billing portal", {
            description: error.message,
          });
        }
      }}
    >
      Sync with Stripe
    </Button>
  {/if}
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
                        ><Plus /></Button
                      >
                    {:else}
                      <Button
                        variant="outline"
                        size="base"
                        disabled={true}
                        onclick={() => increment(resource, product)}
                        ><Plus /></Button
                      >
                    {/if}
                    <Button
                      variant="outline"
                      size="base"
                      disabled={quantity(resource, product) == 0 || loading}
                      onclick={() => decrement(resource, product)}
                      ><Minus /></Button
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
          disabled={rquantity(resource) == 0 || loading}
          onclick={() => {
            sheetresource = resource;
            toggleSheet = true;
          }}
        >
          <LucideBadgeDollarSign />
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
                  disabled={loading}
                  onclick={() => removeresourceusage(resource)}
                >
                  <Trash />
                </Button>
                {#if resource.product.assign == "single" || resource.product.assign == "metered"}
                <Button
                  variant="outline"
                  size="base"
                  disabled={loading}
                  onclick={() => addhours(resource)}
                >
                  <Clock />
                </Button>
                {/if}
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
        disabled={loading}
        onclick={() => {
          toggleSheet = false;
        }}
      >
        Close
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
