<script lang="ts">
  import { browser } from "$app/environment";
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import FS from "@isomorphic-git/lightning-fs";
  import { Buffer } from "buffer";
  import {page} from "$app/stores";

  const { data } = $props();
  const { id, gittype, sha, access_token, path } = data;
  let commit = $state() as any;
  const pathto = $derived(() => (data.path ? data.path : ""));

  async function getbranches() {
    const url = `https://dev.openiap.io/git/${data.item.repo}`;
    const fs = new FS(data.item._id);
    const dir = "/test-clone";

    if (pathto() != null && pathto() != "") {
      commit = await fs.promises.readFile(dir + "/" + pathto(), "utf8");
      await fs.promises.writeFile(dir + "/" + pathto(), commit + `\n # nabeel`);
    }
  }
  if (browser) {
    getbranches();
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
  }
  $effect(() => {
    if (pathto() != null && pathto() != "") {
      getbranches();
    }
  });
</script>

{#key $page.url.pathname}
  <div>
    {commit}
  </div>
{/key}

<CustomSuperDebug formData={commit} />
