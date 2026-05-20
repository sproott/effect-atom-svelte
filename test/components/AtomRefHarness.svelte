<script lang="ts">
  import { useAtomRef } from "../../src/index.ts";
  import type * as AtomRef from "effect/unstable/reactivity/AtomRef";

  const {
    ref,
    onValue,
  }: {
    ref: AtomRef.ReadonlyRef<any>;
    onValue: (value: any) => void;
  } = $props();

  const value = useAtomRef(() => ref);
</script>

{(onValue(value.current), "")}
