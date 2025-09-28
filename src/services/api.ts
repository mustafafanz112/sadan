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

// بيانات وهمية للتطوير
const MOCK_GIFTS: Gift[] = [
  {
    id: '1',
    model_name: 'NFT Collection 1',
    name: 'Golden Dragon NFT',
    variant_name: 'Limited Edition',
    min_price_ton: 45.2,
    min_price_usd: 113.0,
    image: 'https://via.placeholder.com/200x200/FFD700/000000?text=Golden+Dragon',
    symbol: 'GDR',
    market_cap: 1500000,
    current_price: 45.2,
    price_change_percentage_24h: 12.5,
    is_valid: true,
    isLoading: false
  },
  {
    id: '2',
    model_name: 'NFT Collection 2',
    name: 'Cyber Punk Avatar',
    variant_name: 'Rare',
    min_price_ton: 28.7,
    min_price_usd: 71.75,
    image: 'https://via.placeholder.com/200x200/00FF00/000000?text=Cyber+Punk',
    symbol: 'CPA',
    market_cap: 890000,
    current_price: 28.7,
    price_change_percentage_24h: -2.3,
    is_valid: true,
    isLoading: false
  },
  {
    id: '3',
    model_name: 'NFT Collection 3',
    name: 'Ocean Warrior',
    variant_name: 'Epic',
    min_price_ton: 67.9,
    min_price_usd: 169.75,
    image: 'https://via.placeholder.com/200x200/0000FF/FFFFFF?text=Ocean+Warrior',
    symbol: 'OWR',
    market_cap: 2100000,
    current_price: 67.9,
    price_change_percentage_24h: 5.7,
    is_valid: true,
    isLoading: false
  },
  {
    id: '4',
    model_name: 'NFT Collection 4',
    name: 'Forest Guardian',
    min_price_ton: 15.3,
    min_price_usd: 38.25,
    image: 'https://via.placeholder.com/200x200/008000/FFFFFF?text=Forest+Guardian',
    symbol: 'FGR',
    market_cap: 450000,
    current_price: 15.3,
    price_change_percentage_24h: 8.1,
    is_valid: true,
    isLoading: false
  },
  {
    id: '5',
    model_name: 'NFT Collection 5',
    name: 'Fire Phoenix',
    variant_name: 'Legendary',
    min_price_ton: 120.5,
    min_price_usd: 301.25,
    image: 'https://via.placeholder.com/200x200/FF4500/FFFFFF?text=Fire+Phoenix',
    symbol: 'FPH',
    market_cap: 3500000,
    current_price: 120.5,
    price_change_percentage_24h: 15.2,
    is_valid: true,
    isLoading: false
  }
];

const MOCK_COLLECTIONS: Collection[] = [
  {
    name: 'Dragon Series',
    image_url: 'https://via.placeholder.com/100x100/FFD700/000000?text=Dragons',
    count: 150,
    floor: '45.2 TON'
  },
  {
    name: 'Cyber Punk World',
    image_url: 'https://via.placeholder.com/100x100/00FF00/000000?text=Cyber',
    count: 89,
    floor: '28.7 TON'
  },
  {
    name: 'Ocean Guardians',
    image_url: 'https://via.placeholder.com/100x100/0000FF/FFFFFF?text=Ocean',
    count: 67,
    floor: '67.9 TON'
  },
  {
    name: 'Forest Creatures',
    image_url: 'https://via.placeholder.com/100x100/008000/FFFFFF?text=Forest',
    count: 120,
    floor: '15.3 TON'
  },
  {
    name: 'Mythical Beasts',
    image_url: 'https://via.placeholder.com/100x100/FF4500/FFFFFF?text=Mythical',
    count: 45,
    floor: '120.5 TON'
  }
];

// متغير للتحكم بين البيانات الوهمية والحقيقية
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                     !import.meta.env.VITE_API_BASE_URL || 
                     import.meta.env.MODE === 'development';

console.log(`🎯 ${USE_MOCK_DATA ? 'Using MOCK DATA for development' : 'Using REAL API data'}`);

// دالة لتأخير محاكاة لاستجابة الشبكة
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// دالة لجلب البيانات من الكاش فقط (سريعة)
export async function fetchCachedGiftPrices(collections: string[]): Promise<GiftsResponse> {
  if (USE_MOCK_DATA) {
    await delay(500); // محاكاة تأخير الشبكة
    console.log('🎁 استخدام بيانات الهدايا الوهمية (الكاش)');
    
    return {
      gifts: MOCK_GIFTS,
      ton_price: 2.50,
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      total_items: MOCK_GIFTS.length,
      valid_items: MOCK_GIFTS.length,
      success_rate: "100%",
      is_stale: false,
      source: "mock_data"
    };
  }

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
  if (USE_MOCK_DATA) {
    await delay(800); // محاكاة تأخير أطول للبيانات العادية
    console.log('🎁 استخدام بيانات الهدايا الوهمية (API)');
    
    // إضافة بعض الاختلاف في البيانات لمحاكاة التحديث
    const updatedGifts = MOCK_GIFTS.map(gift => ({
      ...gift,
      min_price_ton: gift.min_price_ton * (0.95 + Math.random() * 0.1), // تغيير عشوائي بسيط في السعر
      current_price: gift.current_price * (0.95 + Math.random() * 0.1),
      price_change_percentage_24h: (Math.random() - 0.5) * 30 // تغيير بين -15% إلى +15%
    }));
    
    return {
      gifts: updatedGifts,
      ton_price: 2.50 + (Math.random() - 0.5) * 0.1, // تغيير بسيط في سعر TON
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      total_items: updatedGifts.length,
      valid_items: updatedGifts.length,
      success_rate: "100%",
      is_stale: false,
      source: "mock_data_updated"
    };
  }

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
  if (USE_MOCK_DATA) {
    await delay(400);
    console.log('📚 استخدام بيانات المجموعات الوهمية (الكاش)');
    
    return {
      collections: MOCK_COLLECTIONS,
      total_collections: MOCK_COLLECTIONS.length,
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      is_stale: false,
      source: "mock_data"
    };
  }

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
  if (USE_MOCK_DATA) {
    await delay(600);
    console.log('📚 استخدام بيانات المجموعات الوهمية (API)');
    
    return {
      collections: MOCK_COLLECTIONS,
      total_collections: MOCK_COLLECTIONS.length,
      timestamp: Date.now(),
      last_updated: new Date().toISOString(),
      is_stale: false,
      source: "mock_data"
    };
  }

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
  if (USE_MOCK_DATA) {
    await delay(200);
    console.log('✅ فحص صحة API الوهمي');
    return { status: 'healthy', message: 'Mock API is working perfectly' };
  }

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
  if (USE_MOCK_DATA) {
    await delay(300);
    console.log('📊 حالة النظام الوهمية');
    return {
      status: 'operational',
      last_update: new Date().toISOString(),
      cache_size: 1024,
      active_workers: 3,
      uptime: 86400,
      version: '1.0.0-mock'
    };
  }

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

// دالة إضافية للحصول على هدية واحدة بواسطة ID (وهمية)
export async function fetchGiftById(id: string): Promise<Gift | null> {
  if (USE_MOCK_DATA) {
    await delay(300);
    return MOCK_GIFTS.find(gift => gift.id === id) || null;
  }
  
  // implementation for real API...
  return null;
}
