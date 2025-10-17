export { fetchDummyPrices } from "./adapters/dummy";
export { fetchA101Prices } from "./adapters/market-a101";
export { fetchBIMPrices } from "./adapters/market-bim";
export { fetchMigrosPrices } from "./adapters/market-migros";
export { fetchSOKPrices } from "./adapters/market-sok";
export { calculateAveragePrices } from "./core/aggregator";
export type { MarketPrice, AveragePrice } from "./core/types";
