import { useState, useCallback, useEffect, useRef } from "react";
import { useFetch } from "use-http";

export default function usePaginatedSearch(path, queryParams, options = {}) {
  const urlRef = useRef();

  if (!urlRef.current) {
    urlRef.current = new URL(path, window.location);

    for (const name in queryParams) {
      if (Object.prototype.hasOwnProperty.call(queryParams, name)) {
        urlRef.current.searchParams.set(name, queryParams[name]);
      }
    }
  }

  const [href, setHref] = useState(urlRef.current.href);

  useEffect(() => {
    urlRef.current = new URL(path, window.location);

    for (const name in queryParams) {
      if (Object.prototype.hasOwnProperty.call(queryParams, name)) {
        urlRef.current.searchParams.set(name, queryParams[name]);
      }
    }

    setHref(urlRef.current.href);
  }, [path, urlRef, queryParams]);

  const cursor = urlRef.current.searchParams.get("cursor");

  const {
    loading,
    error,
    data: {
      entries,
      meta: { next_cursor }
    }
  } = useFetch(
    href,
    {
      headers: {
        "content-type": "application/json",
        ...options.headers
      },
      onNewData: (data, newData) => {
        if (!cursor) {
          return newData;
        } else {
          return {
            entries: [...data.entries, ...newData.entries],
            meta: newData.meta
          };
        }
      },
      data: { entries: [], meta: { next_cursor: null } }
    },
    [href]
  );

  const loadMore = useCallback(() => {
    if (next_cursor) {
      urlRef.current.searchParams.set("cursor", next_cursor);
      setHref(urlRef.current.href);
    }
  }, [urlRef, next_cursor]);

  const hasMore = next_cursor && cursor !== next_cursor;

  return { loading, error, entries: !cursor && loading ? [] : entries, loadMore, hasMore };
}
