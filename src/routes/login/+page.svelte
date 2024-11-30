<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
</script>

<svelte:head>
  <title>OpenCore Index Advisor</title>
  <meta
    name="description"
    content="Get performance data and generates index suggestions for better database performance"
  />
</svelte:head>
<div class="grid md:grid-cols-2 min-h-screen items-center justify-center">
  <div class="md:p-20 lg:p-40 md:grid-span-1">
    <Card.Root class="mx-auto max-w-sm">
      <Card.Header>
        <Card.Title class="text-2xl">Login</Card.Title>
        <Card.Description>Enter your email below to login to your account</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <a href="##" class="ml-auto inline-block text-sm underline">
                Forgot your password?
              </a>
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" class="w-full">Login</Button>
          <Button variant="outline" class="w-full">Login with Google</Button>
        </div>
        <div class="mt-4 text-center text-sm">
          Don't have an account?
          <a href="##" class="underline"> Sign up </a>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
  <div class="hidden md:block sm:flex-1 bg-white dark:bg-black">

  </div>
</div>

