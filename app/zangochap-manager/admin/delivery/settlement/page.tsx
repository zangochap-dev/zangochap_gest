import React from 'react';
import SettlementClient from './SettlementClient';
import { getPendingSettlements, getSettlementHistory, getRiderSettlementStats } from '@/modules/orders/actions';
import Topbar from '@/components/Topbar';

export const metadata = {
  title: 'Règlement Livreurs - Zangochap Manager',
};

export default async function SettlementPage({ searchParams }: { searchParams: any }) {
  const { from, to, riderId } = await searchParams || {};

  const [pendingOrders, settlementHistory, riderStats] = await Promise.all([
    getPendingSettlements(),
    getSettlementHistory(),
    getRiderSettlementStats(from, to, riderId)
  ]);

  return (
    <>
      <Topbar title="Règlement" subtitle="livreurs" />
      <SettlementClient 
        pendingOrders={pendingOrders} 
        history={settlementHistory} 
        riderStats={riderStats}
        initialFrom={from}
        initialTo={to}
        initialRiderId={riderId}
      />
    </>
  );
}
