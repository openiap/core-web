<script lang="ts">
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import git from "isomorphic-git";
  import FS from "@isomorphic-git/lightning-fs";
  import http from "isomorphic-git/http/web";
  import { browser } from "$app/environment";
  import { Buffer } from "buffer";

  const { data } = $props();

  if (browser) {
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
    const fs = new FS("testfs");
    const dir = "/test-clone";
    git
      .clone({
        fs,
        http,
        dir,
        url: "https://dev.openiap.io/git/test1",
      })
      .then(console.log);
  }
</script>

<CustomSuperDebug formData={data.item} />
