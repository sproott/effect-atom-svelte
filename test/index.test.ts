import { Cause, Effect } from 'effect'
import { AsyncResult, Atom, AtomRef, AtomRegistry } from 'effect/unstable/reactivity'
import { assert, describe, it, vi } from 'vitest'

import AtomRefHarness from './components/AtomRefHarness.svelte'
import AtomRefPropHarness from './components/AtomRefPropHarness.svelte'
import AtomResourceHarness from './components/AtomResourceHarness.svelte'
import AtomResourceReadHarness from './components/AtomResourceReadHarness.svelte'
import AtomValueHarness from './components/AtomValueHarness.svelte'
import AtomValueSwapHarness from './components/AtomValueSwapHarness.svelte'
import InitialValuesHarness from './components/InitialValuesHarness.svelte'
import ProviderHarness from './components/ProviderHarness.svelte'
import WritableAtomHarness from './components/WritableAtomHarness.svelte'
import { render } from '@testing-library/svelte'
import { tick } from 'svelte'

describe('atom-svelte', () => {
  describe('useAtomValue', () => {
    it('reads value through RegistryProvider', async () => {
      const atom = Atom.make(42)
      let observed: number | undefined

      render(ProviderHarness, {
        props: {
          atom: () => atom,
          initialValues: [[atom, 84]] as const,
          onValue: (value: number) => {
            observed = value
          },
        },
      })

      await tick()
      assert.strictEqual(observed, 84)
    })

    it('reads value from simple Atom', async () => {
      const atom = Atom.make(42)
      let observed: number | undefined

      render(AtomValueHarness, {
        props: {
          atom: () => atom,
          onValue: (value: number) => {
            observed = value
          },
        },
      })

      await tick()
      assert.strictEqual(observed, 42)
    })

    it('reads value with transform function', async () => {
      const atom = Atom.make(42)
      let observed: number | undefined

      render(AtomValueHarness, {
        props: {
          atom: () => atom,
          map: (value: number) => value * 2,
          onValue: (value: number) => {
            observed = value
          },
        },
      })

      await tick()
      assert.strictEqual(observed, 84)
    })

    it('updates when Atom value changes', async () => {
      const registry = AtomRegistry.make()
      const atom = Atom.make('initial')
      let observed: string | undefined

      render(AtomValueHarness, {
        props: {
          atom: () => atom,
          registry,
          onValue: (value: string) => {
            observed = value
          },
        },
      })

      await tick()
      assert.strictEqual(observed, 'initial')

      registry.set(atom, 'updated')
      await tick()
      assert.strictEqual(observed, 'updated')

      registry.dispose()
    })

    it('re-subscribes when the thunk selects a different Atom', async () => {
      const atomA = Atom.make('A')
      const atomB = Atom.make('B')
      const observed: Array<string> = []

      const { rerender } = render(AtomValueSwapHarness, {
        props: {
          atomA,
          atomB,
          selectB: false,
          onValue: (value: string) => {
            observed.push(value)
          },
        },
      })

      await tick()
      assert.strictEqual(observed.at(-1), 'A')

      // The thunk now selects atomB; useAtomValue must follow the swap.
      await rerender({
        atomA,
        atomB,
        selectB: true,
        onValue: (value: string) => {
          observed.push(value)
        },
      })
      await tick()
      assert.strictEqual(observed.at(-1), 'B')
    })

    it('follows the swap to an ASYNC atom whose result lands after the swap', async () => {
      // Effect-backed atoms whose value arrives asynchronously (via the
      // subscription, not synchronously from `registry.get`). This is the real
      // RPC-query case: `useAtomValue(() => Family.query(key))` where changing a
      // reactive input swaps to a fresh, not-yet-resolved atom. The accessor must
      // stay reactively bound to the new atom's eventual value.
      const atomA = Atom.make(Effect.succeed('A').pipe(Effect.delay('10 millis')))
      const atomB = Atom.make(Effect.succeed('B').pipe(Effect.delay('10 millis')))
      const observed: Array<AsyncResult.AsyncResult<string, never>> = []

      const last = () => observed.at(-1)
      const lastValue = () => {
        const result = last()
        return result && AsyncResult.isSuccess(result) ? result.value : undefined
      }
      const waitFor = async (predicate: () => boolean) => {
        await vi.waitFor(
          () => {
            assert.isTrue(predicate())
          },
          { timeout: 1000, interval: 5 }
        )
      }

      const { rerender } = render(AtomValueSwapHarness, {
        props: {
          atomA,
          atomB,
          selectB: false,
          onValue: (value: AsyncResult.AsyncResult<string, never>) => {
            observed.push(value)
          },
        },
      })

      await waitFor(() => lastValue() === 'A')

      // Swap to atomB. Its result resolves AFTER the swap, so the accessor must
      // re-run when the new atom's value lands — not stay stuck on a stale read.
      await rerender({
        atomA,
        atomB,
        selectB: true,
        onValue: (value: AsyncResult.AsyncResult<string, never>) => {
          observed.push(value)
        },
      })

      await waitFor(() => lastValue() === 'B')
      assert.strictEqual(lastValue(), 'B')
    })

    it('works with computed Atom', async () => {
      const baseAtom = Atom.make(10)
      const computedAtom = Atom.make((get) => get(baseAtom) * 2)
      let observed: number | undefined

      render(AtomValueHarness, {
        props: {
          atom: () => computedAtom,
          onValue: (value: number) => {
            observed = value
          },
        },
      })

      await tick()
      assert.strictEqual(observed, 20)
    })
  })

  describe('useAtom', () => {
    it('updates value with setter', async () => {
      const atom = Atom.make(0)
      const values: Array<number> = []
      let write!: (value: number | ((value: number) => number)) => void

      render(WritableAtomHarness, {
        props: {
          atom: () => atom,
          onReady: (nextWrite: (value: number | ((value: number) => number)) => void) => {
            write = nextWrite
          },
          onValue: (value: number) => {
            values.push(value)
          },
        },
      })

      await tick()
      write(1)
      write((current) => current + 1)
      await tick()

      assert.deepStrictEqual(values, [0, 2])
    })
  })

  describe('useAtomInitialValues', () => {
    it('applies initial values once per registry', () => {
      const registry = AtomRegistry.make()
      const atom = Atom.make(0)
      let observed: number | undefined

      render(InitialValuesHarness, {
        props: {
          atom,
          registry,
          onValue: (value: number) => {
            observed = value
          },
        },
      })

      assert.strictEqual(observed, 1)
      registry.dispose()
    })
  })

  describe('AtomRef', () => {
    it('updates when AtomRef changes', async () => {
      const ref = AtomRef.make(0)
      const values: Array<number> = []

      render(AtomRefHarness, {
        props: {
          ref,
          onValue: (value: number) => {
            values.push(value)
          },
        },
      })

      await tick()
      ref.set(1)
      await tick()

      assert.deepStrictEqual(values, [0, 1])
    })

    it('re-subscribes when the thunk selects a different AtomRef', async () => {
      const ref1 = AtomRef.make('r1')
      const ref2 = AtomRef.make('r2')
      const observed: Array<string> = []

      const { rerender } = render(AtomRefHarness, {
        props: {
          ref: ref1,
          onValue: (value: string) => {
            observed.push(value)
          },
        },
      })

      await tick()
      assert.strictEqual(observed.at(-1), 'r1')

      await rerender({
        ref: ref2,
        onValue: (value: string) => {
          observed.push(value)
        },
      })
      await tick()
      assert.strictEqual(observed.at(-1), 'r2')

      // The old ref must no longer drive the value.
      ref1.set('r1-updated')
      await tick()
      assert.strictEqual(observed.at(-1), 'r2')
    })

    it('updates when AtomRef prop changes', async () => {
      const ref = AtomRef.make({ count: 0, label: 'a' })
      const propRefValues: Array<number> = []
      const propValues: Array<number> = []

      render(AtomRefPropHarness, {
        props: {
          ref,
          onPropRefValue: (value: number) => {
            propRefValues.push(value)
          },
          onPropValue: (value: number) => {
            propValues.push(value)
          },
        },
      })

      await tick()
      ref.set({ count: 2, label: 'a' })
      await tick()

      assert.deepStrictEqual(propRefValues, [0, 2])
      assert.deepStrictEqual(propValues, [0, 2])
    })
  })

  describe('useAtomResource', () => {
    it('suspends on Initial result', async () => {
      const atom = Atom.make(AsyncResult.initial<number, Error>())
      let currentPromise: Promise<number> | undefined

      render(AtomResourceHarness, {
        props: {
          atom: () => atom,
          onPromise: (promise: Promise<number>) => {
            currentPromise = promise
          },
        },
      })

      await tick()

      const sentinel = Symbol.for('sentinel')
      const result = await Promise.race([
        currentPromise!.then(
          () => 'resolved',
          () => 'rejected'
        ),
        new Promise<symbol>((resolve) => {
          setTimeout(() => {
            resolve(sentinel)
          }, 0)
        }),
      ])

      assert.strictEqual(result, sentinel)
    })

    it('returns a stable Promise identity across reads for a Success result', async () => {
      const atom = Atom.make(AsyncResult.success<number, Error>(1))
      let read!: () => Promise<number>

      render(AtomResourceReadHarness, {
        props: {
          atom: () => atom,
          onReady: (next: () => Promise<number>) => {
            read = next
          },
        },
      })

      await tick()

      const first = read()
      const second = read()
      assert.strictEqual(first, second)
      assert.strictEqual(await first, 1)
    })

    it('returns a stable rejected Promise identity for a Failure result', async () => {
      const error = new Error('boom')
      const atom = Atom.make(AsyncResult.failure<number, Error>(Cause.fail(error)))
      let read!: () => Promise<number>

      render(AtomResourceReadHarness, {
        props: {
          atom: () => atom,
          onReady: (next: () => Promise<number>) => {
            read = next
          },
        },
      })

      await tick()

      const first = read()
      const second = read()
      assert.strictEqual(first, second)
      await first.then(
        () => assert.fail('expected rejection'),
        (reason) => {
          // useAtomResource rejects with the squashed cause, i.e. the original error.
          assert.strictEqual(reason, error)
        }
      )
    })
  })
})
