import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// واجهة Gift
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
}

interface GiftModalProps {
    bubbleData?: Gift | null;
    data?: Gift | null; // للتوافق مع الأسماء القديمة
    onClose: () => void;
}

const GiftModal: React.FC<GiftModalProps> = ({ bubbleData, data, onClose }) => {
    // دعم كلا الاسمين للتوافق
    const giftData = bubbleData || data;
    
    const [chartTimeframe, setChartTimeframe] = useState('1D');
    const chartRef = useRef<SVGSVGElement>(null);

    // Simulated historical data for charting
    const generateChartData = useCallback((timeframe: string) => {
        const now = new Date();
        let data = [];
        let numPoints;
        let interval;

        switch (timeframe) {
            case '1H':
                numPoints = 60; // Every minute for the last hour
                interval = 60 * 1000; // 1 minute in ms
                break;
            case '1D':
                numPoints = 24; // Every hour for the last day
                interval = 60 * 60 * 1000; // 1 hour in ms
                break;
            case '1W':
                numPoints = 7; // Every day for the last week
                interval = 24 * 60 * 60 * 1000; // 1 day in ms
                break;
            case '1M':
                numPoints = 30; // Every day for the last month
                interval = 24 * 60 * 60 * 1000; // 1 day in ms
                break;
            case 'ALL TIME':
                numPoints = 100; // More points for a longer period
                interval = 30 * 24 * 60 * 60 * 1000; // 1 month in ms
                break;
            default:
                numPoints = 24;
                interval = 60 * 60 * 1000;
        }

        for (let i = 0; i < numPoints; i++) {
            const date = new Date(now.getTime() - (numPoints - 1 - i) * interval);
            // Simulate price fluctuation around the current price from giftData
            const price = (giftData?.current_price || 0) * (1 + (Math.random() - 0.5) * 0.2);
            data.push({ date, price });
        }
        return data;
    }, [giftData]); // يعتمد على giftData لتوليد بيانات الرسم البياني

    // Effect for D3 chart rendering within the modal
    useEffect(() => {
        if (!giftData || !chartRef.current) return;

        const chartData = generateChartData(chartTimeframe);
        const svg = d3.select(chartRef.current);
        svg.selectAll('*').remove(); // Clear previous chart

        const margin = { top: 20, right: 30, bottom: 30, left: 50 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = chartRef.current.clientHeight - margin.top - margin.bottom;

        if (width <= 0 || height <= 0) return; // Prevent drawing on invalid dimensions

        // Define gradient for area chart fill - moved here to be within the useEffect scope
        const defs = svg.append("defs");
        const chartGradient = defs.append("linearGradient")
            .attr("id", "chartGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        chartGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(59, 130, 246, 0.5)"); // Blue with transparency
        chartGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(59, 130, 246, 0)"); // Transparent blue

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(chartData, d => d.date) as [Date, Date]) // تحديد النوع لضمان عدم وجود undefined
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(chartData, d => d.price) as number * 0.95, d3.max(chartData, d => d.price) as number * 1.05]) // تحديد النوع
            .range([height, 0]);

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(d3.timeFormat(chartTimeframe === '1H' ? '%H:%M' : '%Y-%m-%d') as any)
                .tickSizeOuter(0)
            )
            .selectAll("text")
            .style("fill", "#9ca3af"); // Gray text for axis labels

        g.append("g")
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => `$${d3.format(".2s")(d as number)}`)
            )
            .selectAll("text")
            .style("fill", "#9ca3af"); // Gray text for axis labels

        // Grid lines
        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat("" as any))
            .selectAll("line")
            .attr("stroke", "#4b5563") // Darker gray for grid lines
            .attr("stroke-dasharray", "2,2");

        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat("" as any))
            .selectAll("line")
            .attr("stroke", "#4b5563") // Darker gray for grid lines
            .attr("stroke-dasharray", "2,2");

        // Area path
        const area = d3.area<{ date: Date, price: number }>() // تحديد نوع البيانات لـ d3.area
            .x(d => xScale(d.date))
            .y0(height)
            .y1(d => yScale(d.price));

        g.append("path")
            .datum(chartData)
            .attr("fill", "url(#chartGradient)") // Use gradient for area fill
            .attr("stroke", "#3B82F6") // Blue line
            .attr("stroke-width", 1.5)
            .attr("d", area || ""); // إضافة fallback لمنع الأخطاء

    }, [giftData, chartTimeframe, generateChartData]); // إعادة ترتيب التبعيات هنا

    if (!giftData) return null;

    // Simulated data for the gift/coin details and Fear & Greed Index
    const simulatedGiftData = {
        initialSupply: 15000,
        supply: 5448,
        upgraded: 8887,
        burnt: 5318,
        percentBurnt: 28.8,
        percentUpgraded: 53.5,
    };

    const fearGreedIndex = 87; // Example value

    // Function to draw the semi-circle gauge for Fear & Greed Index
    const drawGauge = (value: number, max = 100) => {
        const radius = 40; // Smaller radius for the gauge
        const arcWidth = 8;
        const angleScale = d3.scaleLinear()
            .domain([0, max])
            .range([-Math.PI / 2, Math.PI / 2]);

        const arcGenerator = d3.arc()
            .innerRadius(radius - arcWidth)
            .outerRadius(radius)
            .startAngle(-Math.PI / 2);

        const needleLength = radius - arcWidth - 5;
        const needleBaseWidth = 2;

        return (
            <svg width={radius * 2 + 20} height={radius + 30} viewBox={`0 0 ${radius * 2 + 20} ${radius + 30}`}>
                {/* التدرج اللوني */}
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" /> {/* أحمر */}
                        <stop offset="50%" stopColor="#FBBF24" /> {/* أصفر */}
                        <stop offset="100%" stopColor="#22C55E" /> {/* أخضر */}
                    </linearGradient>
                </defs>

                <g transform={`translate(${radius + 10}, ${radius + 10})`}>
                    {/* الخلفية */}
                    <path d={arcGenerator({ endAngle: Math.PI / 2 }) || undefined} fill="#4b5563" /> {/* إضافة || undefined */}
                    {/* القوس المتدرج */}
                    <path d={arcGenerator({ endAngle: angleScale(value) }) || undefined} fill="url(#gaugeGradient)" /> {/* إضافة || undefined */}

                    {/* المؤشر */}
                    <line
                        x1="0" y1="0"
                        x2="0" y2={-needleLength}
                        stroke="#fff"
                        strokeWidth={needleBaseWidth}
                        strokeLinecap="round"
                        transform={`rotate(${angleScale(value) * 180 / Math.PI})`}
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={`0 0 0`}
                            to={`${angleScale(value) * 180 / Math.PI} 0 0`}
                            dur="0.5s"
                            fill="freeze"
                        />
                    </line>
                    <circle r="3" fill="#fff" /> {/* النقطة المركزية */}

                    {/* النص */}
                    <text x="0" y="10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">{value}</text>
                    <text x="0" y="20" textAnchor="middle" fill="#9ca3af" fontSize="9">FEAR/GREED</text>
                </g>
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            {/* Modal Container with Glassmorphism */}
            <div className="bg-gray-800 bg-opacity-30 backdrop-filter backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative flex flex-col">
                {/* Close Button */}
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl font-bold p-2 rounded-full hover:bg-gray-700 transition-colors"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Top 50% Section - Grid Layout */}
                <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-grow-0 flex-shrink-0 h-1/2 mb-4">
                    {/* Part 2 (Top Left): Fear & Greed Index - Now in top-left */}
                    <div className="flex flex-col items-start justify-center p-2">
                        {drawGauge(fearGreedIndex)}
                        <div className="bg-gray-700 text-gray-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-3 leading-tight">
                            The market in general
                        </div>
                    </div>

                    {/* Part 1 (Top Right): Price and % Change - Now in top-right */}
                    <div className="flex flex-col items-end justify-center p-2">
                        {/* عرض سعر TON وسعر USD الحقيقيين من giftData */}
                        <p className="text-xl font-bold text-gray-100">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(giftData.min_price_usd)}
                        </p>
                        <p className="text-gray-300 text-sm mb-1">
                            {giftData.min_price_ton.toFixed(4)} TON
                        </p>
                        {giftData.price_change_percentage_24h !== undefined && (
                            <p className={`text-lg font-semibold ${giftData.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {giftData.price_change_percentage_24h >= 0 ? '+' : ''}{giftData.price_change_percentage_24h.toFixed(2)}%
                            </p>
                        )}
                    </div>

                    {/* Part 4 (Bottom Left): Supply Data - Now in bottom-left */}
                    <div className="flex flex-col items-start justify-center p-2 text-sm">
                         {/* عرض اسم الهدية والنموذج */}
                         <p className="text-base font-bold text-gray-100 mb-2">{giftData.name}</p>
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">Model Name:</span>
                            <span className="text-gray-100 font-semibold">{giftData.model_name}</span>
                        </div>
                        {giftData.variant_name && (
                            <div className="flex justify-between w-full mb-0.5">
                                <span className="text-gray-300">Variant Name:</span>
                                <span className="text-gray-100 font-semibold">{giftData.variant_name}</span>
                            </div>
                        )}
                        {/* يمكنك إضافة المزيد من تفاصيل 'simulatedGiftData' هنا إذا كانت متاحة من الـ API */}
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">Initial Supply:</span>
                            <span className="text-gray-100 font-semibold">{simulatedGiftData.initialSupply.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">Supply:</span>
                            <span className="text-gray-100 font-semibold">{simulatedGiftData.supply.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">Upgraded:</span>
                            <span className="text-gray-100 font-semibold">{simulatedGiftData.upgraded.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">Burnt:</span>
                            <span className="text-gray-100 font-semibold">{simulatedGiftData.burnt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-gray-300">% Burnt:</span>
                            <span className="text-orange-400 font-semibold">{simulatedGiftData.percentBurnt}%</span>
                        </div>
                        <div className="flex justify-between w-full">
                            <span className="text-gray-300"> % Upgraded:</span>
                            <span className="text-blue-400 font-semibold">{simulatedGiftData.percentUpgraded}%</span>
                        </div>
                    </div>

                    {/* Part 3 (Bottom Right): Gift/Coin Image and Name - Now in bottom-right */}
                    <div className="flex flex-col items-end justify-center p-2">
                        <img src={giftData.image} alt={giftData.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mb-2" />
                        {/* عرض اسم الهدية بشكل أوضح */}
                        <h3 className="text-lg font-bold text-gray-100 text-right">{giftData.name}</h3>
                        {giftData.variant_name && giftData.name !== giftData.variant_name && (
                             <p className="text-sm text-gray-400 text-right">{giftData.variant_name}</p>
                        )}
                    </div>
                </div>

                {/* Bottom 50% Section - Chart and Time Filters */}
                <div className="flex flex-col flex-grow h-1/2">
                    {/* Chart Timeframe Filters */}
                    <div className="flex justify-around bg-gray-700 rounded-lg p-1 mb-2 flex-shrink-0">
                        {['1H', '1D', '1W', '1M', 'ALL TIME'].map(tf => (
                            <button
                                key={tf}
                                className={`px-3 py-1 text-xs md:text-sm rounded-md font-semibold ${chartTimeframe === tf ? 'bg-green-500 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                                onClick={() => setChartTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div className="w-full flex-grow bg-gray-900 rounded-lg p-2">
                        <svg ref={chartRef} className="w-full h-full"></svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiftModal;
