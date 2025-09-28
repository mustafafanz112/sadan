import React from 'react';
import GiftCardSkeleton from './GiftCardSkeleton';

interface Gift {
  id: string;
  name: string;
  image: string;
  min_price_usd: number;
  is_valid?: boolean;
  isLoading?: boolean;
}

type Props = {
  gifts: Gift[];
  selectedGifts: string[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (id: string) => void;
  isGiftLoaded: (gift: Gift) => boolean;
};

const GiftFilter: React.FC<Props> = ({ gifts, selectedGifts, isOpen, onToggle, onChange, isGiftLoaded }) => {
  return (
    <div className="relative">
      <button
        className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg flex items-center text-xs md:text-sm transition-colors duration-200"
        onClick={onToggle}
      >
        {/* يمكنك استبدال الأيقونة هنا حسب الحاجة */}
        <span className="hidden md:block ml-1">Filter</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2 border border-gray-600">
          {gifts.map(gift => (
            <div key={gift.id}>
              {isGiftLoaded(gift) ? (
                <div className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={selectedGifts.includes(gift.id)}
                    onChange={() => onChange(gift.id)}
                    className="form-checkbox h-4 w-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                  />
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="w-6 h-6 rounded-full ml-2 object-cover"
                    onError={e => {
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
                <GiftCardSkeleton name={gift.name} isError={!gift.isLoading} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftFilter;
