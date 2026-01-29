export interface HistoryPoint {
  date: string;
  nav: number;
  value: number;
  ytdPercent: number;
}

export interface Fund {
  isin: string;
  name: string;
  manager: string;
  category: string;
  buyDate: string;
  investedAmount: number;
  currency: string;
  shares: number;
  fees: number;
  currentNAV: number;
  lastUpdated: string;
  history?: HistoryPoint[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PORTFOLIO = 'PORTFOLIO',
  ANALYSIS = 'ANALYSIS',
  SETTINGS = 'SETTINGS'
}

export interface AppData {
  version: number;
  lastModified: string;
  portfolioName: string;
  funds: Fund[];
}