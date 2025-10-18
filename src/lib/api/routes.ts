/**
 * Merkezi API Routes Configuration
 * Tüm API endpoint'lerini tek yerden yönetir
 */

export const API_ROUTES = {
  // Menu Analysis
  menuAnalyze: "/api/menu/analyze-clean",
  menuAnalyzeV2: "/api/menu/analyze-v2", 
  menuAnalyzeAdvanced: "/api/menu/analyze",
  
  // Market Data
  marketPrices: "/api/market/prices",
  marketRefresh: "/api/market/refresh",
  
  // Health & Monitoring
  health: "/api/health",
  healthClean: "/api/health-clean",
  metrics: "/api/metrics",
  
  // Offer Calculation
  offerCalc: "/api/offer/calc",
  offerCalcClean: "/api/offer/calc-clean",
  
  // AI Services
  claude: "/api/claude",
  reasoning: "/api/reasoning",
  
  // Pipeline
  pipelineIntelligent: "/api/pipeline/intelligent",
  pipelineAutoRefresh: "/api/pipeline/auto-refresh"
} as const

// API Method Configuration
export const API_METHODS = {
  [API_ROUTES.menuAnalyze]: "POST",
  [API_ROUTES.menuAnalyzeV2]: "POST", 
  [API_ROUTES.menuAnalyzeAdvanced]: "POST",
  [API_ROUTES.marketPrices]: "GET",
  [API_ROUTES.marketRefresh]: "POST",
  [API_ROUTES.health]: "GET",
  [API_ROUTES.healthClean]: "GET",
  [API_ROUTES.metrics]: "GET",
  [API_ROUTES.offerCalc]: "POST",
  [API_ROUTES.offerCalcClean]: "POST",
  [API_ROUTES.claude]: "POST",
  [API_ROUTES.reasoning]: "POST",
  [API_ROUTES.pipelineIntelligent]: "POST",
  [API_ROUTES.pipelineAutoRefresh]: "POST"
} as const

// Authentication Requirements
export const API_AUTH_REQUIRED = {
  [API_ROUTES.menuAnalyze]: false,        // Public endpoint
  [API_ROUTES.menuAnalyzeV2]: true,       // Requires auth
  [API_ROUTES.menuAnalyzeAdvanced]: true, // Requires auth
  [API_ROUTES.marketPrices]: false,       // Public endpoint
  [API_ROUTES.marketRefresh]: true,       // Requires auth
  [API_ROUTES.health]: false,             // Public endpoint
  [API_ROUTES.healthClean]: false,        // Public endpoint
  [API_ROUTES.metrics]: true,             // Requires auth
  [API_ROUTES.offerCalc]: false,          // Public endpoint
  [API_ROUTES.offerCalcClean]: false,     // Public endpoint
  [API_ROUTES.claude]: true,              // Requires auth
  [API_ROUTES.reasoning]: true,           // Requires auth
  [API_ROUTES.pipelineIntelligent]: true, // Requires auth
  [API_ROUTES.pipelineAutoRefresh]: true  // Requires auth
} as const

// Helper Functions
export function getApiUrl(route: keyof typeof API_ROUTES, baseUrl = 'http://localhost:3000'): string {
  return `${baseUrl}${API_ROUTES[route]}`
}

export function getApiMethod(route: keyof typeof API_ROUTES): string {
  return API_METHODS[API_ROUTES[route]] || 'GET'
}

export function requiresAuth(route: keyof typeof API_ROUTES): boolean {
  return API_AUTH_REQUIRED[API_ROUTES[route]] || false
}

// Test-friendly endpoint selection
export function getTestEndpoints() {
  return Object.keys(API_ROUTES)
    .filter(key => !requiresAuth(key as keyof typeof API_ROUTES))
    .reduce((acc, key) => {
      acc[key] = API_ROUTES[key as keyof typeof API_ROUTES]
      return acc
    }, {} as Record<string, string>)
}

export default API_ROUTES
