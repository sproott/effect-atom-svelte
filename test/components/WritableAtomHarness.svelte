<script lang="ts">
  import { useAtom } from "../../src/index.ts";
  import type * as Atom from "effect/unstable/reactivity/Atom";

  const {
    atom,
    onValue,
    onReady,
  }: {
    atom: () => Atom.Writable<any, any>;
    onValue: (value: any) => void;
    onReady: (write: (value: any) => void) => void;
  } = $props();

  const getAtom = () => atom();
  const notifyValue = (value: any) => onValue(value);
  const setReady = (write: (value: any) => void) => onReady(write);

  const [value, write] = useAtom(getAtom);

  setReady(write);
</script>

{(notifyValue(value.current), "")}
