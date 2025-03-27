<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { Label } from "$lib/components/ui/label/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { CustomInput } from "$lib/custominput";
  import LeftImage from "$lib/images/login/cover.svg";
  import Google from "$lib/images/login/google.svg";
  import Hotmail from "$lib/images/login/hotmail.svg";
  import Office365 from "$lib/images/login/office365.svg";
  import Openid from "$lib/images/login/openid.svg";
  import Saml from "$lib/images/login/saml.svg";
  import { auth } from "$lib/stores/auth.svelte";

  function goto(url: string) {
    window.location.href = auth.baseurl + url;
  }

  function renderIcon(name: string, provider: string) {
    if (name == null) return Openid;
    if (provider == null) return Openid;
    if (name.toLowerCase().indexOf("google") > -1) {
      return Google;
    }
    if (name.toLowerCase().indexOf("hotmail") > -1) {
      return Hotmail;
    }
    if (name.toLowerCase().indexOf("office") > -1) {
      return Office365;
    }
    if (provider.toLowerCase().indexOf("oidc") > -1) {
      return Openid;
    }
    if (provider.toLowerCase().indexOf("saml") > -1) {
      return Saml;
    }
    if (provider.toLowerCase().indexOf("google") > -1) {
      return Google;
    }
    return Openid;
  }
</script>

<div
  class="grid md:grid lg:grid-cols-3 h-screen overflow-auto items-center justify-center dark:bg-[#191B1E] lg:dark:bg-bw950"
>
  <div class="h-screen overflow-hidden lg:col-span-2 hidden lg:block">
    <div class="flex flex-col justify-end items-center h-full w-full">
      <img src={LeftImage} alt="" />
    </div>
  </div>
  <div
    class="h-full m-10 lg:m-0 lg:col-span-1 lg:border-s-[1px] border-bw600 flex items-center dark:bg-[#191B1E]"
  >
    <Card.Root class="mx-auto max-w-sm border-hidden">
      <Card.Header>
        <Card.Title class="dark:text-bw100 text-2xl mb-7 font-normal"
          >Login</Card.Title
        >
        <Card.Description
          >Enter your email below to login to your account</Card.Description
        >
      </Card.Header>
      <Card.Content>
        <form method="post" action="{auth.baseurl}/local">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label class="dark:text-bw100 font-normal" for="email"
                >Email</Label
              >
              <CustomInput
                autofocus
                class="dark:bg-transparent"
                width=""
                id="username"
                name="username"
                type="text"
                placeholder="m@example.com"
                required
                autocomplete="username"
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label class="dark:text-bw100 font-normal" for="password"
                  >Password</Label
                >
              </div>
              <CustomInput
                placeholder=""
                class="dark:bg-transparent"
                width=""
                id="password"
                name="password"
                type="password"
                required
                autocomplete="current-password"
              />
            </div>
            <HotkeyButton type="submit" class="w-full">Login</HotkeyButton>
            {#if auth.config?.loginproviders != null}
              <div class="flex items-center justify-center">
                <Separator class="w-2/5" />
                <span class="mx-4"> OR </span>
                <Separator class="w-2/5" />
              </div>
              {#each auth.config?.loginproviders.filter((x: any) => x.provider != "local") as lp}
                <HotkeyButton class="w-full" onclick={() => goto("/" + lp.id)}>
                  <img
                    src={renderIcon(lp.name, lp.provider)}
                    alt={lp.name}
                    class="w-6 h-6 mr-2"
                  />
                  {lp.name}</HotkeyButton
                >
              {/each}
            {/if}
          </div>
        </form>
        <div class="mt-4 text-center text-sm">
          If you don't have an account, one will be created based on your email
          address.
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
