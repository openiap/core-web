<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { newFormSchema } from "../schema.js";

  let loading = $state(false);
  let errormessage = $state("");
  let agentdata = $state({});
  let amqpqueuedata = $state({});

  let key = "workitemqueue";

  const form = superForm(defaults(zod(newFormSchema)), {
    dataType: "json",
    validators: zod(newFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        try {
          if (form.data.failed_wiqid) {
            const item: any = await auth.client.FindOne({
              collectionname: "mq",
              query: { _type: "workitemqueue", _id: form.data.failed_wiqid },
              jwt: auth.access_token,
            });
            form.data.failed_wiq = item.name;
          }
          if (form.data.success_wiqid) {
            const item: any = await auth.client.FindOne({
              collectionname: "mq",
              query: { _type: "workitemqueue", _id: form.data.success_wiqid },
              jwt: auth.access_token,
            });
            form.data.success_wiq = item.name;
          }

          if (!form.data.amqpqueue) {
            form.data.amqpqueue = form.data.name;
          }

          await auth.client.InsertOne({
            collectionname: "mq",
            item: { ...form.data, _type: "workitemqueue" },
            jwt: auth.access_token,
          });
          toast.success("Workitemqueue added");
          goto(base + `/${key}`);
        } catch (error: any) {
          errormessage = error.message;
          toast.error("Error", {
            description: error.message,
          });
          cancel();
          loading = false;
        } finally {
        }
      } else {
        errormessage = "Form is invalid";
      }
    },
  });
  const { form: formData, enhance, message } = form;
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
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.name}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="projectid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Project</Form.Label>
        <EntitySelector
          collectionname="openrpa"
          bind:value={$formData.projectid}
          basefilter={{ _type: "project" }}
          projection={{ name: 1 }}
          class="w-64"
          name="project"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="maxretries" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Max retries</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.maxretries}
          type="number"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="retrydelay" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Retry delay (Seconds)</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.retrydelay}
          type="number"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="initialdelay" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Initial delay (Seconds)</Form.Label>
        <CustomInput
          placeholder="Type name"
          disabled={loading}
          {...props}
          bind:value={$formData.initialdelay}
          type="number"
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="workflowid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Workflow</Form.Label>
        <EntitySelector
          collectionname="openrpa"
          bind:value={$formData.workflowid}
          basefilter={{ _type: "workflow" }}
          projection={{ name: 1, projectandname: 1 }}
          class="w-64"
          name="workflowid"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="robotqueue" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Robot/role</Form.Label>
        <EntitySelector
          collectionname="users"
          bind:value={$formData.robotqueue}
          basefilter={{
            $or: [{ _type: "user" }, { _type: "role", rparole: true }],
          }}
          projection={{ name: 1, _type: 1 }}
          class="w-64"
          name="robotqueue"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <div class="mb-7">
    <div class="mb-2">AMQP Queue</div>
    <EntitySelector
      collectionname="mq"
      bind:value={amqpqueuedata}
      basefilter={{ _type: "queue" }}
      projection={{ name: 1, _type: 1 }}
      class="w-64"
      name="amqpqueue"
      noitem={true}
      handleChangeFunction={() => {
        // @ts-ignore
        $formData.amqpqueue = amqpqueuedata.name;
        agentdata = { slug: null };
      }}
      returnObject={true}
    />
  </div>

  <div class="mb-7">
    <div class="mb-2">Agent</div>
    <EntitySelector
      collectionname="agents"
      bind:value={agentdata}
      basefilter={{ _type: "agent" }}
      projection={{ slug: 1, name: 1, _type: 1 }}
      class="w-64"
      name="agent"
      handleChangeFunction={() => {
        // @ts-ignore
        $formData.amqpqueue = agentdata.slug + "agent";
        amqpqueuedata = { name: null };
      }}
      noitem={true}
      returnObject={true}
    />
  </div>

  <Form.Field {form} name="packageid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Package</Form.Label>
        <EntitySelector
          collectionname="agents"
          bind:value={$formData.packageid}
          basefilter={{ _type: "package" }}
          projection={{ name: 1, _type: 1 }}
          class="w-64"
          name="package"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    disabled={loading}
    aria-label="Add"
    variant="success"
    size="base"
    class="mb-7"
  >
    <Check />
    Add {key}</Form.Button
  >

  <Form.Field {form} name="success_wiqid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>on success, push to</Form.Label>
        <EntitySelector
          collectionname="mq"
          bind:value={$formData.success_wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="workitem queue"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="failed_wiqid" class="mb-7">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>on failure, push to</Form.Label>
        <EntitySelector
          collectionname="mq"
          bind:value={$formData.failed_wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="workitem queue"
          noitem={true}
        />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>

<CustomSuperDebug {formData} />
