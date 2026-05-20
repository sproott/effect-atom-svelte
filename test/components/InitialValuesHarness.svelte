<script lang="ts">
  import { registryContextKey, useAtomInitialValues } from "../../src/index.ts";
  import type * as Atom from "effect/unstable/reactivity/Atom";
  import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
  import { setContext } from "svelte";

  const {
    atom,
    registry,
    onValue,
  }: {
    atom: Atom.Atom<number>;
    registry: AtomRegistry.AtomRegistry;
    onValue: (value: number) => void;
  } = $props();

  const getAtom = () => atom;
  const getRegistry = () => registry;
  const notifyValue = (value: number) => onValue(value);

  setContext(registryContextKey, getRegistry());
  useAtomInitialValues([[getAtom(), 1]]);
  useAtomInitialValues([[getAtom(), 2]]);
  notifyValue(getRegistry().get(getAtom()));
</script>
