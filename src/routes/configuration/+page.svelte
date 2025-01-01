<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";
  import SuperDebug, { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { cleanMatchingKeys, settings } from "./helper.js";
  import { editFormSchema } from "./schema.js";

  const key = "configuration";
  let showdebug = $state(false);
  let screen = $state("set");
  const { data } = $props();
  let loading = $state(false);
  let errormessage = $state("");
  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          const cleanData = cleanMatchingKeys(form.data);
          await auth.client.UpdateOne({
            collectionname: "config",
            item: cleanData,
            jwt: auth.access_token,
          });
          toast.success("Configuration updated");
          goto(base + `/${key}`);
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
  const { form: formData, enhance, message } = form;
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="mb-4 font-bold">Edit Configuration</div>
<div class="flex items-center space-x-2 mb-4">
  <Button
    onclick={() => (screen = "all")}
    variant={screen === "all" ? "default" : "outline"}
  >
    All
  </Button>
  <Button
    onclick={() => (screen = "set")}
    variant={screen === "set" ? "default" : "outline"}
  >
    Set
  </Button>
  <Button
    onclick={() => (screen = "unset")}
    variant={screen === "unset" ? "default" : "outline"}
  >
    Unset
  </Button>
</div>
<form method="POST" use:enhance>
  <Form.Button aria-label="submit">Save</Form.Button>

  {#each settings as setting}
    {#if setting.type === "boolean"}
      <div
        class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
      >
        <Form.Field
          {form}
          name={`${setting.name}`}
          class="flex flex-row items-center space-x-3 space-y-1 rounded-md border p-4 {$formData[
            setting.name
          ] === setting.default && 'opacity-50'}"
        >
          <Form.Control>
            {#snippet children({ props })}
              <Checkbox
                {...props}
                bind:checked={$formData[setting.name] as boolean}
              />
              <Form.Label
                >{setting.name}
                <span class="text-gray-500">(Default: {setting.default})</span>
                <Button
                  class="text-green-500 ${$formData[setting.name] ===
                    setting.default && 'hidden disabled'}"
                  variant="link"
                  onclick={() => ($formData[setting.name] = setting.default)}
                  >clear</Button
                >
              </Form.Label>
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>
    {/if}
    {#if setting.type === "number"}
      <div
        class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
      >
        <Form.Field
          {form}
          name={`${setting.name}`}
          class="my-2 {$formData[setting.name] === setting.default &&
            'opacity-50'}"
        >
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label
                >{setting.name}
                <span class="text-gray-500">(Default: {setting.default})</span>
                <Button
                  class="text-green-500 ${$formData[setting.name] ===
                    setting.default && 'hidden disabled'}"
                  variant="link"
                  onclick={() => ($formData[setting.name] = setting.default)}
                  >clear</Button
                >
              </Form.Label>
              <div class="ms-2 space-y-2">
                <Input
                  {...props}
                  bind:value={$formData[setting.name]}
                  type="number"
                />
              </div>
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>
    {/if}
    {#if setting.type === "string"}
      <div
        class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
      >
        <Form.Field
          {form}
          name={`${setting.name}`}
          class="my-2 {$formData[setting.name] === setting.default &&
            'opacity-50'}"
        >
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label
                >{setting.name}
                <span class="text-gray-500"
                  >(Default: {setting.default
                    ? setting.default
                    : "Empty"})</span
                >
                <Button
                  class="text-green-500 ${$formData[setting.name] ===
                    setting.default && 'hidden disabled'}"
                  variant="link"
                  onclick={() => ($formData[setting.name] = setting.default)}
                  >clear</Button
                >
              </Form.Label>
              <div class="ms-2 space-y-2">
                <Input {...props} bind:value={$formData[setting.name]} />
              </div>
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>
    {/if}
    {#if setting.type === "string[]"}
      <div
        class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
      >
        <Form.Field
          {form}
          name={`${setting.name}`}
          class="my-2 {JSON.stringify($formData[setting.name]) ===
            JSON.stringify(setting.default) && 'opacity-50'}"
        >
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label
                >{setting.name}
                <span class="text-gray-500">(Default: {setting.default})</span>
                <Button
                  class="text-green-500 ${$formData[setting.name] ===
                    setting.default && 'hidden disabled'}"
                  variant="link"
                  onclick={() => ($formData[setting.name] = setting.default)}
                  >clear</Button
                >
              </Form.Label>
              <ObjectInput {...props} bind:value={$formData[setting.name]} />
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>
    {/if}
    {#if setting.type === "object[]"}
      <div
        class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
      >
        <Form.Field
          {form}
          name={`${setting.name}`}
          class="my-2 {JSON.stringify($formData[setting.name]) ===
            JSON.stringify(setting.default) && 'opacity-50'}"
        >
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label
                >{setting.name}
                <span class="text-gray-500">(Default: {setting.default})</span>
              </Form.Label>
              <ObjectInput {...props} bind:value={$formData[setting.name]} />
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>
    {/if}
  {/each}

  <Form.Button aria-label="submit">Save</Form.Button>
</form>

{#if formData != null && showdebug == true}
  <SuperDebug data={formData} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  aria-label="Toggle debug"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
