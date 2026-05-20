<script lang="ts">
  import { RegistryProvider } from "../../src/index.ts";
  import type * as Atom from "effect/unstable/reactivity/Atom";
  import ProviderHarnessInner from "./ProviderHarnessInner.svelte";

  const {
    atom,
    initialValues,
    onValue,
  }: {
    atom: () => Atom.Atom<number>;
    initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined;
    onValue: (value: number) => void;
  } = $props();
</script>

<RegistryProvider {initialValues}>
  <ProviderHarnessInner {atom} {onValue} />
</RegistryProvider>
