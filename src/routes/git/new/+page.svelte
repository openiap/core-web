<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import { CustomSwitch } from "$lib/customswitch";
  import { auth } from "$lib/stores/auth.svelte";
  import FS from "@isomorphic-git/lightning-fs";
  import { Buffer } from "buffer";
  import git from "isomorphic-git";
  import http from "isomorphic-git/http/web";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { IsNullEmpty } from "../../../helper";

  window.Buffer = Buffer;

  let loading = $state(false);
  let repositoryname = $state("");
  let temprepos: any = $state();
  let selectedlanguage = $state("");
  let selectedcloneurl = $state("");
  let sf = $state(true);

  const temprepooffline = {
    languages: [
      "",
      "nodejs",
      "browser",
      "python",
      "dotnet",
      "rust",
      "php",
      "java",
      "c",
      "binary",
      "powershell",
      "shell",
    ],
    repositories: [
      {
        name: "Select a template",
        description: "",
        url: "",
      },
      {
            "name": "nodejs",
            "description": "Node.js hello world serverless function example",
            "url": "https://github.com/openiap/sfnodehello.git",
            "sf": true
        },
        {
            "name": "nodejs",
            "description": "Node.js template for processing workitems",
            "url": "https://github.com/openiap/nodeworkitemagent.git",
            "sf": true
        },
        {
            "name": "nodejs",
            "description": "Node.js example for most SDK commands",
            "url": "https://github.com/skadefro/nodetest.git",
            "sf": false
        },
        {
            "name": "nodejs",
            "description": "Node.js hello world example listening to a message queue",
            "url": "https://github.com/openiap/nodehellofn.git",
            "sf": false
        },
        {
            "name": "java",
            "description": "Java  template for processing workitems",
            "url": "https://github.com/openiap/javaworkitemagent.git",
            "sf": false
        },
        {
            "name": "java",
            "description": "Java example for most SDK commands",
            "url": "https://github.com/skadefro/javatest.git",
            "sf": false
        },
        {
            "name": "python",
            "description": "Python hello world serverless function example",
            "url": "https://github.com/openiap/sfpythonhello.git",
            "sf": true
        },
        {
            "name": "python",
            "description": "Python template for processing workitems",
            "url": "https://github.com/openiap/pythonworkitemagent.git",
            "sf": true
        },
        {
            "name": "python",
            "description": "Python example for most SDK commands",
            "url": "https://github.com/skadefro/pythontest.git",
            "sf": false
        },
        {
            "name": "python",
            "description": "Python example using workitem queue with robotframework",
            "url": "https://github.com/openiap/robotframeworkagent.git",
            "sf": false
        },
        {
            "name": "dotnet",
            "description": "Dotnet hello world serverless function example",
            "url": "https://github.com/openiap/sfdotnethello.git",
            "sf": true
        },
        {
            "name": "dotnet",
            "description": "C# template for processing workitems",
            "url": "https://github.com/openiap/dotnetworkitemagent.git",
            "sf": true
        },
        {
            "name": "dotnet",
            "description": "C# example for most SDK commands",
            "url": "https://github.com/skadefro/dotnettest.git",
            "sf": false
        },
        {
            "name": "php",
            "description": "Php hello world serverless function example",
            "url": "https://github.com/openiap/sfphphello.git",
            "sf": true
        },
        {
            "name": "php",
            "description": "Php template for processing workitems",
            "url": "https://github.com/openiap/phpworkitemagent.git",
            "sf": false
        },
        {
            "name": "php",
            "description": "PHP example for most SDK commands",
            "url": "https://github.com/skadefro/phptest.git",
            "sf": false
        },
        {
            "name": "rust",
            "description": "Rust example with a small CLI for calling some SDK commands",
            "url": "https://github.com/skadefro/rusttest.git",
            "sf": false
        },
        {
            "name": "c",
            "description": "C template for processing workitems",
            "url": "https://github.com/openiap/cworkitemagent",
            "sf": false
        },
        {
            "name": "c",
            "description": "C example for most SDK commands",
            "url": "https://github.com/skadefro/ctest.git",
            "sf": false
        },
        {
            "name": "c",
            "description": "C hello world, messsage queue agent",
            "url": "https://github.com/openiap/chellofn.git",
            "sf": false
        },
        {
            "name": "c",
            "description": "C example using Conan for most SDK commands",
            "url": "https://github.com/skadefro/cconantest.git",
            "sf": false
        },
        {
            "name": "binary",
            "description": "Example project for calling a binary on an agent",
            "url": "https://github.com/skadefro/rusttest.git",
            "sf": false
        },
        {
            "name": "browser",
            "description": "Vue3 demo website showing most SDK commands",
            "url": "https://github.com/openiap/vue3-web-template.git",
            "sf": false
        },
        {
            "name": "browser",
            "description": "AngularJS demo website showing most SDK commands",
            "url": "https://github.com/open-rpa/openflow-web-angularjs-template.git",
            "sf": false
        },
        {
            "name": "browser",
            "description": "Angular11 demo website showing most SDK commands",
            "url": "https://github.com/open-rpa/openflow-web-angular11-template.git",
            "sf": false
        },
        {
            "name": "browser",
            "description": "Svelte 5 implementation of OpenCores frontend",
            "url": "https://github.com/openiap/core-web.git",
            "sf": false
        },
        {
            "name": "browser",
            "description": "Svelte 4 demo implementation of OpenCores frontend",
            "url": "https://github.com/openiap/core-web-arch.git",
            "sf": false
        },
        {
            "name": "powershell",
            "description": "powershell example for most SDK commands",
            "url": "https://github.com/openiap/pwshtest.git",
            "sf": false
        },
        {
            "name": "powershell",
            "description": "Example agent, process a single workitem when linked to a workitem queue",
            "url": "https://github.com/openiap/powershellagent.git",
            "sf": false
        },
        {
            "name": "shell",
            "description": "Example agent, process a single workitem when linked to a workitem queue",
            "url": "https://github.com/openiap/shellagent.git",
            "sf": false
        },
        {
            name: "",
            description: "Select a template",
            url: "",
        },
    ],
  };

  async function fetchTemprepos() {
    loading = true;
    selectedlanguage = "";
    selectedcloneurl = "";
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/openiap/openiap-assistant-repos/refs/heads/main/repositories.json",
      );
      temprepos = await res.json();


      // here add an empty langugage for the unselected template
      temprepos.languages.unshift("");
      // here add an emtpy value for the unselected template
      temprepos.repositories.unshift({
        name: "",
        description: "Select a template",
        url: "",
      });

      // temprepos = temprepooffline; // uncomment for local development

      if (sf) {
        // remove all repo that have sf false in the temprepos
        temprepos.repositories = temprepos.repositories.filter(
          (repo: any) => repo.sf !== false,
        );
        // also remove the languages that are not in the filtered repositories
        const langs = new Set(
          temprepos.repositories.map((repo: any) => repo.name),
        );
        temprepos.languages = temprepos.languages.filter(
          (lang: any) => langs.has(lang) || lang === "",
        );
      }
    } catch (err) {
      toast.error("Error loading template repos", {
        description: (err as any)?.message || String(err),
      });
      temprepos = temprepooffline;
    } finally {
      loading = false;
    }
  }
  fetchTemprepos();

  function isDir(stat: any) {
    if (stat == null) return false;
    if (typeof stat.isDirectory === "function") {
      return stat.isDirectory();
    }
    return stat.type === "dir";
  }

  async function removeDirectory(fs: any, targetPath: string) {
    try {
      const entries = await fs.promises.readdir(targetPath);
      for (const entry of entries) {
        const entryPath = `${targetPath}/${entry}`;
        const stat = await fs.promises.stat(entryPath);
        if (isDir(stat)) {
          await removeDirectory(fs, entryPath);
        } else {
          await fs.promises.unlink(entryPath);
        }
      }
      await fs.promises.rmdir(targetPath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async function addAllFilesToIndex(fs: any, dir: string, relativePath = "") {
    const absolutePath = relativePath ? `${dir}/${relativePath}` : dir;
    let entries: string[] = [];
    try {
      entries = await fs.promises.readdir(absolutePath);
    } catch (err: any) {
      if (err?.code === "ENOTDIR") {
        return;
      }
      throw err;
    }

    for (const entry of entries) {
      if (entry === ".git") continue;
      const childRelative = relativePath ? `${relativePath}/${entry}` : entry;
      const childAbsolute = `${absolutePath}/${entry}`;
      const stat = await fs.promises.stat(childAbsolute);
      if (isDir(stat)) {
        await addAllFilesToIndex(fs, dir, childRelative);
      } else {
        await git.add({ fs, dir, filepath: childRelative });
      }
    }
  }

  async function createRepository() {
    if (repositoryname.trim() === "") {
      // also add a check for space and special characters
      toast.error("Repository name cannot be empty");
      return;
    } else if (!/^[\w-]+$/.test(repositoryname)) {
      toast.error(
        "Repository name can only contain letters, numbers, underscores, and hyphens",
      );
      return;
    }
    if (selectedlanguage != "") {
      if (selectedcloneurl.trim() === "") {
        toast.error("You must select a template");
        return;
      }
    }

    const user: any = await auth.client.FindOne({
      collectionname: "users",
      query: { _id: auth.profile.sub },
      jwt: auth.access_token,
      projection: { username: 1 },
    });

    let username = user.username;

    username = username
      .replace(/[@.]/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();
    repositoryname = repositoryname
      .replace(/[@.]/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    const newrepo: any = await auth.client.FindOne({
      collectionname: "git",
      query: { ref: "HEAD", repo: username + "/" + repositoryname },
      jwt: auth.access_token,
    });
    if (newrepo != null) {
      toast.error(`Repository ${repositoryname} already exists`);
      return;
    }

    try {
      loading = true;
      const fs = new FS(repositoryname);
      const dir = "/test-clone";

      if (selectedcloneurl) {
        const headers = { Authorization: "Bearer " + auth.access_token };
        const corsProxy = base + "/api/git-proxy";

        await git.clone({
          fs,
          http,
          dir,
          url: selectedcloneurl,
          headers,
          corsProxy,
          singleBranch: false,
        });
        await removeDirectory(fs, `${dir}/.git`);
        await git.init({
          fs,
          dir,
          defaultBranch: "main",
        });
        await addAllFilesToIndex(fs, dir);
        await git.commit({
          fs,
          dir,
          message:
            "Initial commit from template " +
            (selectedlanguage || repositoryname),
          author: {
            name: auth.profile?.name || username,
            email: auth.profile?.email || `${username}@example.com`,
          },
        });
        if (auth.isAuthenticated) {
          const headers = { Authorization: "Bearer " + auth.access_token };
          const corsProxy = base + "/api/git-proxy";
          await git.push({
            headers,
            corsProxy,
            fs,
            http,
            dir,
            url: auth.baseurl + `/git/${username}/${repositoryname}`,
          });
        }
      } else {
        await auth.client.InsertOne({
          collectionname: "git",
          item: {
            repo: username + "/" + repositoryname,
            _type: "hash",
            ref: "HEAD",
            sha: null,
            headref: null,
            name: `${username + "/" + repositoryname}`,
            _acl: [
              {
                rights: -1,
                name: auth.profile.name,
                _id: auth.profile.sub,
              },
            ],
          },
          jwt: auth.access_token,
        });
      }

      const newrepo: any = await auth.client.FindOne({
        collectionname: "git",
        query: { ref: "HEAD", repo: username + "/" + repositoryname },
        jwt: auth.access_token,
      });

      toast.success(
        `Repository ${repositoryname} created successfully redirecting...`,
      );
      loading = false;
      goto(base + `/git/${newrepo._id}/${newrepo.sha}`); // navigate to the new repository page
    } catch (err) {
      loading = false;
      console.error("Error creating repository:", err);
      toast.error("Error creating repository", {
        description: (err as any)?.message || String(err),
      });
      cleanup();
      return;
    }
  }

  async function checkrepoexisits() {
    loading = true;
    try {
    } catch (err) {
      loading = false;
      console.error("Error checking repository existence:", err);
      return false;
    }
  }

  function cleanup() {
    indexedDB
      .databases()
      .then((r) => {
        for (const db of r) {
          let dbname = db.name as any;
          if (dbname.startsWith(repositoryname)) {
            const DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
            DBDeleteRequest.onerror = (event) => {};
            DBDeleteRequest.onsuccess = (event) => {};
          }
        }
        toast.error("Repository creation failed, cleaned up any created DBS");
      })
      .catch((error) => {
        toast.error("Error cleaning up DBS: " + error.message);
      });
  }
</script>

<div>
  <div>
    <div class="text-xl font-bold mb-4">Create New Repository</div>
  </div>
  <CustomInput
    height="h-10"
    bind:value={repositoryname}
    label="Repository Name"
    placeholder="Enter repository name"
    type="text"
    class="mb-4"
    disabled={loading}
  />

  {#if temprepos}
    <div class="text-xl font-bold mb-4">Choose template</div>
    <div class="flex items-center mb-4 space-x-2">
      <CustomSwitch
        bind:checked={sf}
        onclick={async () => {
          await fetchTemprepos();
        }}
      />
      <p>Only show serverless repositories</p>
    </div>
    <div class=" font-bold mb-4">Language</div>
    <CustomSelect
      {loading}
      class="mb-4"
      selectitems={temprepos.languages.map((lang: any) => ({
        label:
          lang == ""
            ? "Select a language"
            : lang.charAt(0).toUpperCase() + lang.slice(1),
        value: lang,
      }))}
      type="single"
      bind:value={selectedlanguage}
      triggerContent={() => selectedlanguage || "Select a language"}
      onValueChangeFunction={(value) => {
        if (value === "empty") {
          selectedlanguage = "";
        } else {
          selectedlanguage = value;
        }
        selectedcloneurl = "";
      }}
    />
  {/if}

  {#if selectedlanguage && temprepos}
    <div class=" font-bold mb-4">Template</div>
    <CustomSelect
      {loading}
      class="mb-4"
      selectitems={temprepos.repositories
        .filter((repo: any) => repo.name === selectedlanguage)
        .map((repo: any) => ({
          label: `${repo.name} - ${repo.description}`,
          value: repo.url,
        }))}
      type="single"
      bind:value={selectedcloneurl}
      triggerContent={() => {
        // show the description of the selected clone URL
        const selectedRepo = temprepos.repositories.find(
          (repo: any) => repo.url === selectedcloneurl,
        );
        return selectedRepo
          ? `${selectedRepo.name} - ${selectedRepo.description}`
          : "Select a template";
      }}
      onValueChangeFunction={(value) => {
        if (value === "empty") {
          selectedcloneurl = "";
        } else {
          selectedcloneurl = value;
        }
      }}
    />

    {#if !IsNullEmpty(selectedcloneurl)}
      <CustomInput
        height="h-10"
        bind:value={selectedcloneurl}
        label="URL"
        placeholder="Enter repository URL"
        type="text"
        class="mb-4"
        disabled={true}
      />
    {/if}
  {/if}

  <HotkeyButton
    variant="success"
    data-shortcut="ctrl+s"
    disabled={loading}
    class="mt-4"
    onclick={() => {
      createRepository();
    }}
    title="Create Repository"
    aria-label="Create Repository"
  >
    <Check />
    Create Repository
  </HotkeyButton>
</div>

<CustomSuperDebug formData={temprepos} />
