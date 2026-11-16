import { getSupabaseClient } from '@/lib/supabase'

type RealtimeCallback = (payload: any) => void

interface RealtimeSubscription {
  channel: string
  unsubscribe: () => void
}

const subscriptions: Map<string, RealtimeSubscription> = new Map()

function getClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase is not configured')
  return client
}

export function subscribeToShipmentChanges(
  officeId: string | undefined,
  callback: RealtimeCallback
): () => void {
  const client = getClient()
  const channelName = `office_${officeId || 'global'}_shipments`

  if (subscriptions.has(channelName)) {
    const existing = subscriptions.get(channelName)!
    existing.unsubscribe()
    subscriptions.delete(channelName)
  }

  let channel = client.channel(channelName)

  channel = channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
        filter: officeId ? `office_id=eq.${officeId}` : undefined,
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'shipments',
        filter: officeId ? `office_id=eq.${officeId}` : undefined,
      },
      (payload) => callback(payload)
    )

  channel.subscribe()

  const unsubscribe = () => {
    client.removeChannel(channel)
    subscriptions.delete(channelName)
  }

  subscriptions.set(channelName, { channel: channelName, unsubscribe })
  return unsubscribe
}

export function subscribeToNotifications(
  callback: RealtimeCallback
): () => void {
  const client = getClient()
  const channelName = 'notifications_global'

  if (subscriptions.has(channelName)) {
    const existing = subscriptions.get(channelName)!
    existing.unsubscribe()
    subscriptions.delete(channelName)
  }

  let channel = client.channel(channelName)

  channel = channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => callback(payload)
    )

  channel.subscribe()

  const unsubscribe = () => {
    client.removeChannel(channel)
    subscriptions.delete(channelName)
  }

  subscriptions.set(channelName, { channel: channelName, unsubscribe })
  return unsubscribe
}

export function subscribeToWarehouseOperations(
  warehouseId: string | undefined,
  callback: RealtimeCallback
): () => void {
  const client = getClient()
  const channelName = `warehouse_${warehouseId || 'global'}_operations`

  if (subscriptions.has(channelName)) {
    const existing = subscriptions.get(channelName)!
    existing.unsubscribe()
    subscriptions.delete(channelName)
  }

  let channel = client.channel(channelName)

  channel = channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'warehouse_operations',
        filter: warehouseId ? `warehouse_id=eq.${warehouseId}` : undefined,
      },
      (payload) => callback(payload)
    )

  channel.subscribe()

  const unsubscribe = () => {
    client.removeChannel(channel)
    subscriptions.delete(channelName)
  }

  subscriptions.set(channelName, { channel: channelName, unsubscribe })
  return unsubscribe
}

export function subscribeToTransfers(
  officeId: string | undefined,
  callback: RealtimeCallback
): () => void {
  const client = getClient()
  const channelName = `office_${officeId || 'global'}_transfers`

  if (subscriptions.has(channelName)) {
    const existing = subscriptions.get(channelName)!
    existing.unsubscribe()
    subscriptions.delete(channelName)
  }

  let channel = client.channel(channelName)

  channel = channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'shipment_transfers',
        filter: officeId ? `office_id=eq.${officeId}` : undefined,
      },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipment_transfers',
        filter: officeId ? `office_id=eq.${officeId}` : undefined,
      },
      (payload) => callback(payload)
    )

  channel.subscribe()

  const unsubscribe = () => {
    client.removeChannel(channel)
    subscriptions.delete(channelName)
  }

  subscriptions.set(channelName, { channel: channelName, unsubscribe })
  return unsubscribe
}

export function unsubscribeAll() {
  for (const [, sub] of subscriptions) {
    sub.unsubscribe()
  }
  subscriptions.clear()
}
