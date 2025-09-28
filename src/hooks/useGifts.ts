import { useState, useCallback, useEffect } from 'react';
import { fetchCachedGiftPrices, fetchGiftPrices, Gift } from '../services/api';

export function useGifts(collections: string[], useCacheFirst=true) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'live' | 'stale' | 'placeholder'>('cache');
  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [hasPlaceholderData, setHasPlaceholderData] = useState(false);

  const fetchData = useCallback(async (useCache = useCacheFirst) => {
    if (!collections || collections.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      setHasPlaceholderData(false);

      let apiData;
      let sourceType: typeof dataSource = 'cache';
      if (useCache) {
        try {
          apiData = await fetchCachedGiftPrices(collections);
          sourceType = apiData.source === 'placeholder' ? 'placeholder' : 'cache';
        } catch {
          apiData = await fetchGiftPrices(collections);
          sourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
        }
      } else {
        apiData = await fetchGiftPrices(collections);
        sourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
      }
      setDataSource(sourceType);
      setTonPrice(apiData.ton_price);
      setHasPlaceholderData(apiData.source === 'placeholder' || apiData.gifts.some((g: any) =>
        g.price_usd === 0 || g.min_price_usd === 0 || !g.is_valid
      ));
      setGifts(apiData.gifts);
    } catch (err: any) {
      setError('فشل في جلب بيانات الهدايا: ' + err.message);
      setHasPlaceholderData(true);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, [collections, useCacheFirst]);

  useEffect(() => { fetchData(useCacheFirst); }, [fetchData, useCacheFirst]);

  return { gifts, loading, error, dataSource, tonPrice, hasPlaceholderData, refetch: fetchData };
}
