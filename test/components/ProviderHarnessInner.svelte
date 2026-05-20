<script lang="ts">
  import { useAtomValue } from "../../src/index.ts";
  import type { Atom } from "effect/unstable/reactivity/Atom";

  type NumberAtom = Atom<number>;

  const {
    atom,
    onValue,
  }: {
    atom: () => NumberAtom;
    onValue: (value: number) => void;
  } = $props();

  const getAtom = () => atom();
  const notifyValue = (value: number) => onValue(value);
  const value = useAtomValue(getAtom);
</script>

{(notifyValue(value.current), "")}
