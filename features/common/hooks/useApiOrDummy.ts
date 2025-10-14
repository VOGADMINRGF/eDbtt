// features/common/hooks/useApiOrDummy.ts
import { useEffect, useState } from "react";

export function useApiOrDummy<T = any>(apiUrl: string, dummy: T): [T, boolean] {
  const [data, setData] = useState<T>(dummy);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl)
      .then(res => res.ok ? res.json() : null)
      .then(apiData => {
        if (!cancelled) {
          if (apiData && apiData.length > 0) {
            setData(apiData);
            setIsFallback(false);
          } else {
            setData(dummy);
            setIsFallback(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(dummy);
          setIsFallback(true);
        }
      });
    return () => { cancelled = true; };
  }, [apiUrl, dummy]);
  return [data, isFallback];
}
