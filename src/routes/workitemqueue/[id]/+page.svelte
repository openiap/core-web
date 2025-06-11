<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import type { Workspace } from "../../workspace/schema.js";
  import { editFormSchema } from "../schema.js";

  let loading = $state(false);

  const { data } = $props();
  
  if (data.item != null) {
    data.item = editFormSchema.parse(data.item);
  }

  let agentdata = $state(data.agentdata);
  let amqpqueuedata = $state(data.amqpqueuedata);

  const form = superForm(defaults(zod(editFormSchema)), {
    dataType: "json",
    validators: zod(editFormSchema),
    SPA: true,
    onUpdate: async ({ form, cancel }) => {
      if (form.valid) {
        loading = true;
        let workspace: Workspace | null = null;
        try {
          if (auth.config?.workspace_enabled == true) {
            let _workspaceid = form.data._workspaceid;
            if (_workspaceid == null || _workspaceid == "") {
              if (
                usersettings.currentworkspace == null ||
                usersettings.currentworkspace == ""
              ) {
                throw new Error("You must select a workspace first");
              }
              _workspaceid = usersettings.currentworkspace;
            }
            workspace = await auth.client.FindOne({
              collectionname: "users",
              query: {
                _type: "workspace",
                _id: _workspaceid,
              },
              jwt: auth.access_token,
            });
            if (workspace == null) {
              throw new Error("Workspace not found");
            }
            // @ts-ignore
            form.data._acl = [...form.data._acl, ...workspace._acl];
            if (auth.config?.workspace_enabled == true && workspace != null) {
              form.data._workspaceid = workspace._id;
            }
          }
          if (form.data.failed_wiqid) {
            const item: any = await auth.client.FindOne({
              collectionname: "mq",
              query: { _type: "workitemqueue", _id: form.data.failed_wiqid },
              jwt: auth.access_token,
            });
            form.data.failed_wiq = item.name;
          }
          else{
            form.data.failed_wiq = ""; 
          }
          if (form.data.success_wiqid) {
            const item: any = await auth.client.FindOne({
              collectionname: "mq",
              query: { _type: "workitemqueue", _id: form.data.success_wiqid },
              jwt: auth.access_token,
            });
            form.data.success_wiq = item.name;
            console.log(item);
            if (item == null) throw new Error("Workitemqueue not found");
          }
          else{
            form.data.success_wiq = "";
          }
          if (!form.data.amqpqueue) {
            form.data.amqpqueue = form.data.name;
          }
          // await auth.client.UpdateOne({
          //   collectionname: "mq",
          //   item: form.data,
          //   jwt: auth.access_token,
          // });
          let data: any = { ...form.data };
          delete data._created;
          delete data._modified;
          // console.log("data", data);
          // return;
          await auth.client.UpdateWorkItemQueue({
            workitemqueue: data,
            skiprole: false,
            jwt: auth.access_token,
          });

          toast.success("Workitemqueue updated");
          goto(base + `/workitemqueue`);
        } catch (error: any) {
          console.error(error);
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

  {#if (data.item._workspaceid == null || data.item._workspaceid == "") && auth.config?.workspace_enabled == true}
    <Form.Field {form} name="_workspaceid" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Workspace</Form.Label>
          <EntitySelector
            {loading}
            collectionname="users"
            bind:value={$formData._workspaceid}
            basefilter={{ _type: "workspace" }}
            projection={{ name: 1 }}
            class="w-64"
            name="workspace"
            allowunselect={true}
            propertyname="_id"
          >
            {#snippet rendername(item: any)}
              {item.name}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Select a workspace
              {:else}
                {item.name}
              {/if}
            {/snippet}</EntitySelector
          >
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  <Form.Field {form} name="maxretries" class="mb-10">
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

  <Form.Field {form} name="retrydelay" class="mb-10">
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

  <Form.Field {form} name="initialdelay" class="mb-10">
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

  <Form.Field {form} name="robotqueue" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Robot/role</Form.Label>
        <EntitySelector
          {loading}
          collectionname="users"
          bind:value={$formData.robotqueue}
          basefilter={{
            $or: [
              {
                _type: "user",
                _rpaheartbeat: { $exists: true, $nin: ["", null] },
              },
              { _type: "role", rparole: true },
            ],
          }}
          projection={{ name: 1, _type: 1 }}
          class="w-64"
          name="robotqueue"
          allowunselect={true}
          propertyname="_id"
          handleChangeFunction={() => {
            $formData.projectid = "";
            $formData.workflowid = "";
          }}
        >
          {#snippet rendername(item: any)}
            {item.name}
          {/snippet}
          {#snippet rendercontent(item: any)}
            {#if item == null}
              Select a robot/role
            {:else}
              {item.name}
            {/if}
          {/snippet}
        </EntitySelector>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $formData.robotqueue}
    <Form.Field {form} name="projectid" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Project</Form.Label>
          <EntitySelector
            queryas={$formData.robotqueue}
            {loading}
            propertyname="_id"
            collectionname="openrpa"
            bind:value={$formData.projectid}
            basefilter={{ _type: "project" }}
            projection={{ name: 1 }}
            class="w-64"
            name="project"
            allowunselect={true}
            handleChangeFunction={() => {
              $formData.workflowid = "";
            }}
          >
            {#snippet rendername(item: any)}
              {item.name}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Select a project
              {:else}
                {item.name}
              {/if}
            {/snippet}</EntitySelector
          >
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  {#if $formData.projectid}
    <Form.Field {form} name="workflowid" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Workflow</Form.Label>
          <EntitySelector
            {loading}
            collectionname="openrpa"
            bind:value={$formData.workflowid}
            basefilter={{ _type: "workflow", projectid: $formData.projectid }}
            projection={{ name: 1, projectandname: 1 }}
            class="w-64"
            name="workflowid"
            allowunselect={true}
            propertyname="_id"
          >
            {#snippet rendername(item: any)}
              {item.name}
            {/snippet}
            {#snippet rendercontent(item: any)}
              {#if item == null}
                Select a workflow
              {:else}
                {item.name}
              {/if}
            {/snippet}</EntitySelector
          >
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  {/if}

  <div class="mb-10">
    <div class="mb-2 font-medium text-sm">AMQP Queue</div>
    <EntitySelector
      {loading}
      collectionname="mq"
      bind:value={$formData.amqpqueue}
      basefilter={{ _type: "queue" }}
      projection={{ name: 1, _type: 1 }}
      class="w-64"
      name="amqpqueue"
      allowunselect={true}
      handleChangeFunction={(value: any, item: any) => {
        if (item == null) {
          $formData.amqpqueue = "";
        }
        // @ts-ignore
        // $formData.amqpqueue = amqpqueuedata.name;
        agentdata = { slug: null };
      }}
      propertyname="name"
      >{#snippet rendername(item: any)}
        {item.name}
      {/snippet}
      {#snippet rendercontent(item: any)}
        {#if item == null}
          Select a queue
        {:else}
          {item.name}
        {/if}
      {/snippet}
    </EntitySelector>
  </div>

  <div class="mb-10">
    <div class="mb-2 font-medium text-sm">Agent</div>
    <EntitySelector
      {loading}
      queryas={usersettings.currentworkspace}
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
      allowunselect={true}
      >{#snippet rendername(item: any)}
        {item.name}
      {/snippet}
      {#snippet rendercontent(item: any)}
        {#if item == null}
          Select an agent
        {:else}
          {item.name}
        {/if}
      {/snippet}
    </EntitySelector>
  </div>

  <Form.Field {form} name="packageid" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Package</Form.Label>
        <EntitySelector
          {loading}
          queryas={usersettings.currentworkspace}
          collectionname="agents"
          bind:value={$formData.packageid}
          basefilter={{ _type: "package" }}
          projection={{ name: 1, _type: 1 }}
          class="w-64"
          name="package"
          allowunselect={true}
        >
          {#snippet rendername(item: any)}
            {item.name}
          {/snippet}
          {#snippet rendercontent(item: any)}
            {#if item == null}
              Select a package
            {:else}
              {item.name}
            {/if}
          {/snippet}</EntitySelector
        >
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <HotkeyButton
    class="mb-10"
    variant="success"
    size="base"
    disabled={loading}
    aria-label="Update Work Item Queue"
    type="submit"
    data-shortcut="ctrl+s"
  >
    <Check />
    Update Work Item Queue</HotkeyButton
  >

  <Form.Field {form} name="success_wiq" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>on success, push to</Form.Label>
        <EntitySelector
          {loading}
          queryas={usersettings.currentworkspace}
          collectionname="mq"
          bind:value={$formData.success_wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="workitem queue"
          allowunselect={true}
          propertyname="_id"
          >{#snippet rendername(item: any)}
            {item.name}
          {/snippet}
          {#snippet rendercontent(item: any)}
            {#if item == null}
              Select a workitem queue
            {:else}
              {item.name}
            {/if}
          {/snippet}</EntitySelector
        >
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="failed_wiqid" class="mb-10">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>on failure, push to</Form.Label>
        <EntitySelector
          {loading}
          queryas={usersettings.currentworkspace}
          collectionname="mq"
          bind:value={$formData.failed_wiqid}
          basefilter={{ _type: "workitemqueue" }}
          class="w-64"
          name="workitem queue"
          allowunselect={true}
          propertyname="_id"
          >{#snippet rendername(item: any)}
            {item.name}
          {/snippet}
          {#snippet rendercontent(item: any)}
            {#if item == null}
              Select a workitem queue
            {:else}
              {item.name}
            {/if}
          {/snippet}</EntitySelector
        >
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
</form>

<CustomSuperDebug {formData} />
