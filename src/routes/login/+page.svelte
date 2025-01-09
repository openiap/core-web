<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

  import { auth } from "$lib/stores/auth.svelte";
  function goto(url: string) {
    window.location.href = auth.baseurl + url;
  }
</script>

<div class="grid md:grid-cols-2 min-h-screen items-center justify-center">
  <div class="md:p-20 lg:p-40 md:grid-span-1">
    <Card.Root class="mx-auto max-w-sm">
      <Card.Header>
        <Card.Title class="text-2xl">Login</Card.Title>
        <Card.Description>Enter your email below to login to your account</Card.Description>
      </Card.Header>
      <Card.Content>
        <form method="post" action="{auth.baseurl}/local">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input id="username" name="username" type="text" placeholder="m@example.com" required autocomplete="username" />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="password">Password</Label>
                <a href="##" class="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </a>
              </div>
              <Input id="password" name="password" type="password" required autocomplete="current-password" />
            </div>
            <Button variant="outline" type="submit" class="w-full">Login</Button>
            {#if auth.config != null && auth.config.loginproviders != null}
              {#each auth.config.loginproviders.filter((x:any) => x.provider != "local") as lp }
                <Button variant="outline" class="w-full" onclick={() => goto('/' + lp.id)}>{lp.name}</Button>
              {/each}
            {/if}
          </div>
        </form>
        <div class="mt-4 text-center text-sm">
          If you don't have an account, one will be created based on your email address.
        </div>
      </Card.Content>
    </Card.Root>
  </div>
  <div class="hidden md:grid-span-1 md:block sm:flex-1 bg-white dark:bg-black">

  </div>
</div>

