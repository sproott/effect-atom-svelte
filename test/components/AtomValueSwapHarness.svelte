<script lang="ts">
  import { useAtomValue } from "../../src/index.ts";
  import type * as Atom from "effect/unstable/reactivity/Atom";

  const {
    atomA,
    atomB,
    selectB = false,
    onValue,
  }: {
    atomA: Atom.Atom<any>;
    atomB: Atom.Atom<any>;
    selectB?: boolean;
    onValue: (value: any) => void;
  } = $props();

  // The thunk returns a *different* atom depending on reactive prop `selectB`.
  // useAtomValue must re-subscribe to the newly selected atom when it swaps.
  const value = useAtomValue(() => (selectB ? atomB : atomA));
</script>

{(onValue(value.current), "")}
