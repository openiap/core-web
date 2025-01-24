<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Resource, ResourceUsage, type Product } from "$lib/types.svelte.js";

  const key = "workspace";
  const { data } = $props();
  for (let i = 0; i < data.entities.length; i++) {
    data.entities[i].key = 0;
  }
  let entities: ResourceUsage[] = $state(data.entities);
  let resources: Resource[] = $state(data.resources);

  const canincrease = $derived((resource: Resource, product: Product) => {
    if (product.allowdirectassign == false) return;
    if (resource.allowdirectassign == false) return;
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
  function increment(resource: Resource, product: Product) {
    let exists = entities.find(
      (x) =>
        x.resourceid == resource._id &&
        x.product.stripeprice == product.stripeprice,
    );
    let p = resource.products.find((x) => x.stripeprice == product.stripeprice);
    if (exists == null) {
      let r = new ResourceUsage();
      r.resourceid = resource._id;
      r.product = product;
      r.quantity = 0;
      entities.push(r);
      exists = r;
    }
    if (p == null) throw new Error("Product not found");
    exists.quantity++;
    for (let i = 0; i < resource.products.length; i++) {
      resource.products[i].key++;
    }
    resource.key++;
  }
  function decrement(resource: Resource, product: Product) {
    let exists = entities.find(
      (x) =>
        x.resourceid == resource._id &&
        x.product.stripeprice == product.stripeprice,
    );
    let p = resource.products.find((x) => x.stripeprice == product.stripeprice);
    if (exists == null) throw new Error("Resource not found");
    if (p == null) throw new Error("Product not found");
    exists.quantity--;
    if (exists.quantity < 0) exists.quantity = 0;
    for (let i = 0; i < resource.products.length; i++) {
      resource.products[i].key++;
    }
    resource.key++;
  }
  function removeresource(resource: Resource) {
    let exists = entities.filter((x) => x.resourceid == resource._id);
    if (exists == null || exists.length === 0) return;
    exists.forEach((x) => {
      x.quantity = 0;
    });
    for (let i = 0; i < resource.products.length; i++) {
      resource.products[i].key++;
    }
    resource.key++;
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
              {#key product.key}
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
        {#key resource.key}
          {#if rquantity(resource) == 0}
            <Button variant="outline">Unused</Button>
          {:else}
            <Button onclick={() => removeresource(resource)}
              >Unsubscribe all</Button
            >
          {/if}
        {/key}
      </Card.Footer>
    </Card.Root>
  {/each}
</div>
