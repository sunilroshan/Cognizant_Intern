import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

export const useFetch = <T>(fetchFn: () => Promise<T>, immediate = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      setData(response);
      return response;
    } catch (err: any) {
      setError(err);
      toast.error(err.message || "Failed to retrieve records.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
};
export default useFetch;
