export const demoDashboardData = {
  admin: {
    users: 42,
    offices: 7,
    finance: { revenue: 24860, operatingCosts: 8430, netBalance: 16430 },
    performance: { onTimeRate: 94, shipmentGrowth: 12, activeOffices: 6 },
  },
  officeManager: {
    shipments: 86,
    incoming: 12,
    outgoing: 22,
    pending: 18,
    delivered: 34,
    employees: 8,
    storekeeper: { receivedToday: 12, dispatchedToday: 9, awaitingApproval: 3 },
    delayed: 3,
    problematic: 2,
    performance: { onTimeRate: 91, dailyTarget: 78, completionRate: 84 },
  },
  storekeeper: {
    incoming: 12,
    outgoing: 9,
    stored: 24,
    pending: 5,
    damaged: 1,
    missing: 0,
  },
} as const
