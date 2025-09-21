// src/App.tsx - التعديلات الرئيسية
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';
import { fetchCachedGiftPrices, fetchGiftPrices, fetchCachedCollections, fetchCollections } from './services/api';
import GiftCardSkeleton from './components/GiftCardSkeleton';

// SVG Icons (تبقى كما هي)
const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// واجهة Gift الرئيسية
interface Gift {
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

// قائمة المجموعات الافتراضية كاحتياطي
const FALLBACK_COLLECTIONS = [
  "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Jingle Bells", "Pet Snake",
  "Tama Gadget", "Lunar Snake", "Snow Mittens", "Witch Hat", "Lol Pop",
  "Spy Agaric", "Bunny Muffin", "Low Rider", "Whip Cupcake", "Berry Box",
  "Swag Bag", "Precious Peach", "Light Sword", "Durov's Cap", "Bow Tie",
  "Candy Cane", "Heroic Helmet", "Sleigh Bell", "Snake Box", "Neko Helmet",
  "Diamond Ring", "Sakura Flower", "Westside Sign", "Evil Eye", "Record Player",
  "Skull Flower", "Easter Egg", "B-Day Candle", "Desk Calendar", "Star Notepad",
  "Joyful Bundle", "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Sharp Tongue",
  "Snow Globe", "Holiday Drink", "Flying Broom", "Big Year", "Hypno Lollipop",
  "Genie Lamp", "Bonded Ring", "Spiced Wine", "Snoop Cigar", "Xmas Stocking",
  "Homemade Cake", "Toy Bear", "Vintage Cigar", "Signet Ring", "Gem Signet",
  "Lush Bouquet", "Santa Hat", "Winter Wreath", "Nail Bracelet", "Ginger Cookie",
  "Perfume Bottle", "Crystal Ball", "Mini Oscar", "Jelly Bunny", "Jester Hat",
  "Cookie Heart", "Jack-in-the-Box", "Hanging Star", "Trapped Heart", "Heart Locket",
  "Magic Potion", "Mad Pumpkin", "Party Sparkler", "Cupid Charm", "Kissed Frog",
  "Loot Bag", "Eternal Rose", "Love Candle", "Electric Skull", "Valentine Box",
  "Hex Pot", "Swiss Watch", "Top Hat", "Scared Cat", "Love Potion", "Astral Shard",
  "Ion Gem", "Voodoo Doll", "Restless Jar"
];

const App = () => {
    const [giftsData, setGiftsData] = useState<Gift[]>([]);
    const [overallMinGift, setOverallMinGift] = useState<Gift | null>(null);
    const [tonPrice, setTonPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collectionsError, setCollectionsError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null); 
    const [collections, setCollections] = useState<string[]>([]);
    const [dataSource, setDataSource] = useState<'cache' | 'live' | 'stale' | 'placeholder'>('cache');
    const [hasPlaceholderData, setHasPlaceholderData] = useState(false);

    // جلب قائمة المجموعات من API
    const fetchCollectionsData = useCallback(async () => {
        try {
            setCollectionsLoading(true);
            setCollectionsError(null);
            
            let collectionsData;
            try {
                // محاولة استخدام الكاش أولاً للحصول على استجابة سريعة
                console.log('🔍 جلب قائمة المجموعات من الكاش...');
                const cachedResponse = await fetchCachedCollections();
                collectionsData = cachedResponse.collections;
                console.log('✅ تم جلب المجموعات من الكاش بنجاح:', collectionsData.length);
                setDataSource('cache');
            } catch (cacheError) {
                console.warn('⚠️ فشل جلب المجموعات من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
                const liveResponse = await fetchCollections();
                collectionsData = liveResponse.collections;
                setDataSource(liveResponse.is_stale ? 'stale' : 'live');
            }
            
            if (collectionsData && collectionsData.length > 0) {
                const collectionNames = collectionsData.map((col: any) => col.name);
                setCollections(collectionNames);
                console.log('تم جلب المجموعات بنجاح:', collectionNames.length);
            } else {
                // استخدام القائمة الافتراضية إذا كانت الاستجابة فارغة
                console.warn('استجابة API للمجموعات فارغة، استخدام القائمة الافتراضية');
                setCollections(FALLBACK_COLLECTIONS);
            }
            
        } catch (err: any) {
            console.error("فشل في جلب قائمة المجموعات:", err);
            setCollectionsError(`فشل في جلب قائمة المجموعات: ${err.message}`);
            
            // استخدام القائمة الافتراضية كاحتياطي في حالة الخطأ
            setCollections(FALLBACK_COLLECTIONS);
            
        } finally {
            setCollectionsLoading(false);
        }
    }, []);

    const fetchGiftsData = useCallback(async (useCache: boolean = true) => {
        if (collections.length === 0) return;

        try {
            setLoading(true);
            setError(null);
            setHasPlaceholderData(false);

            // إنشاء هدايا placeholder أولية لكل مجموعة
            const placeholderGifts = collections.map(collection => ({
                id: `placeholder_${collection}`,
                model_name: collection,
                name: collection,
                min_price_ton: 0,
                min_price_usd: 0,
                image: '',
                symbol: collection.substring(0, 3).toUpperCase(),
                market_cap: 0,
                current_price: 0,
                is_valid: false,
                isLoading: true,
                isPlaceholder: true
            }));

            setGiftsData(placeholderGifts);
            setSelectedGifts(placeholderGifts.map(g => g.id));

            let apiData;
            let dataSourceType: 'cache' | 'live' | 'stale' | 'placeholder' = 'cache';
            
            if (useCache) {
                try {
                    apiData = await fetchCachedGiftPrices(collections);
                    console.log('✅ تم جلب الهدايا من الكاش بنجاح:', apiData.gifts.length);
                    dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'cache';
                } catch (cacheError) {
                    console.warn('فشل جلب الهدايا من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
                    apiData = await fetchGiftPrices(collections);
                    dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
                }
            } else {
                apiData = await fetchGiftPrices(collections);
                dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
            }

            console.log('API response:', apiData);
            setDataSource(dataSourceType);

            // التحقق من وجود بيانات وهمية
            if (apiData.source === 'placeholder' || apiData.gifts.some((g: any) => 
                g.price_usd === 0 || g.min_price_usd === 0 || !g.is_valid)) {
                setHasPlaceholderData(true);
            }

            // معالجة البيانات المستلمة من API
            const transformedGifts: Gift[] = apiData.gifts
                .map((gift: any) => ({
                    id: gift.id || gift.model_name || `gift_${Math.random()}`,
                    model_name: gift.model_name || gift.name || 'Unknown',
                    variant_name: gift.variant_name,
                    name: gift.name || gift.model_name || 'هدية',
                    min_price_ton: gift.price_ton || gift.min_price_ton || 0,
                    min_price_usd: gift.price_usd || gift.min_price_usd || 0,
                    image: gift.image || 'https://placehold.co/60x60/333/FFF?text=Gift',
                    symbol: (gift.model_name || gift.name || 'Unknown').substring(0, 3).toUpperCase(),
                    market_cap: gift.min_price_usd || 0,
                    current_price: gift.min_price_usd || 0,
                    price_change_percentage_24h: Math.random() > 0.5 ? 
                        Math.random() * 10 : 
                        Math.random() * -10,
                    is_valid: gift.is_valid !== undefined ? gift.is_valid : true,
                    isLoading: apiData.source === 'placeholder' || gift.price_usd === 0 || gift.min_price_usd === 0,
                    isPlaceholder: apiData.source === 'placeholder' || gift.price_usd === 0 || gift.min_price_usd === 0
                }));

            // دمج الهدايا الحقيقية مع الـ placeholders للعناصر غير المحملة
            const finalGifts = collections.map(collection => {
                const realGift = transformedGifts.find(g => g.model_name === collection);
                if (realGift && realGift.is_valid && realGift.min_price_usd > 0) {
                    return realGift;
                }
                // إذا لم يتم تحميل الهدية بعد أو كانت غير صالحة، نعيد placeholder
                return {
                    id: `placeholder_${collection}`,
                    model_name: collection,
                    name: collection,
                    min_price_ton: 0,
                    min_price_usd: 0,
                    image: '',
                    symbol: collection.substring(0, 3).toUpperCase(),
                    market_cap: 0,
                    current_price: 0,
                    price_change_percentage_24h: 0,
                    is_valid: false,
                    isLoading: true,
                    isPlaceholder: true
                };
            });

            setGiftsData(finalGifts);
            setSelectedGifts(finalGifts.map(g => g.id));

            // معالجة overallMinGift إذا كانت البيانات متاحة
            const validGifts = transformedGifts.filter(g => g.is_valid && g.min_price_usd > 0);
            if (validGifts.length > 0) {
                const minGift = validGifts.reduce((min, gift) => 
                    gift.min_price_usd < min.min_price_usd ? gift : min
                );
                
                setOverallMinGift({
                    ...minGift,
                    id: minGift.id || 'overall_min',
                    name: minGift.name || 'أرخص هدية'
                });
            } else {
                setOverallMinGift(null);
            }
            
            setTonPrice(apiData.ton_price);

        } catch (err: any) {
            console.error("فشل في جلب بيانات الهدايا:", err);
            setError(`فشل في جلب بيانات الهدايا: ${err.message}. يرجى التأكد من أن الـ API يعمل بشكل صحيح.`);
            setHasPlaceholderData(true);
            
            // في حالة الخطأ، نعرض الـ placeholders فقط
            const errorPlaceholders = collections.map(collection => ({
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
            }));
            
            setGiftsData(errorPlaceholders);
            setSelectedGifts(errorPlaceholders.map(g => g.id));
        } finally {
            setLoading(false);
        }
    }, [collections]);
  
    useEffect(() => {
        fetchCollectionsData();
    }, [fetchCollectionsData]);

    useEffect(() => {
        if (collections.length > 0 && !collectionsLoading) {
            // جلب البيانات من الكاش أولاً لعرض سريع
            fetchGiftsData(true);
            
            const interval = setInterval(() => {
                // تحديث البيانات في الخلفية
                fetchGiftsData(false);
            }, 300000); // 5 دقائق
            
            return () => clearInterval(interval);
        }
    }, [fetchGiftsData, collections, collectionsLoading]);

    // تعديل دالة التصفية لاستبعاد الهدايا غير الصالحة من العرض
    const filteredGifts = useMemo(() => 
        giftsData.filter(gift => selectedGifts.includes(gift.id)),
        [giftsData, selectedGifts]
    );

    // دالة مساعدة لتحديد إذا كانت الهدية محملة
    const isGiftLoaded = (gift: Gift) => {
        return gift.is_valid && gift.min_price_usd > 0 && !gift.isLoading;
    };

    const handleFilterChange = (giftId: string) => {
        setSelectedGifts(prevSelected => 
            prevSelected.includes(giftId)
                ? prevSelected.filter(id => id !== giftId)
                : [...prevSelected, giftId]
        );
    };

    const handleTimeframeChange = (timeframe: string) => {
        setSelectedTimeframe(timeframe);
    };

    const upCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h > 0).length;
    const downCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h < 0).length;

    // حالة التحميل للمجموعات
    if (collectionsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-300 mx-auto"></div>
                    <p className="mt-4 text-xl">جاري تحميل قائمة المجموعات...</p>
                </div>
            </div>
        );
    }

