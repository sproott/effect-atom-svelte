<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setRegistry, type RegistryOptions } from './RegistryContext.ts'

  let props: RegistryOptions & {
    readonly children?: Snippet | undefined
  } = $props()

  const options = (): RegistryOptions => ({
    initialValues: props.initialValues,
    scheduleTask: props.scheduleTask,
    timeoutResolution: props.timeoutResolution,
    defaultIdleTTL: props.defaultIdleTTL,
  })

  setRegistry(options())
</script>

{@render props.children?.()}
