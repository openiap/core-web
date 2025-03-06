<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { cleanMatchingKeys, settings } from "./helper.js";
  import { editFormSchema } from "./schema.js";

  let screen = $state("set");
  const { data } = $props();
  let loading = $state(false);
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
          loading = false;
          // But not real data shown only persistig old data
          cancel();
          // goto(base + `/`);
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
  for (let i = 0; i < settings.length; i++) {
    if (settings[i].type === "boolean") {
      if ($formData[settings[i].name] == null) {
        $formData[settings[i].name] = settings[i].default as boolean;
      }
    }
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

<div class="mx-4 my-2.5">
  <div
    class="flex items-center space-x-2 mb-4 dark:bg-darkagenttab rounded-[15px] p-1 w-fit"
  >
    <HotkeyButton
      onclick={() => (screen = "all")}
      variant={screen === "all" ? "tabselected" : "tab"}
    >
      All
    </HotkeyButton>
    <HotkeyButton
      onclick={() => (screen = "set")}
      variant={screen === "set" ? "tabselected" : "tab"}
    >
      Set
    </HotkeyButton>
    <HotkeyButton
      onclick={() => (screen = "unset")}
      variant={screen === "unset" ? "tabselected" : "tab"}
    >
      Unset
    </HotkeyButton>
  </div>

  <form method="POST" use:enhance>
    {#each settings as setting}
      {#if setting.type === "boolean"}
        <div
          class={`${screen !== "all" ? (screen === "unset" && $formData[setting.name] !== setting.default && "hidden") || (screen === "set" && $formData[setting.name] === setting.default && "hidden") : "block"}`}
        >
          <Form.Field
            {form}
            name={`${setting.name}`}
            class="flex flex-row items-center space-x-3 space-y-1 {$formData[
              setting.name
            ] === setting.default && 'opacity-50'}"
          >
            <Form.Control>
              {#snippet children({ props })}
                <CustomCheckbox
                  {...props}
                  bind:checked={$formData[setting.name] as boolean}
                />
                <Form.Label
                  >{setting.name}
                  <span class="text-gray-500">(Default: {setting.default})</span
                  >
                  <HotkeyButton
                    class="text-green-500 ${$formData[setting.name] ===
                      setting.default && 'hidden disabled'}"
                    variant="link"
                    onclick={() => ($formData[setting.name] = setting.default)}
                    >clear</HotkeyButton
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
                  <span class="text-gray-500">(Default: {setting.default})</span
                  >
                  <HotkeyButton
                    class="text-green-500 ${$formData[setting.name] ===
                      setting.default && 'hidden disabled'}"
                    variant="link"
                    onclick={() => ($formData[setting.name] = setting.default)}
                    >clear</HotkeyButton
                  >
                </Form.Label>
                <div class="space-y-2">
                  <CustomInput
                    class="w-full"
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
                  <HotkeyButton
                    class="text-green-500 ${$formData[setting.name] ===
                      setting.default && 'hidden disabled'}"
                    variant="link"
                    onclick={() => ($formData[setting.name] = setting.default)}
                    >clear</HotkeyButton
                  >
                </Form.Label>
                <div class="space-y-2">
                  <CustomInput
                    width="w-full"
                    {...props}
                    bind:value={$formData[setting.name]}
                  />
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
                  <span class="text-gray-500">(Default: {setting.default})</span
                  >
                  <HotkeyButton
                    class="text-green-500 ${$formData[setting.name] ===
                      setting.default && 'hidden disabled'}"
                    variant="link"
                    onclick={() => ($formData[setting.name] = setting.default)}
                    >clear</HotkeyButton
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
                  <span class="text-gray-500">(Default: {setting.default})</span
                  >
                </Form.Label>
                <ObjectInput {...props} bind:value={$formData[setting.name]} />
              {/snippet}
            </Form.Control>
          </Form.Field>
        </div>
      {/if}
    {/each}
    <HotkeyButton
      class="mt-4"
      variant="success"
      size="base"
      disabled={loading}
      aria-label="Update Configuration"
      type="submit"
      data-shortcut="ctrl+s"
    >
      <Check />
      Update Configuration"</HotkeyButton
    >
  </form>

  <CustomSuperDebug {formData} />
</div>
