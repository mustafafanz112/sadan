import React, { useState, useMemo } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';
import GiftFilter from './components/GiftFilter';
import DataSourceIndicator from './components/DataSourceIndicator';
import FooterInfoBar from './components/FooterInfoBar';
import { useCollections } from './hooks/useCollections';
import { useGifts } from './hooks/useGifts';

// SVG Icons ... (كماهي أو import من ملف svg منفصل)

const App = () => {
  const { collections, loading: collectionsLoading, error: collectionsError } = useCollections();
  const { gifts, loading, error, dataSource, tonPrice, hasPlaceholderData } = useGifts(collections);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
  const [selectedBubbleData, setSelectedBubbleData] = useState<any>(null);

  // فلترة الهدايا للعرض
  const filteredGifts = useMemo(
    () => gifts.filter(gift => selectedGifts.length === 0 || selectedGifts.includes(gift.id)),
    [gifts, selectedGifts]
  );

  // أقل هدية سعرًا
  const overallMinGift = useMemo(() => {
    const validGifts = gifts.filter(g => g.is_valid && g.min_price_usd > 0);
    if (validGifts.length === 0) return null;
    return validGifts.reduce((min, gift) => (gift.min_price_usd < min.min_price_usd ? gift : min));
  }, [gifts]);

  // دالة فحص تحميل الهدية
  const isGiftLoaded = (gift: any) => gift.is_valid && gift.min_price_usd > 0 && !gift.isLoading;

  if (collectionsLoading) {
    return <div>جاري تحميل قائمة المجموعات...</div>;
  }
  if (collectionsError) {
    return <div>{collectionsError} (تم استخدام قائمة افتراضية)</div>;
  }

  return (
    <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
      {/* ... style */}
      <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
        <GiftFilter
          gifts={gifts}
          selectedGifts={selectedGifts}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
          onChange={id =>
            setSelectedGifts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
          }
          isGiftLoaded={isGiftLoaded}
        />
        {/* ... أزرار الفرز */}
      </div>
      <DataSourceIndicator dataSource={dataSource} hasPlaceholderData={hasPlaceholderData} />
      <BubbleCanvas
        cryptoData={filteredGifts}
        loading={loading}
        selectedCryptos={selectedGifts}
        sortMethod={sortMethod === 'price' ? 'marketCap' : 'random'}
        onBubbleClick={setSelectedBubbleData}
      />
      {selectedBubbleData && (
        <GiftModal bubbleData={selectedBubbleData} onClose={() => setSelectedBubbleData(null)} />
      )}
      <FooterInfoBar tonPrice={tonPrice} overallMinGift={overallMinGift} />
    </div>
  );
};

export default App;
