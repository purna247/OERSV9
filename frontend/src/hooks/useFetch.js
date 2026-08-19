import { useState, useEffect, useCallback, useRef } from 'react';

export const useFetch = (apiFunc, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Stable ref so apiFunc identity changes don't re-trigger the effect
  const apiFuncRef = useRef(apiFunc);
  apiFuncRef.current = apiFunc;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFuncRef.current(...args);
      setData(response);
      return { data: response, error: null };
    } catch (err) {
      setError(err.message || 'An error occurred');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []); // stable — no deps needed

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
};
