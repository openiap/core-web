<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { base } from "$app/paths";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  let name = $derived(() => auth.profile?.name || "World");
  const { data } = $props();

  // Helper function to map state to valid badge variant
  function getBadgeVariant(state: string): "default" | "secondary" | "destructive" | "outline" | undefined {
    switch (state.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'default';
    }
  }
</script>

<div class="container mx-auto p-4 space-y-4">
  {#if !data.entities || data.entities.length === 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>Welcome {name()}!</Card.Title>
        <Card.Description>
          No pending tasks at the moment. Visit <a href="https://docs.openiap.io/" class="text-blue-500 hover:underline">docs.openiap.io</a> to learn more.
        </Card.Description>
      </Card.Header>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.entities as task}
        <Card.Root class="hover:shadow-lg transition-shadow">
          <Card.Header>
            <Card.Title class="flex items-center justify-between">
              <span>{task.name}</span>
              <Badge variant={getBadgeVariant(task.state)}>
                {task.state}
              </Badge>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <Button variant="outline" class="w-full" href={`${base}/formworkflow/${task._id}`}>
              Open Task
            </Button>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}

  <div class="mt-8">
    <CustomSuperDebug formData={data.entities} />
  </div>
</div>