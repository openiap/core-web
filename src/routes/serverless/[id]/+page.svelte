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
  import { Check, User } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { editFormSchema } from "../schema.js";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";

  const { data } = $props();

  let loading = $state(false);
  let runasuser = $state(data.item.runas == "" ? true : false);

  if (data.item != null) {
    if (data.item.anonymous == null) {
      data.item.anonymous = false;
    }
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

          if (runasuser) {
            // let item = await auth.client.FindOne<any>({
            //   collectionname: "users",
            //   query: { _id: form.data.runas, _type: "user" },
            //   projection: {
            //     _id: 1,
            //   },
            //   jwt: auth.access_token,
            // });
            // if (item == null || item == undefined) {
            //   toast.error("Error", {
            //     description: "User not found",
            //   });
            //   cancel();
            //   loading = false;
            //   return;
            // }
            // console.log("user ", item);
            const newtoken: any = await auth.client.CustomCommand({
              command: "issueusertoken",
              // @ts-ignore
              data: {
                _workspaceid: workspaceid,
                id: form.data.runas,
                name: "SF for " + form.data.name,
                exp: "365d", // 1 year
              },
              jwt: auth.access_token,
            });
            form.data.runas = JSON.parse(newtoken).id;

            console.log("token created ", form.data.runas);
          }
          // else {
          //   let item = await auth.client.FindOne<any>({
          //     collectionname: "usertokens",
          //     query: { _id: form.data.runas, _type: "usertoken", revoked: false },
          //     jwt: auth.access_token,
          //   });
          //   if (item == null) {
          //     toast.error("Error", {
          //       description: "Access token not found",
          //     });
          //     cancel();
          //     loading = false;
          //     return;
          //   }
          // }

          await auth.client.CustomCommand({
            command: "ensuresfunc",
            // @ts-ignore
            data: form.data,
            jwt: auth.access_token,
          });

          toast.success("Serverless Function updated");
          goto(base + `/serverless`);
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

    <!-- insert CustomSwitch for field anonymous -->
    <Form.Field {form} name="anonymous" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Anonymous</Form.Label>
          <CustomSwitch
            disabled={loading}
            {...props}
            bind:checked={$formData.anonymous}
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

    <Form.Field {form} name="environment" class="w-full">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Environment</Form.Label>
          <ObjectInput
            disabled={loading}
            {...props}
            bind:value={$formData.environment}
          />
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

    <!-- add token selection here set _id to the -->
    <!-- or select user then create api key for that user and add the _id of the apikey to default 1 year expiration -->
    <!-- runas key -->
    <Form.Field {form} name="runas" class="mb-10">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Run as ({runasuser ? "User" : "Access Token"})</Form.Label
          >
          <div class="flex items-center space-x-2 py-4">
            <Form.Label>Access token</Form.Label>
            <CustomSwitch
              bind:checked={runasuser}
              onclick={() => {
                $formData.runas = "";
              }}
            />
            <Form.Label>User</Form.Label>
          </div>
          {#if runasuser}
            <div class="md:flex md:items-center md:space-x-4 my-2">
              <Entityselector
                name="User"
                propertyname="_id"
                queryas={usersettings.currentworkspace}
                width="md:w-fit w-64"
                class="mb-4 md:mb-0"
                disabled={loading}
                collectionname="users"
                basefilter={{ _type: "user" }}
                bind:value={$formData.runas}
                allowunselect={false}
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
              <HotkeyButton
                aria-label="User Details"
                disabled={!Boolean($formData.runas) || loading}
                onclick={() => {
                  goto(base + `/user/${$formData.runas}`);
                }}><User />User Details</HotkeyButton
              >
            </div>
          {:else}
            <Entityselector
              name="Access Token"
              propertyname="_id"
              queryas={usersettings.currentworkspace}
              width="md:w-fit w-64"
              class="mb-4 md:mb-0"
              disabled={loading}
              collectionname="usertokens"
              basefilter={{ _type: "usertoken", revoked: false }}
              bind:value={$formData.runas}
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
          {/if}
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
      Update Serverless</HotkeyButton
    >
  </form>
{:else}
  <div>Data not found or access denied</div>
{/if}

<CustomSuperDebug {formData} />
