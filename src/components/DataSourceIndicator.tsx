import React from 'react';

type Props = {
  dataSource: 'cache' | 'live' | 'stale' | 'placeholder';
  hasPlaceholderData: boolean;
};

const DataSourceIndicator: React.FC<Props> = ({ dataSource, hasPlaceholderData }) => (
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
);

export default DataSourceIndicator;
