import { useState, useEffect, useCallback } from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
    let finalUrl = url;

    // If url is relative and a valid serverUrl is set (not placeholder uber.dev), prepend serverUrl
    if (url.startsWith("/") && serverUrl && !serverUrl.includes("uber.dev")) {
      finalUrl = `${serverUrl.replace(/\/$/, "")}${url}`;
    }

    const response = await fetch(finalUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
