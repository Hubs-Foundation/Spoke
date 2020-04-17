import { useRef, useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

function useIsMounted() {
  const ref = useRef(false);

  useEffect(() => {
    ref.current = true;

    return () => {
      ref.current = false;
    };
  }, []);

  return () => ref.current;
}

export function useLoadAsync(callback, initialResults = [], initialCursor = 0) {
  const currentPromise = useRef();
  const abortControllerRef = useRef();
  const getIsMounted = useIsMounted();
  const [results, setResults] = useState(initialResults);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(true);

  const loadAsyncInternal = useCallback(
    (params, cursor = 0) => {
      setIsLoading(true);
      setHasMore(false);
      setError(undefined);

      if (cursor === 0) {
        setResults([]);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const promise = callback(params, cursor, abortController.signal);
      currentPromise.current = promise;

      promise
        .then(res => {
          if (getIsMounted() && currentPromise.current === promise) {
            const nextResults = res.results || [];

            if (cursor === 0) {
              setResults(nextResults);
            } else {
              setResults([...results, ...nextResults]);
            }

            setSuggestions(res.suggestions || []);
            setNextCursor(res.nextCursor || 0);
            setHasMore(res.hasMore || false);
            setIsLoading(false);
          }
        })
        .catch(err => {
          if (getIsMounted() && currentPromise.current === promise) {
            setResults([]);
            setSuggestions([]);
            setNextCursor(0);
            setHasMore(false);
            setError(err);
            setIsLoading(false);
            console.error(err);
          }
        })
        .finally(() => {
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = undefined;
          }
        });
    },
    [
      abortControllerRef,
      setError,
      setIsLoading,
      callback,
      currentPromise,
      getIsMounted,
      results,
      setResults,
      setSuggestions,
      setNextCursor,
      setHasMore
    ]
  );

  const loadAsync = useCallback(params => loadAsyncInternal(params, 0), [loadAsyncInternal]);

  const loadMore = useCallback(
    params => {
      if (!isLoading && hasMore) {
        loadAsyncInternal(params, nextCursor);
      }
    },
    [isLoading, hasMore, loadAsyncInternal, nextCursor]
  );

  return {
    loadAsync,
    loadMore,
    hasMore,
    isLoading,
    results,
    suggestions,
    error
  };
}

export function useAssetSearch(source, initialParams = {}, initialResults = [], initialCursor = 0) {
  const [params, setParamsInternal] = useState(initialParams);

  const { loadAsync, ...rest } = useLoadAsync(
    (searchParams, cursor, abortSignal) => {
      return source.search(searchParams, cursor, abortSignal);
    },
    initialResults,
    initialCursor
  );

  useEffect(() => {
    const onResultsChanged = () => {
      loadAsync(params);
    };

    source.addListener("resultsChanged", onResultsChanged);

    return () => {
      source.removeListener("resultsChanged", onResultsChanged);
    };
  }, [source, loadAsync, params]);

  const [debouncedLoadAsync] = useDebouncedCallback(loadAsync, source.searchDebounceTimeout);

  const setParams = useCallback(
    nextParams => {
      debouncedLoadAsync(nextParams);
      setParamsInternal(nextParams);
    },
    [debouncedLoadAsync, setParamsInternal]
  );

  return {
    params,
    setParams,
    ...rest
  };
}

export function useAddRemoveItems(items, dependencies = []) {
  const [additionalItems, setAdditionalItems] = useState([]);
  const [removedItems, setRemovedItems] = useState([]);

  useEffect(() => {
    setAdditionalItems([]);
    setRemovedItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const addItem = useCallback(
    item => {
      setAdditionalItems([...additionalItems, item]);
    },
    [setAdditionalItems, additionalItems]
  );

  const removeItem = useCallback(
    item => {
      setRemovedItems([...removedItems, item]);
    },
    [setRemovedItems, removedItems]
  );

  const finalItems = items.filter(r => removedItems.indexOf(r) === -1).concat(additionalItems);

  return [finalItems, addItem, removeItem];
}
