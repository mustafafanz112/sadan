import { useState, useCallback, useEffect } from 'react';
import { fetchCachedCollections, fetchCollections } from '../services/api';

const FALLBACK_COLLECTIONS = [
  "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Jingle Bells", "Pet Snake",
  // ... (بقية القائمة كما في App.tsx)
];

export function useCollections() {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'live' | 'stale' | 'placeholder'>('cache');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let collectionsData;
      try {
        const cachedResponse = await fetchCachedCollections();
        collectionsData = cachedResponse.collections;
        setDataSource('cache');
      } catch {
        const liveResponse = await fetchCollections();
        collectionsData = liveResponse.collections;
        setDataSource(liveResponse.is_stale ? 'stale' : 'live');
      }
      if (collectionsData && collectionsData.length > 0) {
        setCollections(collectionsData.map((col: any) => col.name));
      } else {
        setCollections(FALLBACK_COLLECTIONS);
      }
    } catch (err: any) {
      setError('فشل في جلب قائمة المجموعات: ' + err.message);
      setCollections(FALLBACK_COLLECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { collections, loading, error, dataSource, refetch: fetchData };
}
