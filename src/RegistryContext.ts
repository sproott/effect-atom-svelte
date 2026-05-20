/**
 * @since 1.0.0
 */
import type * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'

import { getContext, onDestroy, setContext } from 'svelte'

/**
 * @since 1.0.0
 * @category context
 */
export interface RegistryOptions {
  readonly initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => () => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}

/**
 * @since 1.0.0
 * @category context
 */
export const registryContextKey = Symbol.for('@effect/atom-svelte/registryContextKey')

/**
 * @since 1.0.0
 * @category context
 */
export const defaultRegistry: AtomRegistry.AtomRegistry = AtomRegistry.make()

/**
 * @since 1.0.0
 * @category context
 */
export const getRegistry = (): AtomRegistry.AtomRegistry => {
  return getContext<AtomRegistry.AtomRegistry | undefined>(registryContextKey) ?? defaultRegistry
}

/**
 * @since 1.0.0
 * @category context
 */
export const setRegistry = (options?: RegistryOptions): AtomRegistry.AtomRegistry => {
  const registry = AtomRegistry.make({
    scheduleTask: options?.scheduleTask,
    initialValues: options?.initialValues,
    timeoutResolution: options?.timeoutResolution,
    defaultIdleTTL: options?.defaultIdleTTL ?? 400,
  })
  setContext(registryContextKey, registry)
  onDestroy(() => registry.dispose())
  return registry
}