    if (collectionsError) {
        return (
            <div className="flex items-center justify-center h-screen bg-red-800 text-white font-sans p-4">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                 <div className="text-center bg-red-900 p-6 rounded-lg shadow-xl">
                    <p className="text-xl font-bold mb-4">خطأ في جلب قائمة المجموعات:</p>
                    <p>{collectionsError}</p>
                    <p className="mt-4 text-sm text-red-200">
                        تم استخدام قائمة افتراضية كاحتياطي.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>
            
            <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="relative">
                        <button 
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg flex items-center text-xs md:text-sm transition-colors duration-200"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <LuEye className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:block ml-1">Filter</span>
                        </button>
                      {isFilterOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2 border border-gray-600">
            {filteredGifts.map((gift) => (
            <div key={gift.id}>
              {isGiftLoaded(gift) ? (
              // عرض البطاقة العادية إذا كانت محملة
              <div className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
                <input 
                  type="checkbox" 
                  checked={selectedGifts.includes(gift.id)}
                  onChange={() => handleFilterChange(gift.id)}
                  className="form-checkbox h-4 w-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                  />
                <img 
                  src={gift.image} 
                  alt={gift.name}
                  className="w-6 h-6 rounded-full ml-2 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/24x24/333/FFF?text=G';
                  }}
                  />
                <span className="ml-2 text-gray-200 text-sm truncate" title={gift.name}>
                  {gift.name}
                </span>
                {gift.min_price_usd > 0 && (
                <span className="ml-auto text-green-400 text-xs">
                  ${gift.min_price_usd.toFixed(2)}
                </span>
              )}
              </div>
            ) : (
              // عرض الـ skeleton إذا لم تكن محملة
              <GiftCardSkeleton 
                name={gift.name} 
                isError={!gift.isLoading} // إذا لم تكن في حالة تحميل، فهي خطأ
                />
            )}
            </div>
          ))}
          </div>
                        )}

                    </div>
                    <div className="flex items-center text-green-400 font-bold text-xs md:text-sm">
                        <LuChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>{upCount}</span>
                    </div>
                    <div className="flex items-center text-red-400 font-bold text-xs md:text-sm">
                        <LuChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>{downCount}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 md:space-x-2">
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'Day' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('Day')}
                    >
                        Day
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'Week' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('Week')}
                    >
                        Week
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'All time' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('All')}
                    >
                        All
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${sortMethod === 'price' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => setSortMethod(sortMethod === 'price' ? 'random' : 'price')}
                    >
                        {sortMethod === 'price' ? 'Default Sort' : 'Sort by Price'} 
                    </button>
                </div>
            </div>
            
            {/* مؤشر مصدر البيانات */}
            <div className="w-full text-center mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                    dataSource === 'cache' ? 'bg-green-500 text-white' :
                    dataSource === 'stale' ? 'bg-yellow-500 text-black' :
                    dataSource === 'placeholder' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                }`}>
                    {dataSource === 'cache' ? 'بيانات مخبأة ✓' :
                     dataSource === 'stale' ? 'بيانات قديمة ⚡' :
                     dataSource === 'placeholder' ? 'بيانات وهمية ⏳' :
                     'بيانات حية 🔄'}
                </span>
                
                {hasPlaceholderData && (
                    <div className="mt-1 text-xs text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded">
                        ⚠️ بعض البيانات لا تزال قيد التحميل...
                    </div>
                )}
            </div>

            <BubbleCanvas
                cryptoData={filteredGifts}
                loading={loading}
                selectedCryptos={selectedGifts}
                sortMethod={sortMethod === 'price' ? 'marketCap' : 'random'}
                onBubbleClick={setSelectedBubbleData}
            />

            {selectedBubbleData && (
                <GiftModal 
                    bubbleData={selectedBubbleData}
                    onClose={() => setSelectedBubbleData(null)} 
                />
            )}

            <div className="flex flex-col sm:flex-row justify-around items-center bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3 mt-2 text-sm md:text-base">
                {tonPrice !== null && (
                    <div className="text-center flex-1 p-1">
                        <p className="text-gray-400">سعر TON الحالي:</p>
                        <p className="text-green-400 font-bold text-lg">${tonPrice.toFixed(4)}</p>
                    </div>
                )}
                {overallMinGift && (
                    <div className="text-center flex-1 p-1 mt-2 sm:mt-0">
                        <p className="text-gray-400">أرخص هدية:</p>
                        <p className="text-yellow-400 font-bold text-lg">{overallMinGift.name}</p>
                        <p className="text-blue-300">(${overallMinGift.min_price_usd.toFixed(2)} USD)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
