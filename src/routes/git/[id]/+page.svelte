<script lang="ts">
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import git from "isomorphic-git";
  import FS from "@isomorphic-git/lightning-fs";
  import http from "isomorphic-git/http/web";
  import { browser } from "$app/environment";
  import { Buffer } from "buffer";
    import Button from "$lib/components/ui/button/button.svelte";

  const { data } = $props();

  async function doit() {
    const url = "https://home.openiap.io/git/test1";
    const fs = new FS("testfs");
    const dir = "/test-clone";
    await git.clone({ fs, http, dir, url, });
    let branches = await git.listBranches({ fs, dir })
    console.log(branches)
    let remoteBranches = await git.listBranches({ fs, dir, remote: 'origin' })
    console.log(remoteBranches)

    let newfile = dir + '/newfile.txt';
    await fs.promises.writeFile(newfile, `# TEST`)
    await git.add({ fs, dir, filepath: 'newfile.txt' })

    // All the files in the previous commit
    let files1 = await git.listFiles({ fs, dir, ref: 'HEAD' })
    console.log(files1)
    // All the files in the current staging area
    let files2 = await git.listFiles({ fs, dir })
    console.log(files2)

  }
  if (browser) {
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
  }
</script>

<Button onclick={doit}>
  Do it
</Button>
<CustomSuperDebug formData={data.item} />
