<script lang="ts">
  import { useAtomResource } from "../../src/index.ts";
  import type { AsyncResult } from "effect/unstable/reactivity/AsyncResult";
  import type { Atom } from "effect/unstable/reactivity/Atom";

  type NumberAsyncResult = AsyncResult<number, Error>;
  type NumberResourceAtom = Atom<NumberAsyncResult>;

  const {
    atom,
    onPromise,
  }: {
    atom: () => NumberResourceAtom;
    onPromise: (promise: Promise<number>) => void;
  } = $props();

  const getAtom = () => atom();
  const notifyPromise = (promise: Promise<number>) => onPromise(promise);

  const resource = useAtomResource(getAtom);
</script>

{(notifyPromise(resource.current), "")}
