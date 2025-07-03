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

  let loading = $state(false);

  function goto(url: string) {
    window.location.href = auth.baseurl + url;
  }

  function renderIcon(name: string, provider: string) {
    if (name == null) return Saml;
    if (provider == null) return Saml;
    
    const nameLower = name.toLowerCase();
    const providerLower = provider.toLowerCase();
    
    // DEBUG: Log what we're checking
    console.log(`DEBUG renderIcon: name="${name}", provider="${provider}"`);
    console.log(`DEBUG renderIcon: nameLower="${nameLower}", providerLower="${providerLower}"`);
    
    // PERMANENT FIX: Check for Google ANYWHERE in name or provider - this takes absolute priority
    if (nameLower.includes("google") || providerLower.includes("google")) {
      console.log("DEBUG: Returning Google icon");
      return Google;
    }
    
    // Check for Hotmail/Outlook
    if (nameLower.includes("hotmail") || nameLower.includes("outlook")) {
      console.log("DEBUG: Returning Hotmail icon");
      return Hotmail;
    }
    
    // Check for Office 365 (be specific to avoid conflicts)
    if (nameLower.includes("office 365") || nameLower.includes("office365")) {
      console.log("DEBUG: Returning Office365 icon for office 365");
      return Office365;
    }
    
    // Check for Microsoft (but not if it's clearly Google)
    if (nameLower.includes("microsoft") && !nameLower.includes("google")) {
      console.log("DEBUG: Returning Office365 icon for microsoft");
      return Office365;
    }
    
    // Check provider types
    if (providerLower.includes("oidc") || providerLower.includes("openid")) {
      console.log("DEBUG: Returning Openid icon");
      return Openid;
    }
    
    if (providerLower.includes("saml")) {
      console.log("DEBUG: Returning Saml icon");
      return Saml;
    }
    
    // Default fallback
    console.log("DEBUG: Returning default Saml icon");
    return Saml;
  }
  function renderClass(name: string, provider: string) {
    if (name == null) return "w-4 h-4 mr-2";
    if (provider == null) return "w-4 h-4 mr-2";

    const nameLower = name.toLowerCase();
    const providerLower = provider.toLowerCase();

    // Google gets larger icon
    if (nameLower.includes("google") || providerLower.includes("google")) {
      return "w-6 h-6 mr-2";
    }

    // Microsoft/Office products get smaller icon
    if (nameLower.includes("office") || nameLower.includes("microsoft")) {
      return "w-4 h-4 mr-2";
    }
    
    // SAML gets smaller icon
    if (providerLower.includes("saml")) {
      return "w-4 h-4 mr-2";
    }
    
    // Default to larger icon for other providers
    return "w-6 h-6 mr-2";
  }

  // svelte-ignore non_reactive_update
    let loginproviders = auth.config?.loginproviders;
  if (loginproviders == null) {
    loginproviders = [];
  }
  loginproviders.sort((a: any, b: any) => {
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });
  if (loginproviders.length === 0) {
    loginproviders.push({
      id: "local",
      name: "Local",
      provider: "local",
    });
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
            <HotkeyButton
              type="submit"
              class="w-full"
              aria-label="login"
              disabled={loading}>Login</HotkeyButton
            >
            {#if loginproviders != null}
              <div class="flex items-center justify-center">
                <Separator class="w-2/5" />
                <span class="mx-4"> OR </span>
                <Separator class="w-2/5" />
              </div>
              {#each loginproviders.filter((x: any) => x.provider != "local") as lp}
                <HotkeyButton
                  disabled={loading}
                  aria-label={lp.name}
                  class="w-full"
                  onclick={() => {
                    loading = true;
                    goto("/" + lp.id);
                  }}
                >
                  <img
                    src={renderIcon(lp.name, lp.provider)}
                    alt={lp.name}
                    class={renderClass(lp.name, lp.provider)}
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
