<script lang="ts">
  import { base } from "$app/paths";
  import * as Card from "$lib/components/ui/card/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { Label } from "$lib/components/ui/label/index.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { CustomInput } from "$lib/custominput";
  import LeftImage from "$lib/images/login/cover.svg";
  import { auth } from "$lib/stores/auth.svelte";

  let loading = $state(false);

  function goto(url: string) {
    window.location.href = auth.baseurl + url;
  }

  function renderIcon(name: string, provider: string) {
    if (name == null) return `${base}/saml.svg`;
    if (provider == null) return `${base}/saml.svg`;
    
    const nameLower = name.toLowerCase();
    const providerLower = provider.toLowerCase();
    
    // ULTIMATE DEBUG: Log EVERYTHING with UNIQUE identifier
    const debugId = `${name}-${provider}-${Date.now()}`;
    console.log(`🔍 RENDERICON DEBUG [${debugId}]:`);
    console.log(`   📝 ORIGINAL name: "${name}"`);
    console.log(`   📝 ORIGINAL provider: "${provider}"`);
    console.log(`   🔤 nameLower: "${nameLower}"`);
    console.log(`   🔤 providerLower: "${providerLower}"`);
    console.log(`   🌐 base: "${base}"`);
    
    // TEST ALL CONDITIONS AND LOG WHAT MATCHES
    const tests = {
      googleInName: nameLower.includes("google"),
      googleInProvider: providerLower.includes("google"),
      office365InName: nameLower.includes("office 365"),
      office365AltInName: nameLower.includes("office365"),
      officeInName: nameLower.includes("office"),
      microsoftInName: nameLower.includes("microsoft"),
      hotmailInName: nameLower.includes("hotmail"),
      outlookInName: nameLower.includes("outlook"),
      oidcInProvider: providerLower.includes("oidc"),
      openidInProvider: providerLower.includes("openid"),
      samlInProvider: providerLower.includes("saml")
    };
    
    console.log(`   🧪 TEST RESULTS for [${debugId}]:`, tests);
    
    let result;
    let reason;
    let matchedCondition;
    
    // ABSOLUTE PRIORITY: Google detection - check BOTH name AND provider
    if (tests.googleInName || tests.googleInProvider) {
      result = `${base}/google.svg`;
      reason = `GOOGLE detected: nameHasGoogle=${tests.googleInName}, providerHasGoogle=${tests.googleInProvider}`;
      matchedCondition = "GOOGLE_PRIORITY";
    }
    // Office 365 - specific match
    else if (tests.office365InName || tests.office365AltInName) {
      result = `${base}/office365.svg`;
      reason = `OFFICE 365 specific: office365InName=${tests.office365InName}, office365AltInName=${tests.office365AltInName}`;
      matchedCondition = "OFFICE365_SPECIFIC";
    }
    // Generic Office - but only if not Google
    else if (tests.officeInName && !tests.googleInName && !tests.googleInProvider) {
      result = `${base}/office365.svg`;
      reason = `OFFICE generic: officeInName=${tests.officeInName}, noGoogleAnywhere`;
      matchedCondition = "OFFICE_GENERIC";
    }
    // Microsoft - but only if not Google
    else if (tests.microsoftInName && !tests.googleInName && !tests.googleInProvider) {
      result = `${base}/office365.svg`;
      reason = `MICROSOFT: microsoftInName=${tests.microsoftInName}, noGoogleAnywhere`;
      matchedCondition = "MICROSOFT";
    }
    // Hotmail/Outlook
    else if (tests.hotmailInName || tests.outlookInName) {
      result = `${base}/hotmail.svg`;
      reason = `HOTMAIL/OUTLOOK: hotmail=${tests.hotmailInName}, outlook=${tests.outlookInName}`;
      matchedCondition = "HOTMAIL_OUTLOOK";
    }
    // OIDC/OpenID
    else if (tests.oidcInProvider || tests.openidInProvider) {
      result = `${base}/openid.svg`;
      reason = `OIDC/OPENID: oidc=${tests.oidcInProvider}, openid=${tests.openidInProvider}`;
      matchedCondition = "OIDC_OPENID";
    }
    // SAML
    else if (tests.samlInProvider) {
      result = `${base}/saml.svg`;
      reason = `SAML: saml=${tests.samlInProvider}`;
      matchedCondition = "SAML";
    }
    // Default fallback
    else {
      result = `${base}/saml.svg`;
      reason = "NO CONDITIONS MATCHED - using default";
      matchedCondition = "DEFAULT_FALLBACK";
    }
    
    console.log(`   ✅ FINAL RESULT for [${debugId}]:`);
    console.log(`      🎯 Condition: ${matchedCondition}`);
    console.log(`      📄 Reason: ${reason}`);
    console.log(`      🔗 URL: ${result}`);
    console.log(`   ═══════════════════════════════════════════════════════════════`);
    
    return result;
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
  console.log("Login providers:", $state.snapshot(loginproviders));

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
