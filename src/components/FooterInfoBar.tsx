import React from 'react';

type Props = {
  tonPrice: number | null;
  overallMinGift: { name: string; min_price_usd: number } | null;
};

const FooterInfoBar: React.FC<Props> = ({ tonPrice, overallMinGift }) => (
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
);

export default FooterInfoBar;
