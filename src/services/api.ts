// src/services/api.ts

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/api$/, '');
console.log('API Base URL:', API_BASE_URL);

export interface Gift {
  id: string;
  model_name: string;
  variant_name?: string;
  min_price_ton: number;
  min_price_usd: number;
  image: string;
  name: string;
  symbol: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_24h?: number;
  isBot?: boolean;
  is_valid?: boolean;
  isLoading?: boolean;
  isPlaceholder?: boolean;
}

export interface GiftsResponse {
  gifts: Gift[];
  ton_price: number;
  timestamp: number;
  last_updated: string;
  total_items: number;
  valid_items: number;
  success_rate: string;
  is_stale: boolean;
  source: string;
}

export interface CollectionsResponse {
  collections: Collection[];
  total_collections: number;
  timestamp: number;
  last_updated: string;
  is_stale: boolean;
  source: string;
}

export interface Collection {
  name: string;
  image_url?: string;
  count: number;
  floor: string;
}

// دالة لجلب البيانات من الكاش فقط (سريعة)
export async function fetchCachedGiftPrices(collections: string[]): Promise<GiftsResponse> {
  try {
    const startTime = performance.now();
    const q = encodeURIComponent(collections.join(","));
    const res = await fetch(`${API_BASE_URL}/api/gifts/cache?target_items=${q}`);
    
    if (!res.ok) {
      throw new Error(`فشل في جلب الكاش: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const responseTime = performance.now() - startTime;
    console.log(`⏱️ وقت استجابة الكاش: ${responseTime.toFixed(0)}ms, المصدر: ${data.source}`);
    
    // معالجة البيانات الوهمية
    if (data.source === 'placeholder' || data.source === 'empty_cache') {
      console.warn('⚠️ تم استقبال بيانات وهمية من الكاش');
      data.gifts = data.gifts.map((gift: any) => ({
        ...gift,
        isLoading: true,
        isPlaceholder: true
      }));
    }
    
    return data;
  } catch (error) {
    console.warn('فشل جلب البيانات من الكاش، جاري المحاولة بالطريقة العادية', error);
    // Fallback إلى الطريقة العادية
    return fetchGiftPrices(collections);
  }
}

// دالة لجلب البيانات العادية (مع تحديث خلفي)
export async function fetchGiftPrices(collections: string[]): Promise<GiftsResponse> {
  try {
    const startTime = performance.now();
    const q = encodeURIComponent(collections.join(","));
    const res = await fetch(`${API_BASE_URL}/api/gifts?target_items=${q}&allow_stale=true`);
    
    if (!res.ok) {
      throw new Error(`فشل في جلب البيانات: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const responseTime = performance.now() - startTime;
    console.log(`⏱️ وقت استجابة API: ${responseTime.toFixed(0)}ms, المصدر: ${data.source}`);
    
    // معالجة البيانات الوهمية
    if (data.source === 'placeholder' || data.source === 'fallback') {
      console.warn('⚠️ تم استقبال بيانات وهمية من API');
      data.gifts = data.gifts.map((gift: any) => ({
        ...gift,
        isLoading: true,
        isPlaceholder: true
      }));
    }
    
    return data;
  } catch (error) {
    console.error('فشل جلب بيانات الهدايا:', error);
    
    // إنشاء استجابة وهمية في حالة الخطأ
    const placeholderResponse: GiftsResponse = {
      gifts: collections.map(collection => ({
        id: `error_${collection}`,
        model_name: collection,
        name: collection,
        min_price_ton: 0,
        min_price_usd: 0,
        image: '',
        symbol: collection.substring(0, 3).toUpperCase(),
        market_cap: 0,
        current_price: 0,
        is_valid: false,
        isLoading: false,
        isPlaceholder: true
      })),
      ton_price: 2.50, // سعر افتراضي
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      total_items: collections.length,
      valid_items: 0,
      success_rate: "0%",
      is_stale: true,
      source: "error_fallback"
    };
    
    return placeholderResponse;
  }
}

// دالة لجلب قائمة المجموعات من الكاش
export async function fetchCachedCollections(): Promise<CollectionsResponse> {
  try {
    const startTime = performance.now();
    const res = await fetch(`${API_BASE_URL}/api/collections?use_cache=true`);
    
    if (!res.ok) {
      throw new Error(`فشل في جلب المجموعات من الكاش: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const responseTime = performance.now() - startTime;
    console.log(`⏱️ وقت استجابة مجموعات الكاش: ${responseTime.toFixed(0)}ms`);
    
    return data;
  } catch (error) {
    console.warn('فشل جلب المجموعات من الكاش، جاري المحاولة بالطريقة العادية', error);
    return fetchCollections();
  }
}

// دالة لجلب قائمة المجموعات العادية
export async function fetchCollections(): Promise<CollectionsResponse> {
  try {
    const startTime = performance.now();
    const res = await fetch(`${API_BASE_URL}/api/collections`);
    
    if (!res.ok) {
      throw new Error(`فشل في جلب المجموعات: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const responseTime = performance.now() - startTime;
    console.log(`⏱️ وقت استجابة المجموعات: ${responseTime.toFixed(0)}ms, المصدر: ${data.source}`);
    
    return data;
  } catch (error) {
    console.error('فشل جلب قائمة المجموعات:', error);
    
    // إنشاء استجابة وهمية في حالة الخطأ
    const placeholderResponse: CollectionsResponse = {
      collections: [],
      total_collections: 0,
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      is_stale: true,
      source: "error_fallback"
    };
    
    return placeholderResponse;
  }
}

// دالة لفحص صحة API
export async function checkAPIHealth(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`API غير صحي: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('فشل فحص صحة API:', error);
    throw error;
  }
}

// دالة للحصول على حالة النظام
export async function getSystemStatus(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) {
      throw new Error(`فشل جلب حالة النظام: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('فشل جلب حالة النظام:', error);
    throw error;
  }
}
