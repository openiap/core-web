<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let loading = $state(false);
  let type = $state("normal");

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          const copyForm = form.data;
          if (type === "normal") {
            delete copyForm.timefield;
            delete copyForm.granularity;
            delete copyForm.metadata;
            await auth.client.CreateCollection({
              jwt: auth.access_token,
              collectionname: copyForm.collectionname,
              expireAfterSeconds: copyForm.expireafterseconds,
            });
          } else {
            await auth.client.CreateCollection({
              jwt: auth.access_token,
              collectionname: copyForm.collectionname,
              expireAfterSeconds: copyForm.expireafterseconds,
              timeseries: {
                granularity: copyForm.granularity as any,
                timeField: copyForm.timefield as any,
                metaField: copyForm.metadata,
              },
            });
          }
          toast.success("Entity created");
          goto(base + `/entities/${copyForm.collectionname}`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        toast.error("Error", {
          description: "Form is invalid",
        });
        loading = false;
      }
    },
  });
  const { form: formData, enhance, message } = form;
</script>

<!--  -->
<div>
  {#if message && $message != ""}
    {$message}
  {/if}

  <form method="POST" use:enhance>
    <Form.Field {form} name="collectionname" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Type</Form.Label>
          <CustomSelect
            onValueChangeFunction={(value) => {
              if (value === "timeseries") {
                $formData.granularity = "seconds";
                $formData.timefield = "ts";
              }
            }}
            bind:value={type}
            type="single"
            triggerContent={() => type}
            {loading}
            selectitems={[
              { name: "normal", value: "normal" },
              { name: "timeseries", value: "timeseries" },
            ]}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="collectionname" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Collection Name</Form.Label>
          <CustomInput
            placeholder="name"
            {...props}
            bind:value={$formData.collectionname}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="expireafterseconds" class="mb-7">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Expire after seconds</Form.Label>
          <CustomInput
            type="number"
            {...props}
            bind:value={$formData.expireafterseconds}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if type === "timeseries"}
      <Form.Field {form} name="timefield" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Time field</Form.Label>
            <CustomInput {...props} bind:value={$formData.timefield} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="granularity" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Granularity</Form.Label>
            <CustomSelect
              onValueChangeFunction={(value) => {
                if (value === "timeseries") {
                  $formData.granularity = "seconds";
                }
              }}
              bind:value={$formData.granularity}
              type="single"
              triggerContent={() => $formData.granularity}
              {loading}
              selectitems={[
                { name: "seconds", value: "seconds" },
                { name: "minutes", value: "minutes" },
                { name: "hours", value: "hours" },
              ]}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="metadata" class="mb-7">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Meta data</Form.Label>
            <CustomInput {...props} bind:value={$formData.metadata} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/if}

    <HotkeyButton
      class="mb-[1rem]"
      variant="success"
      size="base"
      disabled={loading}
      aria-label="Create formresource"
      type="submit"
      data-shortcut="ctrl+s"
    >
      <Check />
      Create Entity</HotkeyButton
    >
  </form>

  <CustomSuperDebug {formData} />
</div>
