<script lang="ts">
    import git from "isomorphic-git";
    import FS from "@isomorphic-git/lightning-fs";
    import http from "isomorphic-git/http/web";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    const { children, data } = $props();

    let files: any[] = $state([]);

    async function cloneRepo() {
        const author = {
            name: "Your Name",
            email: "you@example.com",
        };
        const url = `https://dev.openiap.io/git/${data.item.repo}`;
        const fs = new FS(data.item._id);
        const dir = "/test-clone";
        await git.clone({ fs, http, dir, url });
        await git.pull({
            fs,
            http,
            dir,
            url,
            author,
        });
        const div = document.getElementById("gitstatus");
        if (div) {
            div.textContent = "ready";
        }
        // files = (await git.listFiles({ fs, dir })) as string[];
        files = ((await git.readTree({ fs, dir, oid: data.item.sha })) as any)
            .tree;
        console.log("Files in repo:", $state.snapshot(files));
    }
    cloneRepo();
</script>

<div id="gitstatus" class="hidden">unknown</div>

<div class="flex flex-row gap-4">
    <ul>
        {#each files as file}
            <li
                onclick={() => {
                    goto(base + `/git/${data.item._id}/blob/${file.oid}`); // Navigate to the file path
                }}
            >
                {file.path}
            </li>
        {/each}
    </ul>

    <div>
        {@render children()}
    </div>
</div>
