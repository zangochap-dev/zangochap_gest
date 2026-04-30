import React from 'react';
import StockHistoryClient from './StockHistoryClient';
import { getStockHistory } from '@/modules/orders/actions';
import { getWarehouses } from '@/modules/logistics/warehouseActions';

export const metadata = {
  title: 'Historique des Stocks - Zangochap Manager',
};

export default async function StockHistoryPage() {
  const [movements, warehouses] = await Promise.all([
    getStockHistory(),
    getWarehouses(),
  ]);

  return (
    <StockHistoryClient 
      movements={JSON.parse(JSON.stringify(movements))} 
      warehouses={JSON.parse(JSON.stringify(warehouses))} 
    />
  );
}
