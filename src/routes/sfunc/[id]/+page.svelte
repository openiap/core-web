<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";

  let loading = $state(false);

  const { data } = $props();

  if (data.item != null) {
    data.item = editFormSchema.parse(data.item);
  }

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          const workspaceid = usersettings.currentworkspace;
          if (workspaceid == "" || workspaceid == null) {
            toast.error("Error", {
              description: "Please select a workspace",
            });
            cancel();
            loading = false;
            return;
          }
          form.data._workspaceid = workspaceid;

          await auth.client.CustomCommand({
            command: "ensuresfunc",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token,
          });

          toast.success("FS Function updated");
          goto(base + `/sfunc`);
        } catch (error: any) {
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        }
      } else {
        let errors = Object.keys(form.errors).map(
          (key) => key + " is " + form.errors[key],
        );
        if (errors.length > 0) {
          toast.error("Error", {
            description: errors.join(", "),
          });
        } else {
          toast.error("Error", {
            description: "Form is invalid",
          });
        }
        cancel();
        loading = false;
      }
    },
  });
  const { form: formData, enhance, message, validateForm } = form;
  try {
    formData.set(data.item);
    validateForm({ update: true });
  } catch (error: any) {
    toast.error("Error while enhancing", {
      description: error.message,
    });
  }
</script>

{#if message && $message != ""}
  {$message}
{/if}

{#if $formData != null}
  <form method="POST" use:enhance>
    <Form.Field {form} name="name" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Name</Form.Label>
          <CustomInput
            placeholder="Type name"
            disabled={loading}
            {...props}
            bind:value={$formData.name}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="tag" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Tag</Form.Label>
          <CustomInput
            placeholder="Type tag"
            disabled={loading}
            {...props}
            bind:value={$formData.tag}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="repo" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Repo</Form.Label>
          <CustomInput
            placeholder="Type repo"
            disabled={true}
            {...props}
            bind:value={$formData.repo}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="distro" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Distro</Form.Label>
          <Entityselector
            propertyname="distro"
            queryas={usersettings.currentworkspace}
            width="md:w-fit w-64"
            class="mb-4 md:mb-0"
            {loading}
            {...props}
            collectionname="fc"
            basefilter={{ _type: "distro" }}
            bind:value={$formData.distro}
            handleChangeFunction={(item: any) => {
              console.log("Selected item:", item);
              if (item != null) {
                $formData.distro = item.repo + ":" + item.tag;
              }
            }}
            returnobject={true}
          >
            {#snippet rendername(item: any)}
              {item.name}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Nothing selected
              {:else}
                {item.name}
              {/if}
            {/snippet}
          </Entityselector>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="min_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>min_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type min_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.min_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="max_instances" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>max_instances</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type max_instances"
            disabled={loading}
            {...props}
            bind:value={$formData.max_instances}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="port" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Port</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type Port"
            disabled={loading}
            {...props}
            bind:value={$formData.port}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="minimum_response_time" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Minimum Response Time</Form.Label>
          <CustomInput
            type="number"
            placeholder="Type Minimum Response Time"
            disabled={loading}
            {...props}
            bind:value={$formData.minimum_response_time}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="volume" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Volume</Form.Label>
          <Entityselector
            propertyname="_id"
            queryas={usersettings.currentworkspace}
            width="md:w-fit w-64"
            class="mb-4 md:mb-0"
            disabled={loading}
            {...props}
            collectionname="fc"
            basefilter={{ _type: "volume" }}
            bind:value={$formData.volume}
            selectiontype="multiple"
            maxselections={4}
          >
            {#snippet rendername(item: any)}
              {"(" + item._type + ") " + item.name}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Nothing selected
              {:else}
                {"(" + item._type + ") " + item.name}
              {/if}
            {/snippet}
          </Entityselector>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <HotkeyButton
      type="submit"
      disabled={loading}
      aria-label="Update SF Function"
      variant="success"
      size="base"
      data-shortcut="ctrl+s"
    >
      <Check />
      Update SF Function</HotkeyButton
    >
  </form>
{:else}
  <div>Data not found or access denied</div>
{/if}

<CustomSuperDebug {formData} />
