import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

// تعريف واجهة الهدية للتأكد من التوافق
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
  sortMethod = 'random', 
  onBubbleClick 
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const botBubbleDataRef = useRef<any>(null);

    // Effect to handle dimensions using window.addEventListener and setTimeout for initial load
    useEffect(() => {
        let timeoutId: NodeJS.Timeout; // To store setTimeout ID for cleanup

        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                    // Clear any pending setTimeout if valid dimensions are found
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                } else {
                    // If dimensions are 0, retry after a short delay as a fallback
                    timeoutId = setTimeout(handleResize, 100);
                }
            } else {
                // If containerRef.current is not available yet, retry
                timeoutId = setTimeout(handleResize, 100);
            }
        };

        // Call handleResize immediately on component mount to get initial dimensions
        handleResize();

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);
        
        // Cleanup function: remove event listener and clear any pending timeouts
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []); // Empty dependency array means this runs only once on mount

    // Effect for the D3.js simulation, dependent on data and dimensions
    useEffect(() => {
        const { width, height } = dimensions;

        // Do not proceed with D3 simulation if data is not loaded or dimensions are invalid (0x0)
        if (!Array.isArray(cryptoData) || cryptoData.length === 0 || loading || width === 0 || height === 0 || !svgRef.current) {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
            return;
        }

        // Stop the old simulation if it exists before creating a new one
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous SVG elements

        // Filter data based on selectedCryptos
        const filteredCryptoData = cryptoData.filter(d => selectedCryptos.includes(d.id));

        let sortedData = [...filteredCryptoData];
        // Note: Sorting logic remains here as it affects bubble data preparation
        // If sortMethod is 'marketCap', sort by market_cap_desc
        // Otherwise, maintain original order (or random if data naturally is)
        if (sortMethod === 'marketCap') {
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        }

        // Prevent TypeError if sortedData becomes empty after filtering
        if (sortedData.length === 0) {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
            botBubbleDataRef.current = null; // Clear bot data if no crypto data is present
            return; // Exit early if no data to render
        }

        const maxMarketCap = d3.max(sortedData, d => d.market_cap) || 1;

        // Ensure maxMarketCap is not zero or negative for a valid scale domain
        const sizeScale = d3.scaleSqrt()
            .domain([0, maxMarketCap > 0 ? maxMarketCap : 1]) // Prevent domain from being [0,0] if maxMarketCap is 0
            .range([10, Math.min(width, height) / 8]);

        let nodes = sortedData.map(d => ({ ...d, r: sizeScale(d.market_cap) }));

        // --- Bot Bubble Logic ---
        // Calculate bot bubble radius based on the largest crypto bubble
        const largestCryptoBubbleRadius = maxMarketCap > 0 ? sizeScale(maxMarketCap) : 0;
        const botRadius = largestCryptoBubbleRadius * 0.8; // 20% smaller

        // Only create/update bot bubble data if dimensions and largest crypto bubble are valid
        // And if the bot bubble hasn't been created yet, or if its size needs updating (due to resize/data change)
        // Using a small tolerance (0.1) to avoid re-creating on tiny floating point differences
        if (botRadius > 0 && (!botBubbleDataRef.current || Math.abs(botBubbleDataRef.current.r - botRadius) > 0.1)) {
            botBubbleDataRef.current = {
                id: 'gift_graphs_bot',
                name: 'Gift Graphs Bot',
                symbol: '@Gift_Graphs_bot', // User requested text here
                image: '', // No image for the bot bubble
                isBot: true,
                r: botRadius,
                // Dummy values for other properties to match cryptoData structure
                market_cap: 0, 
                current_price: 0,
                price_change_percentage_24h: 0,
                model_name: 'Bot',
                min_price_ton: 0,
                min_price_usd: 0,
            };
        }

        // Add the bot bubble to the nodes array if it exists
        if (botBubbleDataRef.current) {
            nodes.push(botBubbleDataRef.current);
        }

        // --- D3 Force Simulation Setup ---
        const simulation = d3.forceSimulation(nodes)
            .force('center', d3.forceCenter(width / 2, height / 2))
            // تعديل: جعل فقاعة البوت تستقر دائمًا في المنتصف بقوة جذب أعلى
            .force('x', d3.forceX(width / 2).strength(d => d.isBot ? 1.0 : 0.15))
            .force('y', d3.forceY(height / 2).strength(d => d.isBot ? 1.0 : 0.15))
            .force('collide', d3.forceCollide().radius(d => d.r + 2).strength(0.7))
            .force('charge', d3.forceManyBody().strength(d => -Math.pow(d.r, 1.5) * 0.2))
            .on('tick', () => {
                bubbleGroup.attr('transform', d => `translate(${d.x},${d.y})`);
            });

        simulationRef.current = simulation;

        // Define radial gradients for styling
        const defs = svg.append("defs");
        
        const greenGradient = defs.append("radialGradient")
            .attr("id", "greenGradient");
        greenGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(0, 0, 0, 0)");
        greenGradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "rgba(22, 101, 52, 0.9)");
        greenGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(52, 211, 153, 0.8)");

        const redGradient = defs.append("radialGradient")
            .attr("id", "redGradient");
        redGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(0, 0, 0, 0)");
        redGradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "rgba(153, 27, 27, 0.9)");
        redGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(239, 68, 68, 0.8)");

        // Add the blue gradient for the bot bubble with new specifications
        const blueGradient = defs.append("radialGradient")
            .attr("id", "blueGradient");
        blueGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(0, 0, 0, 0)"); // Transparent center
        blueGradient.append("stop").attr("offset", "80%").attr("stop-color", "rgba(21, 101, 192, 0.4)"); // Darker blue, semi-transparent
        blueGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 255, 255, 1)"); // Neon blue at the edge

        // Drag behavior for user interaction
        const drag = d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        const bubbleGroup = svg.selectAll('.bubble')
            .data(nodes, d => d.id)
            .join('g')
            .attr('class', 'bubble')
            .call(drag)
            .on('click', (event, d) => { // Click handler to pass data to parent (App.tsx)
                onBubbleClick(d); 
            });

        bubbleGroup.append('circle')
            .attr('r', d => d.r)
            .attr('fill', d => {
                if (d.isBot) {
                    return 'url(#blueGradient)'; // Use the blue gradient for the bot
                }
                // يجب أن تكون price_change_percentage_24h موجودة لكائنات cryptoData
                return d.price_change_percentage_24h && d.price_change_percentage_24h >= 0 ? 'url(#greenGradient)' : 'url(#redGradient)';
            })
            .attr('stroke', 'none');

        bubbleGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#f9fafb')
            // تعديل: تصغير حجم خط نص البوت قليلاً
            .style('font-size', d => d.isBot ? `${d.r / 5}px` : `${d.r / 3}px`) 
            .style('pointer-events', 'none')
            .text(d => d.isBot ? d.symbol : d.symbol.toUpperCase()); // Use d.symbol for bot, d.symbol.toUpperCase() for others

        // Remove the image for the bot bubble, keep it for others
        bubbleGroup.append('image')
            .attr('href', d => d.isBot ? '' : d.image) // Set href to empty string for bot
            .attr('x', d => d.isBot ? 0 : -d.r * 0.4) // Center if no image
            .attr('y', d => d.isBot ? 0 : -d.r * 0.4) // Center if no image
            .attr('width', d => d.isBot ? 0 : d.r * 0.8) // Set width to 0 for bot
            .attr('height', d => d.isBot ? 0 : d.r * 0.8) // Set height to 0 for bot
            .style('pointer-events', 'none');

        // Cleanup function for D3 simulation
        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };

    }, [cryptoData, loading, selectedCryptos, sortMethod, dimensions, onBubbleClick]); // Dependencies for D3 effect

    // حالة التحميل
    if (loading) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-300"></div>
                <span className="sr-only">Loading bubbles...</span>
            </div>
        );
    }

    // إذا لم توجد بيانات
    if (!cryptoData || cryptoData.length === 0) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
                <div className="text-gray-400">No data available</div>
            </div>
        );
    }

    // The BubbleCanvas itself does not render the tooltip data
    // The tooltip data is managed and rendered by the parent App.tsx
    return (
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full" width="100%" height="100%"></svg>
        </div>
    );
};

export default BubbleCanvas;
