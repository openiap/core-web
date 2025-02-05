<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { Acl } from "$lib/acl";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { LicenseSchema } from "../schema.js";

  let loading = $state(false);
  let errormessage = $state("");
  let newid = $state("");
  let members: any = $state([]);

  const { data } = $props();
  let products = $state([
    {
      stripeprice: "",
      name: "Free tier"
    },
  ]);
  if (data.resource != null) {
    data.resource.products = data.resource.products.filter(
      (x: any) => x.deprecated != true,
    );
    products = [
      { stripeprice: "", name: "Free tier" },
      ...data.resource.products,
    ];
  }
  const triggerContentPlan = $derived(
    () =>
      products.find((item: any) => item.stripeprice === $formData._stripeprice)
        ?.name ?? "Select a plan",
  );

  const form = superForm(defaults(zod(LicenseSchema)), {
    dataType: "json",
    validators: zod(LicenseSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          await auth.client.CustomCommand({
            command: "ensurelicense",
            data: JSON.stringify(form.data),
            jwt: auth.access_token,
          });
          toast.success("License updated");
          console.log("data.item._stripeprice: ", data.item._stripeprice, "form.data._stripeprice: ", form.data._stripeprice);
          if(data.item._stripeprice != form.data._stripeprice) {
            if(form.data._stripeprice == null || form.data._stripeprice == "") {
              await auth.client.CustomCommand({
                  command: "removeresourceusage",
                  id: form.data._resourceusageid as any,
                  jwt: auth.access_token,
                });
            } else {
              const product = products.find(
                (x: any) => x.stripeprice === form.data._stripeprice,
              );
              const { result, link } = JSON.parse(
                  await auth.client.CustomCommand({
                    command: "createresourceusage",
                    data: JSON.stringify({
                      target: form.data,
                      billingid: form.data._billingid,
                      resourceid: data.resource._id,
                      productname: product?.name,
                      allowreplace: true,
                    }),
                    jwt: auth.access_token,
                  }),
                );
                if (link != null && link != "") {
                  document.location.href = link;
                }

            }
          }
          goto(base + `/licensekey`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
        } finally {
          loading = false;
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });

  const { form: formData, enhance, message, validateForm } = form;
  formData.set(data.item);
  validateForm({ update: true });
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Form.Field {form} name="name" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <CustomInput
          disabled={loading}
          placeholder="Type name"
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.Description
      >This is the domain name ( fqdn ) of the OpenCore instance.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="_billingid">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Billing Account</Form.Label>
        <EntitySelector
          bind:value={$formData._billingid}
          collectionname="users"
          {loading}
          basefilter={{ _type: "customer" }}
        ></EntitySelector>
      {/snippet}
    </Form.Control>
    <Form.Description
      >License is linked to this Billing Account.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="_stripeprice">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>License</Form.Label>
        <CustomSelect
          {loading}
          {...props}
          bind:value={$formData._stripeprice}
          selectitems={products}
          triggerContent={triggerContentPlan}
          type="single"
        />
      {/snippet}
    </Form.Control>
    <Form.Description
      >License is linked to this Billing Account.</Form.Description
    >
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="connections">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Connections</Form.Label>
        <CustomInput
          disabled={true}
          placeholder="Type name"
          {...props}
          bind:value={$formData.connections}
        />
      {/snippet}
    </Form.Control>
    <Form.Description>Max number of concurent connections.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="workspaces">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workspaces</Form.Label>
        <CustomInput
          disabled={true}
          placeholder="Type name"
          {...props}
          bind:value={$formData.workspaces}
        />
      {/snippet}
    </Form.Control>
    <Form.Description>Max number of workspaces.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update"
  >
    <Check />
    Update license</Form.Button
  >
</form>

<CustomSuperDebug {formData} />
