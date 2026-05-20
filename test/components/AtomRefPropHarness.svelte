<script lang="ts">
  import {
    useAtomRef,
    useAtomRefProp,
    useAtomRefPropValue,
  } from "../../src/index.ts";
  import type { AtomRef } from "effect/unstable/reactivity/AtomRef";

  type CounterRef = AtomRef<{ count: number; label: string }>;

  const {
    ref,
    onPropRefValue,
    onPropValue,
  }: {
    ref: CounterRef;
    onPropRefValue: (value: number) => void;
    onPropValue: (value: number) => void;
  } = $props();

  const propRef = useAtomRefProp(() => ref, "count");
  const propRefValue = useAtomRef(propRef);
  const propValue = useAtomRefPropValue(() => ref, "count");
</script>

{(onPropRefValue(propRefValue.current), "")}
{(onPropValue(propValue.current), "")}
