import { Fund } from '../types.ts';

export const INITIAL_FUNDS: Fund[] = [
  {
    isin: 'IE00B4L5Y983',
    name: 'iShares Core MSCI World UCITS ETF',
    manager: 'BlackRock',
    category: 'Renta Variable Global',
    buyDate: '2023-01-15',
    investedAmount: 15000,
    currency: 'EUR',
    shares: 185.5,
    fees: 15,
    currentNAV: 98.45,
    lastUpdated: '2026-01-14'
  },
  {
    isin: 'LU0996179007',
    name: 'Amundi Index MSCI Emerging Markets',
    manager: 'Amundi',
    category: 'Renta Variable Emergente',
    buyDate: '2023-03-10',
    investedAmount: 5000,
    currency: 'EUR',
    shares: 45.2,
    fees: 5,
    currentNAV: 128.20,
    lastUpdated: '2026-01-14'
  },
  {
    isin: 'IE00B3XXRP09',
    name: 'Vanguard S&P 500 UCITS ETF',
    manager: 'Vanguard',
    category: 'Renta Variable USA',
    buyDate: '2023-06-22',
    investedAmount: 10000,
    currency: 'EUR',
    shares: 115.8,
    fees: 10,
    currentNAV: 105.30,
    lastUpdated: '2026-01-13'
  },
  {
    isin: 'LU0360863863',
    name: 'Morgan Stanley Global Brands',
    manager: 'Morgan Stanley',
    category: 'Renta Variable Global Quality',
    buyDate: '2022-11-05',
    investedAmount: 8000,
    currency: 'EUR',
    shares: 38.5,
    fees: 12,
    currentNAV: 235.10,
    lastUpdated: '2026-01-14'
  }
];

export const MOCK_HISTORY = [
  { date: '2025-09', value: 39500 },
  { date: '2025-10', value: 40200 },
  { date: '2025-11', value: 41800 },
  { date: '2025-12', value: 42500 },
  { date: '2026-01', value: 43900 },
];