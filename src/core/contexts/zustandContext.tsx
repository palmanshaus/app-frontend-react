import React, { useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';

import deepEqual from 'fast-deep-equal';
import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';

import { ContextNotProvided, createContext } from 'src/core/contexts/context';
import { SelectorStrictness, useDelayedSelectorFactory } from 'src/hooks/delayedSelectors';
import type { CreateContextProps } from 'src/core/contexts/context';
import type { DelayedPrimarySelector, DelayedSecondarySelector } from 'src/hooks/delayedSelectors';

type ExtractFromStoreApi<T> = T extends StoreApi<infer U> ? Exclude<U, void> : never;

const dummyStore = createStore(() => ({}));

type Selector<T, U> = (state: T) => U;
type SelectorFunc<T> = <U>(selector: Selector<T, U>) => U;
type SelectorRefFunc<T> = <U>(selector: Selector<T, U>) => { current: U };
type SelectorRefFuncLax<T> = <U>(selector: Selector<T, U>) => { current: U | typeof ContextNotProvided };
type SelectorFuncLax<T> = <U>(selector: Selector<T, U>) => U | typeof ContextNotProvided;

export function createZustandContext<Store extends StoreApi<Type>, Type = ExtractFromStoreApi<Store>, Props = any>(
  props: CreateContextProps<Store> & {
    initialCreateStore: (props: Props) => Store;
    onReRender?: (store: Store, props: Props) => void;
  },
) {
  const { initialCreateStore, onReRender, ...rest } = props;
  const { Provider, useCtx, useLaxCtx, useHasProvider } = createContext<Store>(rest);

  /**
   * A hook that can be used to select values from the store. The selector function will be called whenever the store
   * changes, and the component will re-render if the selected value changes when compared with the previous value.
   */
  const useSelector: SelectorFunc<Type> = (selector) => useStore(useCtx(), selector);

  const useSelectorAsRef: SelectorRefFunc<Type> = (selector) => {
    const store = useCtx();
    const ref = useRef<any>(selector(store.getState()));

    useEffect(
      () =>
        store.subscribe((state) => {
          ref.current = selector(state);
        }),
      // The selector is not expected to change, so we don't need to include it in the dependency array.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [store],
    );

    return ref;
  };

  const useLaxSelectorAsRef: SelectorRefFuncLax<Type> = (selector) => {
    const store = useLaxCtx();
    const ref = useRef<any>(store === ContextNotProvided ? ContextNotProvided : selector(store.getState() as Type));

    useEffect(() => {
      if (store === ContextNotProvided) {
        ref.current = ContextNotProvided;
        return;
      }
      return store.subscribe((state) => {
        ref.current = selector(state);
      });
    }, [store, selector]);

    return ref;
  };

  /**
   * Same as useSelector, but can be used to select complex values, such as objects or arrays, and will only trigger
   * a re-render if the selected value changes when compared with the previous value. Values are compared using
   * 'fast-deep-equal'.
   */
  const useMemoSelector: SelectorFunc<Type> = (selector) => {
    const prev = useRef<any>(undefined);
    return useSelector((state) => {
      const next = selector(state);
      if (deepEqual(next, prev.current)) {
        return prev.current;
      }
      prev.current = next;
      return next;
    });
  };

  const useLaxMemoSelector: SelectorFuncLax<Type> = (selector) => {
    const _store = useLaxCtx();
    const store = _store === ContextNotProvided ? dummyStore : _store;
    const prev = useRef<any>(undefined);
    return useStore(store as any, (state: Type) => {
      if (_store === ContextNotProvided) {
        return ContextNotProvided;
      }

      const next = selector(state);
      if (deepEqual(next, prev.current)) {
        return prev.current;
      }
      prev.current = next;
      return next;
    });
  };

  /**
   * A hook much like useSelector(), but will also work if the context provider is not present. If the context provider
   * is not present, the hook will return the ContextNotProvided value instead.
   */
  const useLaxSelector: SelectorFuncLax<Type> = (_selector) => {
    const _store = useLaxCtx();
    const store = _store === ContextNotProvided ? dummyStore : _store;
    const selector = _store === ContextNotProvided ? () => ContextNotProvided : _selector;
    return useStore(store as any, selector as any);
  };

  function MyProvider({ children, ...props }: PropsWithChildren<Props>) {
    const storeRef = useRef<Store>();
    if (!storeRef.current) {
      storeRef.current = initialCreateStore(props as Props);
    }

    useEffect(() => {
      if (onReRender && storeRef.current) {
        onReRender(storeRef.current, props as Props);
      }
    });

    return <Provider value={storeRef.current}>{children}</Provider>;
  }

  const useLaxDelayedMemoSelectorFactory = <Arg, RetVal>(
    primarySelector: DelayedPrimarySelector<Arg, RetVal, Type>,
    deps?: any[],
  ): DelayedSecondarySelector<Arg, RetVal | typeof ContextNotProvided, Type> =>
    useDelayedSelectorFactory({
      store: useLaxCtx(),
      strictness: SelectorStrictness.returnWhenNotProvided,
      primarySelector,
      deps,
    });

  const useDelayedMemoSelectorFactory = <Arg, RetVal>(
    primarySelector: DelayedPrimarySelector<Arg, RetVal, Type>,
    deps?: any[],
  ): DelayedSecondarySelector<Arg, RetVal, Type> =>
    useDelayedSelectorFactory({
      store: useCtx(),
      strictness: SelectorStrictness.throwWhenNotProvided,
      primarySelector,
      deps,
    });

  return {
    Provider: MyProvider,
    useSelector,
    useSelectorAsRef,
    useLaxSelectorAsRef,
    useMemoSelector,
    useLaxMemoSelector,
    useLaxSelector,
    useDelayedMemoSelectorFactory,
    useLaxDelayedMemoSelectorFactory,
    useHasProvider,
    useStore: useCtx,
    useLaxStore: useLaxCtx,
  };
}
