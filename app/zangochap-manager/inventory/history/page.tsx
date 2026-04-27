import React from 'react';
import StockHistoryClient from './StockHistoryClient';
import { getStockHistory } from '@/modules/orders/actions';

export const metadata = {
  title: 'Historique des Stocks - Zangochap Manager',
};

export default async function StockHistoryPage() {
  const movements = await getStockHistory();

  return <StockHistoryClient movements={movements} />;
}
