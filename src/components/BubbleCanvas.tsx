import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

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

interface BubbleCanvasProps {
  cryptoData?: Gift[];
  loading?: boolean;
  selectedCryptos?: string[];
  sortMethod?: string;
  onBubbleClick: (data: Gift) => void;
}

const BubbleCanvas: React.FC<BubbleCanvasProps> = ({ 
  cryptoData = [], 
  loading = false, 
  selectedCryptos = [], 
  sortMethod = 'marketCap', 
  onBubbleClick 
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // إعداد الأبعاد والاستجابة
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // منطق الفقاعات المحسن من Gift Bubbles
    useEffect(() => {
        if (!cryptoData.length || loading || !svgRef.current) {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
            return;
        }

        // إيقاف المحاكاة السابقة
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const contentWidth = width - margin.left - margin.right;
        const contentHeight = height - margin.top - margin.bottom;

        // تصفية البيانات المحددة
        const filteredData = selectedCryptos.length 
            ? cryptoData.filter(d => selectedCryptos.includes(d.id))
            : cryptoData;

        if (filteredData.length === 0) {
            simulationRef.current = null;
            return;
        }

        // فرز البيانات
        let sortedData = [...filteredData];
        if (sortMethod === 'marketCap') {
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        } else if (sortMethod === 'priceChange') {
            sortedData.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
        }

        // حساب أحجام الفقاعات باستخدام منطق Gift Bubbles المتقدم
        const nodes = calculateBubbleSizes(sortedData, contentWidth, contentHeight);
        
        // إضافة فقاعة البوت (مثل Gift Bubbles)
        const botBubble = createBotBubble(nodes, contentWidth, contentHeight);
        nodes.push(botBubble);

        // إنشاء المحاكاة الفيزيائية المحسنة - بدون قوة الجذب إلى الوسط
        const simulation = createEnhancedSimulation(nodes, contentWidth, contentHeight);
        simulationRef.current = simulation;

        // إنشاء التدرجات اللونية المحسنة
        createGradients(svg);

        // إنشاء مجموعات الفقاعات
        const bubbleGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .selectAll('.bubble')
            .data(nodes, (d: any) => d.id)
            .join('g')
            .attr('class', 'bubble')
            .attr('transform', (d: any) => `translate(${d.x || contentWidth/2}, ${d.y || contentHeight/2})`);

        // إضافة سلوك السحب (مثل Gift Bubbles)
        setupDragBehavior(bubbleGroup, simulation);

        // رسم الفقاعات مع التصميم المحسن
        drawBubbles(bubbleGroup, svg, contentWidth, contentHeight);

        // إعداد التلميحات (مثل Gift Bubbles)
        setupTooltips(bubbleGroup, tooltipRef, hoverTimeoutRef);

        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };
    }, [cryptoData, loading, selectedCryptos, sortMethod, dimensions, onBubbleClick]);

    // دالة حساب أحجام الفقاعات (منطق Gift Bubbles)
    const calculateBubbleSizes = (data: Gift[], width: number, height: number, targetCoverage: number = 0.65) => {
        const totalArea = width * height;
        const minRadius = Math.min(width, height) * 0.03;
        const maxRadius = Math.min(width, height) * 0.15;

        // البحث الثنائي لإيجاد الحجم المناسب (مثل Gift Bubbles)
        let low = 1e-6;
        let high = 1000;
        let result: any[] = [];

        for (let i = 0; i < 30; i++) {
            const mid = (low + high) / 2;
            
            const bubbles = data.map(item => {
                const value = Math.abs(item.market_cap) || Math.abs(item.current_price) || 1;
                const radius = Math.min(maxRadius, Math.max(minRadius, Math.sqrt(mid * value)));
                return { 
                    ...item, 
                    r: radius,
                    value: item.price_change_percentage_24h || 0
                };
            });

            const coverage = d3.sum(bubbles, (d: any) => Math.PI * d.r * d.r) / totalArea;
            
            if (Math.abs(coverage - targetCoverage) < 0.01) {
                result = bubbles;
                break;
            }
            
            if (coverage > targetCoverage) {
                high = mid;
            } else {
                low = mid;
            }
            result = bubbles;
        }

        return result;
    };

    // إنشاء فقاعة البوت (مثل Gift Bubbles)
    const createBotBubble = (nodes: any[], width: number, height: number) => {
        const maxRadius = d3.max(nodes, (d: any) => d.r) || 50;
        const botRadius = maxRadius * 0.6;

        return {
            id: 'gift_graphs_bot',
            name: 'Gift Graphs Bot',
            symbol: '@GiftGraphsBot',
            image: '',
            isBot: true,
            r: botRadius,
            market_cap: 0,
            current_price: 0,
            price_change_percentage_24h: 0,
            model_name: 'Telegram Bot',
            min_price_ton: 0,
            min_price_usd: 0,
            x: width / 2,
            y: height / 2,
            value: 0
        };
    };

    // إنشاء المحاكاة الفيزيائية المحسنة - بدون قوة الجذب إلى الوسط
    const createEnhancedSimulation = (nodes: any[], width: number, height: number) => {
        const simulation = d3.forceSimulation(nodes)
            // ❌ تم إزالة: .force('center', d3.forceCenter(width / 2, height / 2))
            // ❌ تم إزالة: .force('x', d3.forceX(width / 2).strength(d => d.isBot ? 0.8 : 0.1))
            // ❌ تم إزالة: .force('y', d3.forceY(height / 2).strength(d => d.isBot ? 0.8 : 0.1))
            
            // ✅ تم الإبقاء على: قوة التصادم
            .force('collision', d3.forceCollide().radius((d: any) => d.r + 5).strength(0.8))
            
            // ✅ تم الإبقاء على: قوة التنافر
            .force('charge', d3.forceManyBody().strength((d: any) => -Math.pow(d.r, 1.5) * 0.3))
            
            // ✅ تم الإبقاء على: قوة الحدود من Gift Bubbles
            .force('boundary', createBoundaryForce(width, height, 0.2))
            
            .alphaDecay(0.02)
            .velocityDecay(0.4)
            .alphaTarget(0.1);

        simulation.on('tick', () => {
            d3.select(svgRef.current)
                .selectAll('.bubble')
                .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        return simulation;
    };

    // قوة الحدود من Gift Bubbles - تحل محل قوة الجذب إلى الوسط
    const createBoundaryForce = (width: number, height: number, strength: number = 0.2, padding: number = 20) => {
        let nodes: any[] = [];
        
        const force = () => {
            nodes.forEach((node: any) => {
                const boundary = node.r + padding;
                
                // منع الخروج من الحدود اليسرى
                if (node.x - boundary < 0) {
                    node.vx += (boundary - node.x) * strength;
                } 
                // منع الخروج من الحدود اليمنى
                else if (node.x + boundary > width) {
                    node.vx += (width - boundary - node.x) * strength;
                }
                
                // منع الخروج من الحدود العلوية
                if (node.y - boundary < 0) {
                    node.vy += (boundary - node.y) * strength;
                } 
                // منع الخروج من الحدود السفلية
                else if (node.y + boundary > height) {
                    node.vy += (height - boundary - node.y) * strength;
                }
            });
        };

        force.initialize = (newNodes: any[]) => {
            nodes = newNodes;
        };

        return force;
    };

    // إنشاء التدرجات اللونية المحسنة
    const createGradients = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        const defs = svg.append('defs');

        // تدرج أخضر للقيم الإيجابية
        const greenGradient = defs.append('radialGradient')
            .attr('id', 'bubble-green');
        greenGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
        greenGradient.append('stop').attr('offset', '100%').attr('stop-color', '#009900');

        // تدرج أحمر للقيم السلبية
        const redGradient = defs.append('radialGradient')
            .attr('id', 'bubble-red');
        redGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
        redGradient.append('stop').attr('offset', '100%').attr('stop-color', '#990000');

        // تدرج أزرق للبوت (مثل Gift Bubbles)
        const blueGradient = defs.append('radialGradient')
            .attr('id', 'bubble-blue');
        blueGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
        blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#39719f');
    };

    // إعداد سلوك السحب
    const setupDragBehavior = (bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, simulation: d3.Simulation<any, undefined>) => {
        const drag = d3.drag<SVGGElement, any>()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        bubbleGroup.call(drag);
    };

    // رسم الفقاعات مع التصميم المحسن
    const drawBubbles = (bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number) => {
        // الدوائر الرئيسية
        bubbleGroup.append('circle')
            .attr('r', (d: any) => d.r)
            .attr('fill', (d: any) => {
                if (d.isBot) return 'url(#bubble-blue)';
                return (d.value >= 0) ? 'url(#bubble-green)' : 'url(#bubble-red)';
            })
            .attr('stroke', (d: any) => d.isBot ? '#4f90c6' : (d.value >= 0 ? '#3cb371' : '#dc143c'))
            .attr('stroke-width', (d: any) => Math.max(1, d.r * 0.05));

        // حدود التمرير (مثل Gift Bubbles)
        bubbleGroup.append('circle')
            .attr('class', 'hover-outline')
            .attr('r', (d: any) => d.r)
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', (d: any) => Math.max(1, d.r * 0.05))
            .style('opacity', 0);

        // الصور (للعناصر غير البوت)
        bubbleGroup.filter((d: any) => !d.isBot && d.image)
            .append('image')
            .attr('href', (d: any) => d.image)
            .attr('x', (d: any) => -d.r * 0.6)
            .attr('y', (d: any) => -d.r * 0.6)
            .attr('width', (d: any) => d.r * 1.2)
            .attr('height', (d: any) => d.r * 1.2)
            .attr('clip-path', (d: any) => `url(#clip-${d.id})`);

        // إنشاء أقنعة القص للصور
        const defs = svg.select('defs');
        bubbleGroup.filter((d: any) => !d.isBot && d.image)
            .each(function(d: any) {
                defs.append('clipPath')
                    .attr('id', `clip-${d.id}`)
                    .append('circle')
                    .attr('r', d.r * 0.6);
            });

        // النصوص
        bubbleGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#ffffff')
            .style('font-size', (d: any) => `${d.r * 0.2}px`)
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text((d: any) => d.isBot ? d.symbol : d.symbol.toUpperCase());

        // النسبة المئوية للقيمة
        bubbleGroup.filter((d: any) => !d.isBot)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('dy', (d: any) => d.r * 0.4)
            .attr('fill', (d: any) => d.value >= 0 ? '#4ade80' : '#f87171')
            .style('font-size', (d: any) => `${d.r * 0.15}px`)
            .style('pointer-events', 'none')
            .text((d: any) => {
                const sign = d.value >= 0 ? '+' : '';
                return d.value ? `${sign}${d.value.toFixed(1)}%` : '0.0%';
            });

        // معالجة النقر
        bubbleGroup.on('click', (event, d: any) => {
            onBubbleClick(d);
            
            // تأثير النقر (مثل Gift Bubbles)
            d3.select(event.currentTarget)
                .select('circle')
                .transition()
                .duration(200)
                .attr('r', d.r * 1.1)
                .transition()
                .duration(200)
                .attr('r', d.r);
        });
    };

    // إعداد التلميحات (مثل Gift Bubbles)
    const setupTooltips = (
        bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, 
        tooltipRef: React.RefObject<HTMLDivElement>,
        timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
    ) => {
        bubbleGroup.on('mouseover', function(event, d: any) {
            if (d.isBot) return;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (tooltipRef.current) {
                    const tooltip = d3.select(tooltipRef.current);
                    const sign = d.value >= 0 ? '+' : '';
                    
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        Symbol: ${d.symbol}<br/>
                        Price: $${d.current_price?.toFixed(2) || '0.00'}<br/>
                        Change: ${sign}${d.value?.toFixed(2)}%<br/>
                        Market Cap: $${(d.market_cap / 1e6).toFixed(1)}M
                    `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                }

                // تأثير التمرير
                d3.select(this)
                    .select('.hover-outline')
                    .transition()
                    .duration(150)
                    .style('opacity', 1);
            }, 300);
        })
        .on('mousemove', function(event) {
            if (tooltipRef.current) {
                const tooltip = d3.select(tooltipRef.current);
                tooltip.style('left', `${event.pageX + 10}px`)
                      .style('top', `${event.pageY + 10}px`);
            }
        })
        .on('mouseout', function() {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (tooltipRef.current) {
                d3.select(tooltipRef.current)
                    .transition()
                    .duration(100)
                    .style('opacity', 0);
            }

            d3.select(this)
                .select('.hover-outline')
                .transition()
                .duration(200)
                .style('opacity', 0);
        });
    };

    // حالة التحميل المحسنة
    if (loading) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
                    <div className="text-cyan-200 text-lg font-semibold">Loading Gift Graphs...</div>
                    <div className="text-gray-400 text-sm">Preparing bubble visualization</div>
                </div>
            </div>
        );
    }

    if (!cryptoData.length) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="text-cyan-200 text-xl font-semibold mb-2">No Data Available</div>
                    <div className="text-gray-400">Select cryptocurrencies to visualize</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <svg 
                ref={svgRef} 
                className="w-full h-full"
                width="100%" 
                height="100%"
            />
            
            {/* تلميخ خارج SVG (مثل Gift Bubbles) */}
            <div 
                ref={tooltipRef}
                className="absolute pointer-events-none bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-500/30 shadow-2xl opacity-0 transition-opacity z-50 max-w-xs"
                style={{ 
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.4'
                }}
            />
        </div>
    );
};

export default BubbleCanvas;
