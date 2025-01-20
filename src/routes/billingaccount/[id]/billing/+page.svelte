<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";
  import { toast } from "svelte-sonner";

  const { data } = $props();
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);
  let key = $state(0);

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
      let target = data.billingaccount;
      if (resource.target == "workspace") {
        target = data.workspace;
        if (
          target == null &&
          usersettings.currentworkspace != null &&
          usersettings.currentworkspace != ""
        ) {
          data.workspace = await auth.client.FindOne({
            collectionname: "users",
            query: { _type: "workspace", _id: usersettings.currentworkspace },
            jwt: auth.access_token,
          });
          target = data.workspace;
        }
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
  async function decrement(resourceusage: ResourceUsage | undefined) {
    try {
      let target = data.billingaccount;
      if (resourceusage == null) throw new Error("Resource not found");
      let resource = resources.find((x) => x._id == resourceusage.resourceid);
      if (resource == null) throw new Error("Resource not found");
      if (resource.target == "workspace") {
        target = data.workspace;
        if (target == null) throw new Error("Please select a Workspace first");
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
    let exists = entities.find(
      (x) =>
        x.resourceid == resource._id &&
        x.product.stripeprice == product.stripeprice,
    );
    if (exists == null) return 0;
    return exists.quantity;
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
                        onclick={() => increment(resource, product)}
                        >Increase</Button
                      >
                    {:else}
                      <Button
                        variant="outline"
                        disabled={true}
                        onclick={() => increment(resource, product)}
                        >Increase</Button
                      >
                    {/if}
                    <Button
                      variant="outline"
                      disabled={quantity(resource, product) == 0}
                      onclick={() =>
                        decrement(
                          entities.find(
                            (x) =>
                              x.resourceid == resource._id &&
                              x.product.stripeprice == product.stripeprice,
                          ),
                        )}>Decrease</Button
                    >
                  </td>
                </tr>
              {/key}
            {/each}
          </tbody>
        </table>
      </Card.Content>
      <Card.Footer class="flex justify-between">
        <!-- {#key key}
          {#if rquantity(resource) == 0}
            <Button variant="outline">Unused</Button>
          {:else}
            <Button onclick={() => removeresource(resource)}
              >Unsubscribe all</Button
            >
          {/if}
        {/key} -->
      </Card.Footer>
    </Card.Root>
  {/each}
</div>
