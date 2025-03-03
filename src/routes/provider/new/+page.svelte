<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Acl from "$lib/acl/acl.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import CustomSuperDebug from "$lib/customsuperdebug/customsuperdebug.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check, Trash2, UserRoundPlus } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  const key = "provider";
  let loading = $state(false);

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          // Removing emoty keys
          form.data = removeEmptyKeys(form.data);
          // Removing extra keys
          switch (form.data.provider) {
            case "":
              // @ts-ignore
              delete form.data.introspection_endpoint;
              // @ts-ignore
              delete form.data.introspection_client_id;
              // @ts-ignore
              delete form.data.introspection_client_secret;
              // @ts-ignore
              delete form.data.consumerKey;
              // @ts-ignore
              delete form.data.consumerSecret;
              // @ts-ignore
              delete form.data.saml_federation_metadata;
              break;
            case "saml":
              // @ts-ignore
              delete form.data.introspection_endpoint;
              // @ts-ignore
              delete form.data.introspection_client_id;
              // @ts-ignore
              delete form.data.introspection_client_secret;
              // @ts-ignore
              delete form.data.consumerKey;
              // @ts-ignore
              delete form.data.consumerSecret;
              break;
            case "oidc":
              // @ts-ignore
              delete form.data.issuer;
              break;
            case "google":
              // @ts-ignore
              delete form.data.introspection_endpoint;
              // @ts-ignore
              delete form.data.introspection_client_id;
              // @ts-ignore
              delete form.data.introspection_client_secret;
              // @ts-ignore
              delete form.data.saml_federation_metadata;
              // @ts-ignore
              delete form.data.issuer;
              break;
            case "local":
              // @ts-ignore
              delete form.data.introspection_endpoint;
              // @ts-ignore
              delete form.data.introspection_client_id;
              // @ts-ignore
              delete form.data.introspection_client_secret;
              // @ts-ignore
              delete form.data.consumerKey;
              // @ts-ignore
              delete form.data.consumerSecret;
              // @ts-ignore
              delete form.data.saml_federation_metadata;
              // @ts-ignore
              delete form.data.issuer;
              // @ts-ignore
              delete form.data.id;
              break;
          }
          const res = await auth.client.InsertOne({
            collectionname: "config",
            item: form.data,
            jwt: auth.access_token,
          });
          toast.success("Provider created");
          goto(base + `/${key}`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        loading = false;
        toast.error("Error", {
          description: "Form is invalid",
        });
      }
    },
  });
  const { form: formData, enhance, message } = form;

  function removeEmptyKeys(data: any) {
    for (const key in data) {
      if (data[key] === "") {
        delete data[key];
      }
      return data;
    }
  }
  const providersList = [
    { name: "Ws-federation/SAML", value: "saml" },
    { name: "Google Oauth", value: "google" },
    { name: "OpenID Connect", value: "oidc" },
    { name: "Username/Password", value: "local" },
  ];
  $formData.issuer = auth.baseurl.replace("https://", "uri:");
</script>

