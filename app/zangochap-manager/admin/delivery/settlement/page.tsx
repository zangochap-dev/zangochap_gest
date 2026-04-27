import React from 'react';
import SettlementClient from './SettlementClient';
import { getPendingSettlements, getSettlementHistory } from '@/modules/orders/actions';
import Topbar from '@/components/Topbar';

export const metadata = {
  title: 'Règlement Livreurs - Zangochap Manager',
};

export default async function SettlementPage() {
  const [pendingOrders, settlementHistory] = await Promise.all([
    getPendingSettlements(),
    getSettlementHistory(),
  ]);

  return (
    <>
      <Topbar title="Règlement" subtitle="livreurs" />
      <SettlementClient pendingOrders={pendingOrders} history={settlementHistory} />
    </>
  );
}
