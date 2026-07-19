/**
 * Real-time Data Simulation Service
 * Generates dynamic, realistic data that updates continuously
 * to create a premium live dashboard experience
 */

class RealTimeSimulation {
  constructor() {
    this.subscribers = new Set();
    this.intervalId = null;
    this.updateInterval = 2000; // Update every 2 seconds
    
    // Base values for realistic simulation
    this.baseStats = {
      stabilityIndex: 84.2,
      riskVector: 12.5,
      projectedCapital: 1.4,
      pathAlpha: 26,
    };
    
    // Historical data for sparklines
    this.history = {
      stability: this.generateHistory(20, 75, 92),
      risk: this.generateHistory(20, 8, 18),
      capital: this.generateHistory(20, 1.2, 1.6),
    };
    
    // Market correlations with descriptions
    this.markets = [
      { id: 'm1', label: 'S&P 500 Index', baseValue: 1.24, volatility: 0.8, description: 'Broad market performance indicator' },
      { id: 'm2', label: 'Interest Rate (Sim)', baseValue: -5.25, volatility: 1.2, description: 'Federal funds rate projection' },
      { id: 'm3', label: 'NASDAQ Composite', baseValue: 0.87, volatility: 1.5, description: 'Tech sector volatility index' },
      { id: 'm4', label: 'VIX Index', baseValue: 2.34, volatility: 2.0, description: 'Market fear/greed metric' },
    ];
  }

  generateHistory(length, min, max) {
    return Array.from({ length }, () => min + Math.random() * (max - min));
  }

  // Generate realistic fluctuation based on previous value
  fluctuate(value, volatility, min, max) {
    const change = (Math.random() - 0.5) * volatility;
    const newValue = value + change;
    return Math.max(min, Math.min(max, newValue));
  }

  // Generate dynamic stats
  getStats() {
    // Update base values with realistic fluctuations
    this.baseStats.stabilityIndex = this.fluctuate(this.baseStats.stabilityIndex, 1.5, 70, 95);
    this.baseStats.riskVector = this.fluctuate(this.baseStats.riskVector, 0.8, 5, 25);
    this.baseStats.projectedCapital = this.fluctuate(this.baseStats.projectedCapital, 0.02, 1.0, 2.0);
    this.baseStats.pathAlpha = this.fluctuate(this.baseStats.pathAlpha, 2, 10, 45);

    // Update history
    this.history.stability.shift();
    this.history.stability.push(this.baseStats.stabilityIndex);
    this.history.risk.shift();
    this.history.risk.push(this.baseStats.riskVector);
    this.history.capital.shift();
    this.history.capital.push(this.baseStats.projectedCapital);

    // Calculate trends
    const stabilityTrend = this.baseStats.stabilityIndex > this.history.stability[this.history.stability.length - 2] ? 'up' : 'down';
    const riskTrend = this.baseStats.riskVector < this.history.risk[this.history.risk.length - 2] ? 'down' : 'up';

    return {
      stabilityIndex: {
        value: Math.round(this.baseStats.stabilityIndex * 10) / 10,
        unit: '%',
        trend: stabilityTrend,
        history: [...this.history.stability],
      },
      riskVector: {
        value: Math.round(this.baseStats.riskVector * 10) / 10,
        unit: 'pts',
        label: this.baseStats.riskVector < 15 ? 'Low' : this.baseStats.riskVector < 22 ? 'Medium' : 'High',
        trend: riskTrend,
        history: [...this.history.risk],
      },
      projectedCapital: {
        value: Math.round(this.baseStats.projectedCapital * 100) / 100,
        unit: 'M',
        prefix: '$',
        history: [...this.history.capital],
      },
      pathAlpha: {
        value: Math.round(this.baseStats.pathAlpha),
        label:this.baseStats.pathAlpha > 35 ? 'A+' : this.baseStats.pathAlpha > 25 ? 'A/B' : 'B+',
        trend: this.baseStats.pathAlpha > 25 ? 'up' : 'stable',
      },
    };
  }

  // Generate dynamic market correlations
  getMarketCorrelations() {
    return this.markets.map(market => {
      const change = this.fluctuate(market.baseValue, market.volatility * 0.3, -10, 10);
      market.baseValue = change;
      return {
        id: market.id,
        label: market.label,
        changePercent: Math.round(change * 100) / 100,
        direction: change >= 0 ? 'up' : 'down',
        description: market.description,
      };
    });
  }

  // Generate dynamic advisor insights
  getAdvisorInsight() {
    const insights = [
      'Based on current market volatility, I recommend a cautious approach to new positions this quarter.',
      'Your Series C simulation shows strong momentum. Consider accelerating the timeline by 2 weeks.',
      'Risk indicators are trending favorably. This may be an optimal window for strategic expansion.',
      'Market correlation analysis suggests decoupling from tech sector volatility in the short term.',
      'Your path alpha metrics have improved 12% since last recalculation. Maintain current strategy.',
    ];
    
    const messages = [
      'Analyzing real-time market data streams...',
      'Running Monte Carlo simulations on current portfolio...',
      'Correlation matrix updated with latest market data...',
      'Risk assessment complete. All indicators within optimal range.',
      'Decision engine processing new scenario parameters...',
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return {
      status: 'Live Analysis Active',
      message: randomInsight,
      lastUpdate: new Date().toISOString(),
      checklist: [
        { id: 'c1', label: 'Review real-time risk assessment', done: Math.random() > 0.5 },
        { id: 'c2', label: 'Validate market correlation data', done: Math.random() > 0.6 },
        { id: 'c3', label: 'Confirm simulation parameters', done: Math.random() > 0.7 },
      ],
    };
  }

  // Generate system meta with live uptime
  getSystemMeta() {
    const uptime = 99.95 + Math.random() * 0.04;
    const lastRecalc = Math.floor(Math.random() * 120) + 1;
    
    return {
      simulationUptime: Math.round(uptime * 100) / 100,
      lastRecalc: `${lastRecalc}s ago`,
      activeConnections: Math.floor(Math.random() * 50) + 10,
      dataPointsProcessed: Math.floor(Math.random() * 10000) + 5000,
    };
  }

  // Start real-time updates
  start() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      const data = {
        stats: this.getStats(),
        correlations: this.getMarketCorrelations(),
        advisor: this.getAdvisorInsight(),
        meta: this.getSystemMeta(),
      };
      
      this.subscribers.forEach(callback => callback(data));
    }, this.updateInterval);
  }

  // Stop real-time updates
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Subscribe to updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Get current data immediately
  getCurrentData() {
    return {
      stats: this.getStats(),
      correlations: this.getMarketCorrelations(),
      advisor: this.getAdvisorInsight(),
      meta: this.getSystemMeta(),
    };
  }
}

// Export singleton instance
export const realTimeSimulation = new RealTimeSimulation();
