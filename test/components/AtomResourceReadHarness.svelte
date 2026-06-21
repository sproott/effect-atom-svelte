<script lang="ts">
  import { useAtomResource } from "../../src/index.ts";
  import type { AsyncResult } from "effect/unstable/reactivity/AsyncResult";
  import type { Atom } from "effect/unstable/reactivity/Atom";

  type NumberAsyncResult = AsyncResult<number, Error>;
  type NumberResourceAtom = Atom<NumberAsyncResult>;

  const {
    atom,
    onReady,
  }: {
    atom: () => NumberResourceAtom;
    onReady: (read: () => Promise<number>) => void;
  } = $props();

  const getAtom = () => atom();
  const setReady = (read: () => Promise<number>) => onReady(read);

  const resource = useAtomResource(getAtom);

  setReady(() => resource.current);
</script>
