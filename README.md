# @sproott/effect-atom-svelte

Svelte 5 bindings for Effect Atom.

This package connects `effect/unstable/reactivity` atoms to Svelte's reactivity model. It provides a registry provider for scoped atom lifetimes and a small set of hooks for reading, writing, subscribing to, and awaiting atom state inside Svelte components.

## Requirements

- Svelte 5
- `effect` v4 with `unstable/reactivity`
- TypeScript with bundler-style module resolution

## Installation

```bash
pnpm add @sproott/effect-atom-svelte effect svelte
```

## Quick Start

```svelte
<script lang="ts">
	import { Atom } from 'effect/unstable/reactivity'
	import { RegistryProvider, useAtom } from '@sproott/effect-atom-svelte'

	const counter = Atom.make(0)

	const [value, setValue] = useAtom(() => counter)
</script>

<RegistryProvider>
	<button onclick={() => setValue((current) => current + 1)}>
		{value.current}
	</button>
</RegistryProvider>
```

`useAtom()` returns a reactive wrapper with a `.current` getter and a setter function. Reading `.current` inside markup or reactive code subscribes the component to atom updates.

## RegistryProvider

`RegistryProvider` creates an `AtomRegistry` for the current component subtree and disposes it automatically when the provider is destroyed.

Use it when you want:

- scoped atom lifetimes instead of the package's default shared registry
- initial values for atoms in a subtree
- custom scheduling or timeout configuration

```svelte
<script lang="ts">
	import { Atom } from 'effect/unstable/reactivity'
	import { RegistryProvider, useAtomValue } from '@sproott/effect-atom-svelte'

	const greeting = Atom.make('hello')
	const value = useAtomValue(() => greeting)
</script>

<RegistryProvider initialValues={[[greeting, 'ahoj']]}> 
	<p>{value.current}</p>
</RegistryProvider>
```

If no provider is present, hooks fall back to a default shared registry.

## Common Patterns

### Read an atom

```ts
const value = useAtomValue(() => atom)
console.log(value.current)
```

### Read and write an atom

```ts
const [value, setValue] = useAtom(() => writableAtom)

setValue(1)
setValue((current) => current + 1)
```

### Write without subscribing to the value

```ts
const setValue = useAtomSet(() => writableAtom)
```

### Subscribe to changes for side effects

```ts
useAtomSubscribe(() => atom, (value) => {
	console.log('changed', value)
})
```

### Seed initial values once per registry

```ts
useAtomInitialValues([
	[counter, 10],
	[otherAtom, 'ready'],
])
```

### Work with async atoms

For atoms that resolve to `AsyncResult`, use `useAtomResource()` to expose a promise suitable for Svelte async handling.

```ts
const resource = useAtomResource(() => asyncAtom, {
	suspendOnWaiting: true,
})
```

### Work with AtomRef

```ts
const refValue = useAtomRef(() => ref)
const countRef = useAtomRefProp(() => ref, 'count')
const countValue = useAtomRefPropValue(() => ref, 'count')
```

## API Overview

### Context

- `RegistryProvider`: creates and provides a registry to a component subtree
- `getRegistry`: resolves the active registry from context or the default shared registry
- `setRegistry`: creates a registry manually and sets it in Svelte context

### Atom hooks

- `useAtomValue`: subscribe to an atom's current value
- `useAtom`: get a reactive value and setter pair for writable atoms
- `useAtomSet`: get only the setter for a writable atom
- `useAtomRefresh`: refresh an atom manually
- `useAtomMount`: mount an atom in the current registry
- `useAtomSubscribe`: subscribe to atom updates with a callback
- `useAtomInitialValues`: apply initial atom values once per registry

### Async and refs

- `useAtomResource`: expose `AsyncResult` atoms as a promise-backed resource
- `useAtomRef`: subscribe to an `AtomRef`
- `useAtomRefProp`: derive a property ref from an `AtomRef`
- `useAtomRefPropValue`: subscribe to a property ref value

## Development

```bash
pnpm run build
pnpm run check
pnpm run test
```

## Publishing

Releases are published from GitHub Actions on `v*` tags using npm trusted publishing.
