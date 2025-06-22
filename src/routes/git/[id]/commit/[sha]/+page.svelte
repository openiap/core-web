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
  let remoteBranches = $state();
  let commits = $state();

  async function getbranches() {
    const url = `https://dev.openiap.io/git/${data.item.repo}`;
    const fs = new FS(data.item._id);
    const dir = "/test-clone";

    commit = await git.readCommit({
      fs,
      dir,
      oid: sha,
    });

    const commits = await git.log({ fs, dir, depth: 10 });

    // let newfile = dir + '/newfile.txt';
    // await fs.promises.writeFile(newfile, `# TEST`)
    // await git.add({ fs, dir, filepath: 'newfile.txt' })

    // // All the files in the previous commit
    // let files1 = await git.listFiles({ fs, dir, ref: 'HEAD' })
    // console.log(files1)
    // // All the files in the current staging area
    // let files2 = await git.listFiles({ fs, dir })
    // console.log(files2)
  }
  getbranches();
  if (browser) {
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
  }
</script>

<div>
  {commit && commit.commit && commit.commit.message}
</div>

<CustomSuperDebug formData={commit} />
