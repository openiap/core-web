<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Download, Filter, Inspect, Upload } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let viewEntity = $state(false);
  let viewData: any = $state(null);
  let entity: any = $state(null);

  async function single_item_click(item: any, action: string = "view") {
    const collectionname = data.collectionname;
    viewData = item;
    try {
      entity = await auth.client.GetDocumentVersion({
        collectionname: collectionname,
        id: item.id,
        version: item._version,
        jwt: auth.access_token,
      });
      if (action == "view") {
        viewEntity = true;
      } else if (action == "download") {
        const filecontent = JSON.stringify(entity, null, 2);
        var blob = new Blob([filecontent], { type: item.contentType });
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = item.id + ".json";
        link.click();
      } else if (action == "restore") {
        const exist = await auth.client.FindOne({
          collectionname: collectionname,
          query: { _id: item.id },
          projection: { _id: 1, name: 1 },
          jwt: auth.access_token,
        });
        if (exist) {
          await auth.client.UpdateOne({
            collectionname: collectionname,
            item: entity,
            jwt: auth.access_token,
          });
          // await auth.client.InsertOne({collectionname: collectionname, item: entity, jwt: auth.access_token});
        } else {
          await auth.client.InsertOne({
            collectionname: collectionname,
            item: entity,
            jwt: auth.access_token,
          });
        }
        toast.success("Restored successfully", {
          description: "",
        });
        goto(base + `/entities/${collectionname}/edit/${entity._id}`);
      }
    } catch (error: any) {
      toast.error("Error while fetching entity", {
        description: error.message,
      });
    }
  }
  async function handleAccept() {
    try {
      // await deleteitem(deleteData);
      // toast.success("Deleted successfully", {
      //   description: "",
      // });
      // ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="mb-4">
  <SearchInput bind:searchstring />
</div>

<Entities
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="View"
      onclick={() => single_item_click(item, "view")}
      size="tableicon"
      variant="icon"
    >
      <Inspect />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Download"
      onclick={() => single_item_click(item, "download")}
      size="tableicon"
      variant="icon"
    >
      <Download />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Restore"
      onclick={() => single_item_click(item, "restore")}
      size="tableicon"
      variant="icon"
    >
      <Upload />
    </HotkeyButton>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>

<AlertDialog.Root
  open={viewEntity}
  onOpenChange={(open) => (viewEntity = open)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{entity?.name}</AlertDialog.Title>
      <AlertDialog.Description>
        <pre>{JSON.stringify(entity ? entity : {}, null, 2)}</pre>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        aria-label="Download"
        class="w-full justify-start"
        size="entity"
        onclick={(e) => {
          single_item_click(viewData, "download");
        }}
      >
        Download
      </HotkeyButton>
      <HotkeyButton
        aria-label="Restore"
        class="w-full justify-start"
        size="entity"
        onclick={(e) => {
          single_item_click(viewData, "restore");
        }}
      >
        Restore
      </HotkeyButton>
      <HotkeyButton
        aria-label="Cancel"
        class="w-full justify-start"
        size="entity"
        onclick={(e) => {
          viewEntity = false;
        }}
      >
        Cancel
      </HotkeyButton>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
