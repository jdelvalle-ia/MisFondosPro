import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Portfolio } from './components/Portfolio.tsx';
import { Analysis } from './components/Analysis.tsx';
import { Settings } from './components/Settings.tsx';
import { LogViewer } from './components/LogViewer.tsx';
import { AppView, Fund } from './types.ts';
import { storageService } from './services/storageService.ts';
import { INITIAL_FUNDS } from './services/mockData.ts';
import { logger } from './services/loggerService.ts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [portfolioName, setPortfolioName] = useState(''); // Inicializado vacío
  const [lastSyncDate, setLastSyncDate] = useState<string | undefined>(undefined);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  useEffect(() => {
    const data = storageService.load();
    if (data.funds.length === 0) {
      logger.info("Sistema: Cartera vacía detectada.");
      // No forzamos nombre aquí para que se vea el fallback en el header
      setFunds([]); 
    } else {
      setFunds(data.funds);
      setPortfolioName(data.portfolioName || '');
      setLastSyncDate(data.lastModified);
      logger.success(`Sistema: Cartera "${data.portfolioName || 'Sin Título'}" cargada.`);
    }
  }, []);

  useEffect(() => {
    // Solo guardamos si hay algo que guardar para evitar sobrescribir con vacíos accidentales
    if (funds.length > 0 || portfolioName !== '') {
      storageService.save(funds, portfolioName);
    }
  }, [funds, portfolioName]);

  const handleFundsUpdate = (updatedFunds: Fund[]) => {
    setFunds(updatedFunds);
  };

  const handleSyncComplete = (updatedFunds: Fund[]) => {
    const now = new Date().toISOString();
    setFunds(updatedFunds);
    setLastSyncDate(now);
    storageService.save(updatedFunds, portfolioName);
  };

  const handleAddFund = (fund: Fund) => {
    setFunds(prev => [...prev, fund]);
    logger.success(`Cartera: Añadido ${fund.isin}`);
  };

  const handleEditFund = (updatedFund: Fund) => {
    setFunds(prev => prev.map(f => f.isin === updatedFund.isin ? updatedFund : f));
    logger.info(`Cartera: Editado ${updatedFund.isin}`);
  };

  const handleDeleteFund = (isin: string) => {
    setFunds(prev => prev.filter(f => f.isin !== isin));
    logger.warn(`Cartera: Eliminado ${isin}`);
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD: 
        return <Dashboard funds={funds} />;
      case AppView.PORTFOLIO: 
        return (
          <Portfolio 
            funds={funds} 
            portfolioName={portfolioName}
            onUpdatePortfolioName={setPortfolioName}
            onFundsUpdate={handleFundsUpdate}
            onSyncComplete={handleSyncComplete}
            onAddFund={handleAddFund}
            onEditFund={handleEditFund}
            onDeleteFund={handleDeleteFund}
          />
        );
      case AppView.ANALYSIS: 
        return <Analysis funds={funds} />;
      case AppView.SETTINGS: 
        return (
          <Settings 
            currentFunds={funds} 
            currentPortfolioName={portfolioName}
            lastSyncDate={lastSyncDate}
            onImportData={(data) => { 
              setFunds(data.funds); 
              setPortfolioName(data.portfolioName); 
              setLastSyncDate(data.lastSyncDate);
            }} 
            onFundsUpdate={handleFundsUpdate}
            onSyncComplete={handleSyncComplete}
          />
        );
      default: 
        return <Dashboard funds={funds} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      onNavigate={setActiveView} 
      portfolioName={portfolioName}
      onOpenTerminal={() => setIsLogsOpen(true)}
    >
      <div className="min-h-full">
        {renderView()}
      </div>
      <LogViewer isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
    </Layout>
  );
};

export default App;