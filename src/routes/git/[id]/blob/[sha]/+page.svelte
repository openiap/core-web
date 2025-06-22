<script lang="ts">
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import git from "isomorphic-git";
  import FS from "@isomorphic-git/lightning-fs";
  import http from "isomorphic-git/http/web";
  import { browser } from "$app/environment";
  import { Buffer } from "buffer";
  import Button from "$lib/components/ui/button/button.svelte";

  const { data } = $props();
  const { id, gittype, sha, access_token } = data;

  let commit = $state() as any;
  let formatedcommit = $state() as any;

  async function getbranches() {
    const url = `https://dev.openiap.io/git/${data.item.repo}`;
    const fs = new FS(data.item._id);
    const dir = "/test-clone";

    let commit = await git.readBlob({
      fs,
      dir,
      oid: sha,
    });
    console.log("Commit data:", commit);
    let buf = Buffer.from(commit.blob);
    formatedcommit = buf.toString("utf8");
  }
  getbranches();
  if (browser) {
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
  }
</script>

<div>
  {formatedcommit}
</div>

<CustomSuperDebug formData={commit} />
