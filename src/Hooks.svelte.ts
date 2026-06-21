/**
 * @since 1.0.0
 */
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'
import * as Atom from 'effect/unstable/reactivity/Atom'
import type * as AtomRef from 'effect/unstable/reactivity/AtomRef'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import { untrack } from 'svelte'
import { getRegistry } from './RegistryContext.ts'

const initialValuesSet = new WeakMap<AtomRegistry.AtomRegistry, WeakSet<Atom.Atom<any>>>()

type ReactiveValue<A> = {
  readonly current: A
}

const flattenExit = <A, E>(exit: Exit.Exit<A, E>): A => {
  if (Exit.isSuccess(exit)) {
    return exit.value
  }
  throw Cause.squash(exit.cause)
}

const mountAtom = <A>(registry: AtomRegistry.AtomRegistry, atom: () => Atom.Atom<A>): void => {
  const currentAtom = $derived(atom())
  const mountCurrentAtom = () => registry.mount(currentAtom)
  $effect(mountCurrentAtom)
}

function setAtom<R, W, Mode extends 'value' | 'promise' | 'promiseExit' = never>(
  registry: AtomRegistry.AtomRegistry,
  atom: () => Atom.Writable<R, W>,
  options?: {
    readonly mode?: ([R] extends [AsyncResult.AsyncResult<any, any>] ? Mode : 'value') | undefined
  }
): 'promise' extends Mode
  ? (value: W) => Promise<AsyncResult.AsyncResult.Success<R>>
  : 'promiseExit' extends Mode
    ? (
        value: W
      ) => Promise<
        Exit.Exit<AsyncResult.AsyncResult.Success<R>, AsyncResult.AsyncResult.Failure<R>>
      >
    : (value: W | ((value: R) => W)) => void {
  if (options?.mode === 'promise' || options?.mode === 'promiseExit') {
    return ((value: W) => {
      const currentAtom = atom()
      registry.set(currentAtom, value)
      const promise = Effect.runPromiseExit(
        AtomRegistry.getResult(
          registry,
          currentAtom as Atom.Atom<AsyncResult.AsyncResult<any, any>>,
          {
            suspendOnWaiting: true,
          }
        )
      )
      return options.mode === 'promise' ? promise.then(flattenExit) : promise
    }) as any
  }
  return ((value: W | ((value: R) => W)) => {
    const currentAtom = atom()
    registry.set(
      currentAtom,
      typeof value === 'function' ? (value as any)(registry.get(currentAtom)) : value
    )
  }) as any
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomInitialValues = (
  initialValues: Iterable<readonly [Atom.Atom<any>, any]>
): void => {
  const registry = getRegistry()
  let set = initialValuesSet.get(registry)
  if (set === undefined) {
    set = new WeakSet()
    initialValuesSet.set(registry, set)
  }
  for (const [atom, value] of initialValues) {
    if (!set.has(atom)) {
      set.add(atom)
      ;(registry as any).ensureNode(atom).setValue(value)
    }
  }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomValue: {
  <A>(atom: () => Atom.Atom<A>): ReactiveValue<A>
  <A, B>(atom: () => Atom.Atom<A>, f: (_: A) => B): ReactiveValue<B>
} = <A>(atom: () => Atom.Atom<A>, f?: (_: A) => A): ReactiveValue<A> => {
  const registry = getRegistry()
  return createAtomAccessor(registry, f ? () => Atom.map(atom(), f) : atom)
}

// Re-subscribes when the thunk selects a different atom. `subscribedAtom` and
// `value` are both `$state` and the getter always reads `value`, so a consumer
// keeps its dependency on the subscribed value across a swap. The synchronous
// `registry.get` branch only covers the tick before the deferred `$effect`
// re-subscribes, avoiding a flash of the previous atom's value.
const createAtomAccessor = <A>(
  registry: AtomRegistry.AtomRegistry,
  atom: () => Atom.Atom<A>
): ReactiveValue<A> => {
  const currentAtom = $derived(atom())
  const initialAtom = untrack(() => currentAtom)
  let value = $state(registry.get(initialAtom))
  let subscribedAtom = $state(initialAtom)
  $effect(() => {
    const a = currentAtom
    return registry.subscribe(
      a,
      (next) => {
        subscribedAtom = a
        value = next as A
      },
      constImmediate
    )
  })
  return {
    get current() {
      const current = value
      return subscribedAtom === currentAtom ? current : registry.get(currentAtom)
    },
  }
}

const constImmediate = { immediate: true }

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomMount = <A>(atom: () => Atom.Atom<A>): void => {
  mountAtom(getRegistry(), atom)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomSet = <R, W, Mode extends 'value' | 'promise' | 'promiseExit' = never>(
  atom: () => Atom.Writable<R, W>,
  options?: {
    readonly mode?: ([R] extends [AsyncResult.AsyncResult<any, any>] ? Mode : 'value') | undefined
  }
): 'promise' extends Mode
  ? (value: W) => Promise<AsyncResult.AsyncResult.Success<R>>
  : 'promiseExit' extends Mode
    ? (
        value: W
      ) => Promise<
        Exit.Exit<AsyncResult.AsyncResult.Success<R>, AsyncResult.AsyncResult.Failure<R>>
      >
    : (value: W | ((value: R) => W)) => void => {
  const registry = getRegistry()
  mountAtom(registry, atom)
  return setAtom(registry, atom, options)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefresh = <A>(atom: () => Atom.Atom<A>): (() => void) => {
  const registry = getRegistry()
  mountAtom(registry, atom)
  return () => registry.refresh(atom())
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtom = <R, W, const Mode extends 'value' | 'promise' | 'promiseExit' = never>(
  atom: () => Atom.Writable<R, W>,
  options?: {
    readonly mode?: ([R] extends [AsyncResult.AsyncResult<any, any>] ? Mode : 'value') | undefined
  }
): readonly [
  value: ReactiveValue<R>,
  write: 'promise' extends Mode
    ? (value: W) => Promise<AsyncResult.AsyncResult.Success<R>>
    : 'promiseExit' extends Mode
      ? (
          value: W
        ) => Promise<
          Exit.Exit<AsyncResult.AsyncResult.Success<R>, AsyncResult.AsyncResult.Failure<R>>
        >
      : (value: W | ((value: R) => W)) => void,
] => {
  const registry = getRegistry()
  return [createAtomAccessor(registry, atom), setAtom(registry, atom, options)] as const
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomSubscribe = <A>(
  atom: () => Atom.Atom<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
): void => {
  const registry = getRegistry()
  const currentAtom = $derived(atom())
  const subscribeToCurrentAtom = () => registry.subscribe(currentAtom, f, options)
  $effect(subscribeToCurrentAtom)
}

const constUnresolvedPromise = new Promise<never>(() => {})
const constVoid = (): void => {}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomResource = <A, E>(
  atom: () => Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  options?: {
    readonly suspendOnWaiting?: boolean | undefined
  }
): ReactiveValue<Promise<A>> => {
  const result = useAtomValue(atom)
  // Memoize the Promise per `AsyncResult` identity so repeated reads return the
  // same instance and `{#await}` does not re-enter pending on unrelated updates.
  // Mirrors Solid's `createResource` / React's `atomPromiseMap` caching.
  const promise = $derived.by(() => {
    const current = result.current
    if (AsyncResult.isInitial(current) || (options?.suspendOnWaiting && current.waiting)) {
      return constUnresolvedPromise
    }
    if (AsyncResult.isSuccess(current)) {
      return Promise.resolve(current.value)
    }
    const rejected = Promise.reject(Cause.squash(current.cause))
    // The cached rejected Promise may never be awaited (e.g. read outside
    // `{#await}`); mark it handled so it cannot emit `unhandledrejection`.
    rejected.catch(constVoid)
    return rejected
  })
  return {
    get current() {
      return promise
    },
  }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRef = <A>(ref: () => AtomRef.ReadonlyRef<A>): ReactiveValue<A> => {
  // Same shape as `createAtomAccessor`.
  const currentRef = $derived(ref())
  const initialRef = untrack(() => currentRef)
  let value = $state(initialRef.value)
  let subscribedRef = $state(initialRef)
  $effect(() => {
    const r = currentRef
    return r.subscribe((next) => {
      subscribedRef = r
      value = next
    })
  })
  return {
    get current() {
      const current = value
      return subscribedRef === currentRef ? current : currentRef.value
    },
  }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefProp = <A, K extends keyof A>(
  ref: () => AtomRef.AtomRef<A>,
  prop: K
): (() => AtomRef.AtomRef<A[K]>) => {
  const propRef = $derived(ref().prop(prop))
  return () => propRef
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefPropValue = <A, K extends keyof A>(
  ref: () => AtomRef.AtomRef<A>,
  prop: K
): ReactiveValue<A[K]> => {
  return useAtomRef(useAtomRefProp(ref, prop))
}