{#if message && $message != ""}
  {$message}
{/if}

<form method="POST" use:enhance>
  <Acl bind:value={$formData} {loading} />

  <Form.Field {form} name="provider" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>provider</Form.Label>
        <CustomSelect
          onValueChangeFunction={() => {}}
          bind:value={$formData.provider}
          type="single"
          triggerContent={() => {
            const provider = providersList.find(
              (p) => p.value === $formData.provider,
            );
            return provider ? provider.name : $formData.provider;
          }}
          {loading}
          selectitems={providersList}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

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
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.provider !== "local"}
    <Form.Field {form} name="id" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Id</Form.Label>
          <CustomInput
            disabled={loading}
            placeholder="Type id"
            {...props}
            bind:value={$formData.id}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if $formData.provider === "saml" || $formData.provider === "oidc" || $formData.provider === ""}
      <Form.Field {form} name="saml_federation_metadata" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Meta data url</Form.Label>
            <CustomInput
              disabled={loading}
              placeholder="Type metadata"
              {...props}
              bind:value={$formData.saml_federation_metadata}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/if}

    {#if $formData.provider === "oidc"}
      <Form.Field {form} name="introspection_endpoint" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Introspection</Form.Label>
            <CustomInput
              disabled={loading}
              placeholder="Type introspection"
              {...props}
              bind:value={$formData.introspection_endpoint}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      {#if $formData.introspection_endpoint}
        <Form.Field {form} name="introspection_client_id" class="mb-7">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Introspection client id</Form.Label>
              <CustomInput
                disabled={loading}
                placeholder="Type introspection client id"
                {...props}
                bind:value={$formData.introspection_client_id}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="introspection_client_secret" class="mb-7">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Introspection client secret</Form.Label>
              <CustomInput
                disabled={loading}
                placeholder="Type introspection client secret"
                {...props}
                bind:value={$formData.introspection_client_secret}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {/if}
    {/if}

    {#if $formData.provider === "google" || $formData.provider === "oidc"}
      <Form.Field {form} name="consumerKey" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Consumer key</Form.Label>
            <CustomInput
              disabled={loading}
              placeholder="Type consumer key"
              {...props}
              bind:value={$formData.consumerKey}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="consumerSecret" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Consumer secret</Form.Label>
            <CustomInput
              disabled={loading}
              type="password"
              placeholder="Type consumer secret"
              {...props}
              bind:value={$formData.consumerSecret}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/if}

    {#if $formData.provider === "saml" || $formData.provider === ""}
      <Form.Field {form} name="issuer" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>issuer</Form.Label>
            <CustomInput
              disabled={loading}
              placeholder="Type issuer"
              {...props}
              bind:value={$formData.issuer}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="saml_signout_url" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>embedsignout</Form.Label>
            <CustomInput
              disabled={loading}
              placeholder="Type embedsignout"
              {...props}
              bind:value={$formData.saml_signout_url}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <div class="col-sm-4">
        <pre>{auth.baseurl}/{$formData.id}/FederationMetadata/2007-06/FederationMetadata.xml</pre>
        <HotkeyButton
          class="mb-7"
          aria-label="Test"
          disabled={loading}
          variant="link"
          size="base"
          onclick={() => {
            window.open(
              `${auth.baseurl}/${$formData.id}/FederationMetadata/2007-06/FederationMetadata.xml`,
              "_blank",
            );
          }}
        >
          Test</HotkeyButton
        >
      </div>
    {/if}
  {/if}

  {#if $formData.forceddomains}
    <div class="mb-4">Forced Domains</div>
    {#each $formData.forceddomains as item, index}
      <Form.Field {form} name="forceddomains">
        <Form.Control>
          {#snippet children({ props })}
            {#if $formData.forceddomains}
              <div class="flex items-center justify-start">
                <CustomInput
                  placeholder="New forced domain"
                  type="email"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.forceddomains[index]}
                />
                <HotkeyButton
                  class="ml-2 dark:bg-darkbgred"
                  aria-label="Delete"
                  size="base"
                  disabled={loading}
                  variant="icon"
                  onclick={() => {
                    let arr = $formData.forceddomains;
                    if (arr) {
                      arr.splice(index, 1);
                    }
                    $formData.forceddomains = arr;
                  }}><Trash2 /></HotkeyButton
                >
              </div>
            {/if}
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/each}
  {/if}
  <div>
    <HotkeyButton
      class="mb-7"
      aria-label="Add Domain"
      disabled={loading}
      variant="base"
      size="base"
      onclick={() => {
        let arr = $formData.forceddomains || [];
        $formData.forceddomains = [...arr, "New forced domain"];
      }}
    >
      <UserRoundPlus />
      Add Domain</HotkeyButton
    >
  </div>

  <Form.Field {form} name="order" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>order</Form.Label>
        <CustomInput
          disabled={loading}
          type="number"
          placeholder="Type order"
          {...props}
          bind:value={$formData.order}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <HotkeyButton
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Create Provider"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Create Provider</HotkeyButton
  >
</form>

<CustomSuperDebug {formData} />
