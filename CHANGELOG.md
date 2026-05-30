# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

### [1.0.2] - 2026-05-30

### Fixed

- Build now rewrites relative `.ts` import extensions to `.js` in the emitted `dist/*.js`, fixing `UNRESOLVED_IMPORT` / `ERR_MODULE_NOT_FOUND` failures when consuming the package from a bundler or Node ESM.

## [1.0.1] - 2026-05-20

### Changed

- Clarified in the README that this package is a pure AI port based on the other Effect Atom adapters and may still break.

## [1.0.0] - 2026-05-20

### Added

- Initial public release of `@sproott/effect-atom-svelte`.
- Svelte 5 bindings for Effect Atom, including `RegistryProvider`, registry helpers, async resource hooks, and `AtomRef` integration.
