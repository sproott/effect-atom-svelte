<script lang="ts">
  import { registryContextKey, useAtomValue } from "../../src/index.ts";
  import * as Atom from "effect/unstable/reactivity/Atom";
  import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
  import { setContext } from "svelte";

  const {
    atom,
    map,
    registry,
    onValue,
  }: {
    atom: () => Atom.Atom<any>;
    map?: ((value: any) => any) | undefined;
    registry?: AtomRegistry.AtomRegistry | undefined;
    onValue: (value: any) => void;
  } = $props();

  const getAtom = () => atom();
  const notifyValue = (value: any) => onValue(value);
  const getRegistry = () => registry;
  const getMappedAtom = () => {
    const currentMap = map;
    return currentMap ? Atom.map(getAtom(), currentMap) : getAtom();
  };

  if (getRegistry() !== undefined) {
    setContext(registryContextKey, getRegistry()!);
  }

  const value = useAtomValue(getMappedAtom);
</script>

{(notifyValue(value.current), "")}
