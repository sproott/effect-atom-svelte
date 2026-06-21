# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

## [1.0.4] - 2026-06-21

### Fixed

- `useAtomValue`/`useAtom` and `useAtomRef` no longer hang on a stale value after swapping to an atom/ref whose value resolves asynchronously (e.g. a reactive input selecting a fresh query atom). The swap-tick getter dropped the consumer's reactive dependency on the subscribed value, so the eventual async result was never observed.

## [1.0.3] - 2026-06-21

### Fixed

- `useAtomResource` now returns a stable `Promise` identity per `AsyncResult` value instead of minting a new `Promise` on every read. This stops `{#await}` from re-entering its pending block on unrelated updates and prevents `unhandledrejection` warnings from discarded rejected promises on the failure path. Mirrors the caching done by the official Solid (`createResource`) and React (`atomPromiseMap`) adapters.
- `useAtomValue`/`useAtom` and `useAtomRef` now reflect an atom/ref swap synchronously instead of one tick late, matching the behavior of the official adapters.

### Changed

- The mapped `useAtomValue` overload no longer creates a throwaway `Atom.map` registry node per accessor: the selected atom is memoized so the seed, subscription, and reads share a single identity.

## [1.0.2] - 2026-05-30

### Fixed

- Build now rewrites relative `.ts` import extensions to `.js` in the emitted `dist/*.js`, fixing `UNRESOLVED_IMPORT` / `ERR_MODULE_NOT_FOUND` failures when consuming the package from a bundler or Node ESM.

## [1.0.1] - 2026-05-20

### Changed

- Clarified in the README that this package is a pure AI port based on the other Effect Atom adapters and may still break.

## [1.0.0] - 2026-05-20

### Added

- Initial public release of `@sproott/effect-atom-svelte`.
- Svelte 5 bindings for Effect Atom, including `RegistryProvider`, registry helpers, async resource hooks, and `AtomRef` integration.
