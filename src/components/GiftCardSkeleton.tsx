// src/components/GiftCardSkeleton.tsx
import React from 'react';

interface GiftCardSkeletonProps {
  name: string;
  isError?: boolean;
}

const GiftCardSkeleton: React.FC<GiftCardSkeletonProps> = ({ name, isError = false }) => {
  return (
    <div className={`flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 ${
      isError ? 'bg-red-900/20 border border-red-700' : 'bg-gray-700 animate-pulse'
    }`}>
      <div className="flex items-center w-full">
        {/* صورة placeholder */}
        <div className={`w-6 h-6 rounded-full ${
          isError ? 'bg-red-600' : 'bg-gray-600'
        }`}></div>
        
        {/* نص placeholder */}
        <div className="ml-2 flex-1 min-w-0">
          <div className={`text-sm truncate ${
            isError ? 'text-red-300' : 'text-gray-400'
          }`} title={name}>
            {isError ? '❌ فشل التحميل' : name}
          </div>
          <div className={`text-xs ${
            isError ? 'text-red-400' : 'text-gray-500'
          }`}>
            {isError ? 'يرجى المحاولة لاحقاً' : 'جار التحميل...'}
          </div>
        </div>
      </div>
      
      {/* خانة الاختيار */}
      <input 
        type="checkbox" 
        disabled
        className="form-checkbox h-4 w-4 ml-2 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
      />
    </div>
  );
};

export default GiftCardSkeleton;
