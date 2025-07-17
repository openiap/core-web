<script lang="ts">
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import FS from "@isomorphic-git/lightning-fs";
  import git from "isomorphic-git";
  import http from "isomorphic-git/http/web";
  import { Check } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { Buffer } from "buffer";
  import { goto } from "$app/navigation";

  window.Buffer = Buffer;

  let loading = $state(false);
  let repositoryname = $state("test_repo_1");
  let temprepos: any = $state();
  let selectedlanguage = $state("");
  let selectedcloneurl = $state("");

  const temprepooffline = {
    languages: [
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
        name: "nodejs",
        description: "Node.js template for processing workitems",
        url: "https://github.com/openiap/nodeworkitemagent.git",
      },
      {
        name: "nodejs",
        description: "Node.js example for most SDK commands",
        url: "https://github.com/skadefro/nodetest.git",
      },
      {
        name: "nodejs",
        description: "Node.js hello world example listening to a message queue",
        url: "https://github.com/openiap/nodehellofn.git",
      },
      {
        name: "java",
        description: "Java  template for processing workitems",
        url: "https://github.com/openiap/javaworkitemagent.git",
      },
      {
        name: "java",
        description: "Java example for most SDK commands",
        url: "https://github.com/skadefro/javatest.git",
      },
      {
        name: "python",
        description: "Python template for processing workitems",
        url: "https://github.com/openiap/pythonworkitemagent.git",
      },
      {
        name: "python",
        description: "Python example for most SDK commands",
        url: "https://github.com/skadefro/pythontest.git",
      },
      {
        name: "python",
        description: "Python example using workitem queue with robotframework",
        url: "https://github.com/openiap/robotframeworkagent.git",
      },
      {
        name: "dotnet",
        description: "C# template for processing workitems",
        url: "https://github.com/openiap/dotnetworkitemagent.git",
      },
      {
        name: "dotnet",
        description: "C# example for most SDK commands",
        url: "https://github.com/skadefro/dotnettest.git",
      },
      {
        name: "php",
        description: "PHP example for most SDK commands",
        url: "https://github.com/skadefro/phptest.git",
      },
      {
        name: "rust",
        description:
          "Rust example with a small CLI for calling some SDK commands",
        url: "https://github.com/skadefro/rusttest.git",
      },
      {
        name: "c",
        description: "C template for processing workitems",
        url: "https://github.com/openiap/cworkitemagent",
      },
      {
        name: "c",
        description: "C example for most SDK commands",
        url: "https://github.com/skadefro/ctest.git",
      },
      {
        name: "c",
        description: "C hello world, messsage queue agent",
        url: "https://github.com/openiap/chellofn.git",
      },
      {
        name: "c",
        description: "C example using Conan for most SDK commands",
        url: "https://github.com/skadefro/cconantest.git",
      },
      {
        name: "binary",
        description: "Example project for calling a binary on an agent",
        url: "https://github.com/skadefro/rusttest.git",
      },
      {
        name: "browser",
        description: "Vue3 demo website showing most SDK commands",
        url: "https://github.com/openiap/vue3-web-template.git",
      },
      {
        name: "browser",
        description: "AngularJS demo website showing most SDK commands",
        url: "https://github.com/open-rpa/openflow-web-angularjs-template.git",
      },
      {
        name: "browser",
        description: "Angular11 demo website showing most SDK commands",
        url: "https://github.com/open-rpa/openflow-web-angular11-template.git",
      },
      {
        name: "browser",
        description: "Svelte 5 implementation of OpenCores frontend",
        url: "https://github.com/openiap/core-web.git",
      },
      {
        name: "browser",
        description: "Svelte 4 demo implementation of OpenCores frontend",
        url: "https://github.com/openiap/core-web-arch.git",
      },
      {
        name: "powershell",
        description: "powershell example for most SDK commands",
        url: "https://github.com/openiap/pwshtest.git",
      },
      {
        name: "powershell",
        description:
          "Example agent, process a single workitem when linked to a workitem queue",
        url: "https://github.com/openiap/powershellagent.git",
      },
      {
        name: "shell",
        description:
          "Example agent, process a single workitem when linked to a workitem queue",
        url: "https://github.com/openiap/shellagent.git",
      },
    ],
  };

  async function fetchTemprepos() {
    loading = true;
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/openiap/openiap-assistant-repos/refs/heads/main/repositories.json",
      );
      temprepos = await res.json();
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

    const user: any = await auth.client.FindOne({
      collectionname: "users",
      query: { _id: auth.profile.sub },
      jwt: auth.access_token,
      projection: { username: 1 },
    });

    let username = user.username;

    username = username.replace(/[@/]/g, "_");

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
      const author = {
        name: auth.profile?.name || "Anonymous",
        email: auth.profile?.email || "anon@example.com",
      };
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
        console.log(`Cloned repository`);
      } else {
        await git.init({
          fs,
          dir,
        });
        // create a README file
        await fs.promises.writeFile(`${dir}/README.md`, "Empty readme file");
        // add the README file to the repository
        await git.add({
          fs,
          dir,
          filepath: `README.md`,
        });

        let commitoid = await git.commit({
          fs,
          dir,
          message: "Initial commit",
          author,
        });
      }

      if (auth.isAuthenticated) {
        const headers = { Authorization: "Bearer " + auth.access_token };
        const corsProxy = base + "/api/git-proxy";
        const gitpushres = await git.push({
          headers,
          corsProxy,
          fs,
          http,
          dir,
          url: "https://dev.openiap.io" + `/git/${username}/${repositoryname}`,
        });

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
      }
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
    <div class=" font-bold mb-4">Language</div>
    <CustomSelect
      {loading}
      class="mb-4"
      selectitems={temprepos.languages.map((lang: any) => ({
        label: lang.charAt(0).toUpperCase() + lang.slice(1),
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
  {/if}

  <HotkeyButton
    variant="success"
    data-shortcut="ctrl+s"
    disabled={loading}
    class="mt-4"
    onclick={() => {
      createRepository();
      // https://dev.openiap.io/git/username/reponame
      // update username for special charaters / @ to be replaced with _
    }}
    title="Create Repository"
    aria-label="Create Repository"
  >
    <Check />
    Create Repository
  </HotkeyButton>
</div>
