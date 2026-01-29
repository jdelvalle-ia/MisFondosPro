import { Fund, HistoryPoint } from '../types.ts';

export const processHistoryData = (rawData: {date: string, nav: number}[], fund: Fund): HistoryPoint[] => {
    if (!rawData || rawData.length === 0) return [];
    const sortedData = [...rawData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startYearPrices: Record<number, number> = {};
    sortedData.forEach(point => {
        const year = new Date(point.date).getFullYear();
        if (!startYearPrices[year]) startYearPrices[year] = point.nav;
    });
    return sortedData.map(point => {
        const year = new Date(point.date).getFullYear();
        const startPrice = startYearPrices[year];
        const safeNav = typeof point.nav === 'number' && !isNaN(point.nav) ? point.nav : 0;
        return {
            date: point.date,
            nav: safeNav,
            value: safeNav * (fund.shares ?? 0),
            ytdPercent: startPrice > 0 ? ((point.nav - startPrice) / startPrice) * 100 : 0
        };
    });
};