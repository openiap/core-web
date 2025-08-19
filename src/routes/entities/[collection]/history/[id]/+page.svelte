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
  import {
    ArchiveRestore,
    Clock,
    Diff,
    Download,
    Eye,
    FileSearch,
    Upload,
    X,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  // @ts-ignore
  import * as jsondiffpatch from "jsondiffpatch/dist/jsondiffpatch.umd.js";
  import { tick } from "svelte";

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

  let viewDiffNow = $state(false);
  let diffNowData = $state(null);
  let viewDiffThen = $state(false);
  let diffThenData = $state(null);

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
      } else if (action == "diffnow") {
        viewDiffNow = true;
        await tick();

        const response = await auth.client.GetDocumentVersion({
          collectionname: collectionname,
          id: item.id,
          version: item._version,
          jwt: auth.access_token,
        });
        console.log("response", response);
        const delta = jsondiffpatch.diff(item, response);
        const diffNowElem = document.getElementById("diffnow");
        if (diffNowElem) {
          console.log("diffNowElem", diffNowElem);
          diffNowElem.innerHTML = jsondiffpatch.formatters.html.format(
            delta,
            {},
          );
        }
      } else if (action == "diffthen") {
        viewDiffThen = true;
        await tick();

        diffThenData = item.delta;
        const diffThenElem = document.getElementById("diffthen");
        if (diffThenElem) {
          console.log(diffThenData);
          diffThenElem.innerHTML = jsondiffpatch.formatters.html.format(
            diffThenData,
            {},
          );
        }
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
      aria-label="Diff Now"
      onclick={() => single_item_click(item, "diffnow")}
      size="tableicon"
      variant="icon"
    >
      <Diff />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Diff Then"
      onclick={() => single_item_click(item, "diffthen")}
      size="tableicon"
      variant="icon"
    >
      <Clock />
    </HotkeyButton>

    <HotkeyButton
      aria-label="View"
      onclick={() => single_item_click(item, "view")}
      size="tableicon"
      variant="icon"
    >
      <Eye />
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
  <AlertDialog.Content class="max-w-4xl h-[80vh] overflow-y-auto">
    <AlertDialog.Title>{entity?.name}</AlertDialog.Title>
    <AlertDialog.Header class="overflow-x-auto">
      <AlertDialog.Description class="h-fit">
        <pre>{JSON.stringify(entity ? entity : {}, null, 2)}</pre>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        title="Download"
        aria-label="Download"
        size="entity"
        onclick={(e) => {
          single_item_click(viewData, "download");
        }}
      >
        <Download />
        Download
      </HotkeyButton>
      <HotkeyButton
        aria-label="Restore"
        title="Restore"
        size="entity"
        onclick={(e) => {
          single_item_click(viewData, "restore");
        }}
      >
        <ArchiveRestore />
        Restore
      </HotkeyButton>
      <HotkeyButton
        aria-label="Cancel"
        title="Cancel"
        size="entity"
        onclick={(e) => {
          viewEntity = false;
        }}
      >
        <X />
        Cancel
      </HotkeyButton>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root
  open={viewDiffNow}
  onOpenChange={(open) => (viewDiffNow = open)}
>
  <AlertDialog.Content class="max-w-4xl h-[80vh] overflow-y-auto">
    <AlertDialog.Title>{entity?.name}</AlertDialog.Title>
    <AlertDialog.Header class="overflow-x-auto">
      <AlertDialog.Description class="h-fit">
        <div id="diffnow"></div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        aria-label="Cancel"
        title="Cancel"
        size="entity"
        onclick={(e) => {
          viewEntity = false;
        }}
      >
        <X />
        Cancel
      </HotkeyButton>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root
  open={viewDiffThen}
  onOpenChange={(open) => (viewDiffThen = open)}
>
  <AlertDialog.Content class="max-w-4xl h-[80vh] overflow-y-auto">
    <AlertDialog.Title>{entity?.name}</AlertDialog.Title>
    <AlertDialog.Header class="overflow-x-auto">
      <AlertDialog.Description class="h-fit">
        <div id="diffthen"></div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        aria-label="Cancel"
        title="Cancel"
        size="entity"
        onclick={(e) => {
          viewEntity = false;
        }}
      >
        <X />
        Cancel
      </HotkeyButton>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
