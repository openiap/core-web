<script lang="ts">
    import { Formio, FormBuilder } from 'formiojs';
    import { base } from "$app/paths";
    import 'formiojs/dist/formio.builder.min.css';
    import { onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Input } from "$lib/components/ui/input";
    import Button from "$lib/components/ui/button/button.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    let builder:FormBuilder = null as any;
    let ref = $state({}) as any;
    let message = $state('');
    let data = $state({
        _type: "form",
        name: "",
        schema: {
        components: [
    {
      type: 'textfield',
      key: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your first name.',
      input: true,
      tooltip: 'Enter your <strong>First Name</strong>',
      description: 'Enter your <strong>First Name</strong>'
    },
    {
      type: 'textfield',
      key: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      input: true,
      tooltip: 'Enter your <strong>Last Name</strong>',
      description: 'Enter your <strong>Last Name</strong>'
    },
    {
      type: "select",
      label: "Favorite Things",
      key: "favoriteThings",
      placeholder: "These are a few of your favorite things...",
      data: {
        values: [
          {
            value: "raindropsOnRoses",
            label: "Raindrops on roses"
          },
          {
            value: "whiskersOnKittens",
            label: "Whiskers on Kittens"
          },
          {
            value: "brightCopperKettles",
            label: "Bright Copper Kettles"
          },
          {
            value: "warmWoolenMittens",
            label: "Warm Woolen Mittens"
          }
        ]
      },
      dataSrc: "values",
      template: "<span>{{ item.label }}</span>",
      multiple: true,
      input: true
    },
    {
      type: 'button',
      action: 'submit',
      label: 'Submit',
      theme: 'primary'
    }
  ]
        }
    });

    async function createfrom() {
        try {
            // builder = await Formio.createForm(ref, data.schema, {
            // @ts-ignore
            builder = await Formio.builder(ref, data.schema, {
                builder: {
                    basic: false,
                    advanced: false,
                    data: {
                        display: 'form',
                        components: []
                    }
                }
            });
        } catch (e) {
        }
    }
    let firstrun = $state(true);
    if(browser) {
        $effect(() => {
            if(Object.keys(ref).length > 0 && firstrun == true) {
                createfrom();
                firstrun = false;
            }
        });
        onDestroy(() => {
          try {
              builder.destroy();
            } catch (e) {
            }
        });
    }
    async function saveform() {
        message = '';
        if(data.name == "") {
            message = 'Please enter form name';
            return;
        }
        // @ts-ignore
        data.schema = builder.schema;

        try {
          const result = await auth.client.InsertOne({
            collectionname: "forms",
            item: { ...data, _type: "form" },
            jwt: auth.access_token,
          });
          toast.success("Form created");
          goto(base + `/form`);
        } catch (error: any) {
          message = error.message;
          toast.error("Error", {
            description: error.message,
          });
        } finally {
        }

    }
</script>

<div>
    {message}
</div>
<link rel='stylesheet' href='{base}/bootstrap-scope.css'>
<div>
  <div class="flex items-center justify-start space-x-4 mb-4">
    <Input class="max-w-sm" type="text" placeholder="Enter form name" bind:value={data.name} />
    <Button onclick={saveform}>Create form</Button>
  </div>
    <div class="bootstrap-scope" bind:this={ref}></div>
</div>