<script lang="ts">
  import { useAtomRef } from "../../src/index.ts";
  import type * as AtomRef from "effect/reactivity/AtomRef";

  const {
    ref,
    onValue,
    onReady,
  }: {
    ref: AtomRef.ReadonlyRef<any>;
    onValue: (value: any) => void;
    onReady?: () => void;
  } = $props();

  const setReady = () => onReady?.();
  const value = useAtomRef(() => ref);
  setReady();
</script>

{(onValue(value.current), "")}
