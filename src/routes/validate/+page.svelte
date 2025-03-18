<script lang="ts">
  import { Formio } from "formiojs";
  import { mode } from "mode-watcher";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { auth } from "$lib/stores/auth.svelte";
  import { browser } from "$app/environment";
  import { toast } from "svelte-sonner";
  import { base } from "$app/paths";
  import { Header } from "$lib/components/ui/dialog/index.js";
  import { goto } from "$app/navigation";

  const { data } = $props();
  let _mode = $state.snapshot($mode);
  let step = $state("");
  let firstrun = $state(true);
  let form: any = null;
  let message = $state("");
  let emailcode = $state("");
  let ref = $state(null) as any;
  function updateStyle() {
    try {
      const refList1 =
        "input, select, textarea, div.card, div.dropdown, li.list-group-item, li.list-group-header, div.choices__inner, div.input-group-text, input.form-control, list-group-item";
      const sidebarRef1 = ref.querySelectorAll(refList1);
      if (sidebarRef1.length) {
        if ($mode === "dark") {
          sidebarRef1.forEach((el: any) => {
            el.classList.add("darkTheme");
            el.classList.remove("lightTheme");
            el.classList.remove("bg-light");
          });
        } else if ($mode === "light") {
          sidebarRef1.forEach((el: any) => {
            el.classList.add("lightTheme");
            el.classList.remove("darkTheme");
          });
        }
      }

      const refList2 =
        "button, [ref='button'], [ref='datagrid-dataMap-addRow'], [ref='editgrid-editGrid-addRow']";
      const sidebarRef2 = ref.querySelectorAll(refList2);
      if (sidebarRef2.length) {
        if ($mode === "dark") {
          sidebarRef2.forEach((el: any) => {
            el.classList.add("darkThemeButton");
            el.classList.remove("lightThemeButton");
          });
        } else if ($mode === "light") {
          sidebarRef2.forEach((el: any) => {
            el.classList.add("lightThemeButton");
            el.classList.remove("darkThemeButton");
          });
        }
      }
      // const refList6 = "[ref='datagrid-dataGrid-removeRow']";
      // const sidebarRef6 = ref.querySelectorAll(refList6);
      // if (sidebarRef6.length) {
      //     if ($mode === "dark") {
      //         sidebarRef6.forEach((el: any) => {
      //             el.classList.add("lightDeleteButton");
      //             el.classList.remove("lightThemeButton");
      //         });
      //     } else if ($mode === "light") {
      //         sidebarRef6.forEach((el: any) => {
      //             el.classList.add("lightDeleteButton");
      //             el.classList.remove("darkThemeButton");
      //         });
      //     }
      // }

      const refList3 = "[ref='sidebar-anchor']";
      const sidebarRef3 = ref.querySelectorAll(refList3);
      if (sidebarRef3.length) {
        if ($mode === "dark") {
          sidebarRef3.forEach((el: any) => {
            el.classList.add("darkThemeSidebarButton");
            el.classList.remove("lightThemeSidebarButton");
          });
        } else if ($mode === "light") {
          sidebarRef3.forEach((el: any) => {
            el.classList.add("lightThemeSidebarButton");
            el.classList.remove("darkThemeSidebarButton");
          });
        }
      }

      const refList4 = "[ref='form-builder-panel']";
      const sidebarRef4 = ref.querySelectorAll(refList4);
      if (sidebarRef4.length) {
        sidebarRef4.forEach((el: any) => {
          el.classList.add("themeMargin");
        });
      }

      const refList5 = "table";
      const sidebarRef5 = ref.querySelectorAll(refList5);
      if (sidebarRef5.length) {
        if ($mode === "dark") {
          sidebarRef5.forEach((el: any) => {
            el.classList.add("darkTheme");
            el.classList.remove("lightTheme");
            el.classList.remove("bg-light");
          });
        } else if ($mode === "light") {
          sidebarRef5.forEach((el: any) => {
            el.classList.add("lightTheme");
            el.classList.remove("darkTheme");
          });
        }
      }
    } catch (error) {}
  }
  async function createfrom() {
    try {
      if (data.form == null) {
        message = "Form not found (" + auth.config.validate_user_form + ")";
        return;
      }
      // @ts-ignore
      if (Formio == null || typeof Formio.builder !== "function") {
        setTimeout(async () => {
          createfrom();
        }, 200);
        return;
      }
    } catch (error) {
      setTimeout(async () => {
        createfrom();
      }, 200);
      return;
    }
    try {
      if (form != null) form.destroy();
    } catch (e) {}

    try {
      if (auth.profile != null && Object.keys(auth.profile).length > 0) {
        let protocol = "http:";
        if (auth.config?.wsurl.startsWith("wss")) protocol = "https:";

        Formio.setBaseUrl(protocol + "//" + auth.config?.domain);
        Formio.setProjectUrl(protocol + "//" + auth.config?.domain);
        // @ts-ignore
        form = await Formio.createForm(ref, data.form.schema, {
          breadcrumbSettings: { clickable: true },
          buttonSettings: { showCancel: false },
        });
        form.on("submit", async (submission: any) => {
          try {
            if (submission != null && submission.data != null) {
              await auth.client.CustomCommand({
                command: "validateuserform",
                data: JSON.stringify(submission.data),
                jwt: auth.access_token,
              });
              await getstep();
            } else {
              toast.error("Error submitting form", {
                description: "No data submitted",
              });
            }
          } catch (error: any) {
            console.error(error);
            toast.error("Error submitting form", {
              description: error.message,
            });
          }
        });
        // set form data
        if (auth.profile != null && Object.keys(auth.profile).length > 0) {
          form.submission = {
            data: auth.profile,
          };
        }
        updateStyle();
        setTimeout(() => {
          updateStyle();
        }, 300);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error creating form", {
        description: e.message,
      });
    }
  }

  async function getstep() {
    try {
      await auth.reloadUser();
      console.log("getstep", $state.snapshot(auth.profile));
      if (auth.profile.formvalidated != true) {
        console.log("step form");
        step = "form";
      } else if (
        auth.profile.validated == false &&
        auth.profile.formvalidated == true
      ) {
        console.log("step email");
        step = "email";
      } else if (data.workspace == null) {
        console.log("step workspace");
        step = "workspace";
      } else {
        console.log("step done");
        step = "done";
        goto(base + "/");
      }
    } catch (error:any) {
      console.error(error);
      toast.error("Error getting step", {
        description: error.message,
      });
    }
  }
  getstep();
  if (
    browser &&
    auth.profile.formvalidated != true &&
    auth.config.validate_user_form != null &&
    auth.config.validate_user_form != ""
  ) {
    $effect(() => {
      if (_mode != $mode) {
        _mode = $mode;
        updateStyle();
      }
      if (ref != null && firstrun == true) {
        createfrom();
        // firstrun = false;
      }
    });
    createfrom();
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="{base}/font-awesome/css/font-awesome.min.css" />
  <link rel="stylesheet" href="{base}/formio-dialog-content.css" />
  <link rel="stylesheet" href="{base}/formio.form.min.css" />
</svelte:head>

<div>
  {message}
</div>
<div class="px-4 py-5 overflow-auto h-screen">
  {#if step == "form"}
    <div
      class="bootstrap-scope formio-dialog-content p-2"
      bind:this={ref}
    ></div>
  {/if}
  {#if step == "email"}
    <div class="font-bold mb-4">Validate User</div>
    <div>
      <Card.Card class="mb-10">
        <Card.Header>Email validation</Card.Header>
        <Card.Content>
          <div class="grid gap-2">
            <Label for="email">Email Code</Label>
            <Input
              type="text"
              bind:value={emailcode}
              placeholder="Email code"
              required
              autocomplete="off"
            />
          </div>
          <div class="grid grid-cols-2 gap-4 md:flex md:space-x-5 my-6">
            <HotkeyButton
              onclick={async () => {
                try {
                  await auth.client.CustomCommand({
                    command: "validateuseremail",
                    data: JSON.stringify({ code: $state.snapshot(emailcode) }),
                    jwt: auth.access_token,
                  });
                  toast.success("Email validated", {
                    description: "Email has been validated",
                  });
                  await getstep();
                } catch (error: any) {
                  console.error(error);
                  toast.error("Error validating email", {
                    description: error.message,
                  });
                }
              }}
              variant="success"
              size="base"
              aria-label="Validate email"
              data-shortcut="enter"
              >Validate Code
            </HotkeyButton>
            <HotkeyButton
              onclick={async () => {
                try {
                  await auth.client.CustomCommand({
                    command: "resendvalidateuseremail",
                    jwt: auth.access_token,
                  });
                  toast.success("Email sent", {
                    description: "Email has been sent",
                  });
                  await getstep();
                } catch (error: any) {
                  console.error(error);
                  toast.error("Error sending email", {
                    description: error.message,
                  });
                }
              }}
              variant="base"
              size="base"
              aria-label="Resend Code"
              >Resend Code
            </HotkeyButton>
            <HotkeyButton
              variant="base"
              size="base"
              aria-label="Update Email"
              onclick={() => {
                step = "form";
              }}
              >Update Email
            </HotkeyButton>
          </div>
          <div>
            <small>
              Please check your inbox for an email with a validation code. Some
              times it can take up to several minutes for the email to arrive.
              If you did not receive an email, please check your spam folder. To
              resend the email, click the "Resend Code" button. If you need to
              update your email address, please click the "Update Email" button.
            </small>
          </div>
        </Card.Content>
      </Card.Card>
    </div>
  {/if}
  {#if step == "workspace"}
    <div class="font-bold mb-4">Validate User</div>
    <div>
      <Card.Card class="mb-10">
        <Card.Header>Create your first workspace</Card.Header>
        <Card.Content>
          <div class="grid gap-2">
            <Label for="workspace">Workspace Name</Label>
            <Input
              type="text"
              bind:value={data.workspace}
              placeholder="Workspace name"
              required
              autocomplete="off"
            />
          </div>
          <div class="">
            <HotkeyButton
              onclick={async () => {
                try {
                  await auth.client.CustomCommand({
                    command: "ensureworkspace",
                    data: JSON.stringify({
                      name: $state.snapshot(data.workspace),
                    }),
                    jwt: auth.access_token,
                  });
                  toast.success("Workspace created", {
                    description: "Workspace has been created",
                  });
                  data.workspace = await auth.client.FindOne<any>({
                    collectionname: "users",
                    query: { _type: "workspace" },
                    jwt: auth.access_token,
                  });
                  if (data.workspace != null) {
                    usersettings.currentworkspace = data.workspace._id;
                    usersettings.persist();
                  }
                  await getstep();
                } catch (error: any) {
                  console.error(error);
                  toast.error("Error creating workspace", {
                    description: error.message,
                  });
                }
              }}
              variant="success"
              size="base"
              aria-label="Create workspace"
              data-shortcut="enter"
              >Create Workspace
            </HotkeyButton>
          </div>
          <div>
            <small>
              Please enter a name for your first workspace. This couold be your
              company name, a project you are working on, a department, or any
              other name that makes sense to you. You can create additional
              workspaces later.
            </small>
          </div>
        </Card.Content>
      </Card.Card>
    </div>
  {/if}
  {#if step == "done"}
    <div class="font-bold mb-4">Validate User</div>
    <div>
      <Card.Card class="mb-10">
        <Card.Header>Validation Complete</Card.Header>
        <Card.Content>
          <div class="grid gap-2">
            <div class="font-bold">User has been validated</div>
          </div>
        </Card.Content>
      </Card.Card>
    </div>
  {/if}
</div>

<style>

</style>