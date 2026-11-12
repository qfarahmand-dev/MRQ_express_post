import type { PackageType, PartyInfo, Shipment, ShipmentStatus } from '@/types/shipment'

type Step = [status: ShipmentStatus, isoDateTime: string, location: string, note?: string]

interface Seed {
  id: string
  trackingNumber: string
  destinationCountry: string
  sender: PartyInfo
  receiver: PartyInfo
  packageType: PackageType
  description: string
  steps: Step[]
}

function build(seed: Seed): Shipment {
  const events = seed.steps.map(([status, createdAt, location, note], index) => ({
    id: `${seed.id}_evt_${index + 1}`,
    status,
    createdAt,
    location,
    note,
    createdBy: 'usr_admin_01',
  }))
  const first = events[0]
  const last = events[events.length - 1]
  return {
    id: seed.id,
    trackingNumber: seed.trackingNumber,
    destinationCountry: seed.destinationCountry,
    sender: seed.sender,
    receiver: seed.receiver,
    packageType: seed.packageType,
    description: seed.description,
    registrationDate: first.createdAt.slice(0, 10),
    status: last.status,
    createdAt: first.createdAt,
    updatedAt: last.createdAt,
    events,
  }
}

const seeds: Seed[] = [
  {
    id: 'shp_001',
    trackingNumber: 'MRQ240001845',
    destinationCountry: 'DE',
    sender: { name: 'Ahmad Karimi', phone: '+93 70 123 4567', address: 'Shahr-e Naw, Street 4, Kabul, Afghanistan' },
    receiver: { name: 'Laila Noori', phone: '+49 151 2345 6789', address: 'Kaiserstraße 21, 60311 Frankfurt, Germany' },
    packageType: 'goods',
    description: 'Handmade carpets (2 pcs), 18 kg',
    steps: [
      ['registered', '2026-11-02T08:15:00.000Z', 'Kabul Office'],
      ['in_warehouse', '2026-11-02T14:40:00.000Z', 'Kabul Hub'],
      ['dispatched', '2026-11-04T06:20:00.000Z', 'Kabul International Airport'],
      ['in_transit', '2026-11-05T11:05:00.000Z', 'Dubai Transit Hub', 'Connecting flight to Frankfurt'],
      ['out_for_delivery', '2026-11-10T07:30:00.000Z', 'Frankfurt Depot'],
      ['delivered', '2026-11-10T15:10:00.000Z', 'Frankfurt', 'Signed by receiver'],
    ],
  },
  {
    id: 'shp_002',
    trackingNumber: 'MRQ240001846',
    destinationCountry: 'GB',
    sender: { name: 'Fatima Hosseini', phone: '+98 912 345 6789', address: 'Valiasr St. 1203, Tehran, Iran' },
    receiver: { name: 'Omid Rezaei', phone: '+44 7700 900123', address: '14 Baker Street, London W1U 3BW, United Kingdom' },
    packageType: 'documents',
    description: 'University transcripts and certified translations',
    steps: [
      ['registered', '2026-11-06T09:00:00.000Z', 'Tehran Office'],
      ['in_warehouse', '2026-11-06T16:25:00.000Z', 'Tehran Hub'],
      ['dispatched', '2026-11-08T05:45:00.000Z', 'Imam Khomeini Airport'],
      ['in_transit', '2026-11-09T10:15:00.000Z', 'Istanbul Transit Hub'],
    ],
  },
  {
    id: 'shp_003',
    trackingNumber: 'MRQ240001847',
    destinationCountry: 'AF',
    sender: { name: 'Javad Mohammadi', phone: '+971 50 123 4567', address: 'Al Quoz Industrial Area 3, Dubai, UAE' },
    receiver: { name: 'Nasrin Sadeghi', phone: '+93 79 876 5432', address: 'Karte Se, Street 7, Kabul, Afghanistan' },
    packageType: 'goods',
    description: 'Electronics: 1 laptop, 2 phones (boxed)',
    steps: [
      ['registered', '2026-11-03T10:30:00.000Z', 'Dubai Office'],
      ['in_warehouse', '2026-11-03T18:00:00.000Z', 'Dubai Hub'],
      ['delayed', '2026-11-07T09:20:00.000Z', 'Dubai Hub', 'Awaiting customs clearance documents'],
    ],
  },
  {
    id: 'shp_004',
    trackingNumber: 'MRQ240001848',
    destinationCountry: 'IR',
    sender: { name: 'Zahra Akbari', phone: '+90 532 123 4567', address: 'İstiklal Cd. 45, Beyoğlu, Istanbul, Türkiye' },
    receiver: { name: 'Hamid Safavi', phone: '+98 935 222 1100', address: 'Imam Reza Blvd. 88, Mashhad, Iran' },
    packageType: 'goods',
    description: 'Clothing and textiles, 9 kg',
    steps: [['registered', '2026-11-10T13:10:00.000Z', 'Istanbul Office']],
  },
  {
    id: 'shp_005',
    trackingNumber: 'MRQ240001849',
    destinationCountry: 'AF',
    sender: { name: 'Reza Ebrahimi', phone: '+49 160 555 0199', address: 'Torstraße 110, 10119 Berlin, Germany' },
    receiver: { name: 'Mina Jafari', phone: '+93 77 444 3322', address: 'Mazar Road, Herat, Afghanistan' },
    packageType: 'documents',
    description: 'Legal documents in sealed envelope',
    steps: [
      ['registered', '2026-11-04T07:50:00.000Z', 'Berlin Office'],
      ['in_warehouse', '2026-11-04T12:30:00.000Z', 'Berlin Hub'],
      ['dispatched', '2026-11-06T04:10:00.000Z', 'Berlin Brandenburg Airport'],
      ['in_transit', '2026-11-07T19:45:00.000Z', 'Dubai Transit Hub'],
      ['out_for_delivery', '2026-11-11T06:30:00.000Z', 'Herat Depot'],
    ],
  },
  {
    id: 'shp_006',
    trackingNumber: 'MRQ240001850',
    destinationCountry: 'IR',
    sender: { name: 'Parisa Nazari', phone: '+44 7911 123456', address: '22 Deansgate, Manchester M3 4LY, United Kingdom' },
    receiver: { name: 'Ali Moradi', phone: '+98 913 765 4321', address: 'Chaharbagh Ave. 15, Isfahan, Iran' },
    packageType: 'goods',
    description: 'Medical supplies (non-hazardous), 4 kg',
    steps: [
      ['registered', '2026-10-28T09:40:00.000Z', 'Manchester Office'],
      ['in_warehouse', '2026-10-28T15:00:00.000Z', 'London Hub'],
      ['dispatched', '2026-10-30T08:00:00.000Z', 'Heathrow Airport'],
      ['in_transit', '2026-10-31T13:20:00.000Z', 'Istanbul Transit Hub'],
      ['out_for_delivery', '2026-11-03T07:15:00.000Z', 'Isfahan Depot'],
      ['delivered', '2026-11-03T12:40:00.000Z', 'Isfahan', 'Delivered to receiver'],
    ],
  },
  {
    id: 'shp_007',
    trackingNumber: 'MRQ240001851',
    destinationCountry: 'TR',
    sender: { name: 'Hossein Amini', phone: '+93 78 111 2233', address: 'Jalalabad Road, Kabul, Afghanistan' },
    receiver: { name: 'Shirin Azizi', phone: '+90 541 998 7766', address: 'Atatürk Blvd. 120, Ankara, Türkiye' },
    packageType: 'goods',
    description: 'Dried fruits and saffron, 6 kg',
    steps: [
      ['registered', '2026-11-08T11:00:00.000Z', 'Kabul Office'],
      ['in_warehouse', '2026-11-09T09:30:00.000Z', 'Kabul Hub'],
    ],
  },
  {
    id: 'shp_008',
    trackingNumber: 'MRQ240001852',
    destinationCountry: 'DE',
    sender: { name: 'Maryam Kazemi', phone: '+971 55 765 4321', address: 'Business Bay, Bay Square 6, Dubai, UAE' },
    receiver: { name: 'Karim Habibi', phone: '+49 176 1234 5678', address: 'Königsallee 60, 40212 Düsseldorf, Germany' },
    packageType: 'documents',
    description: 'Commercial invoices and contracts',
    steps: [
      ['registered', '2026-11-05T08:20:00.000Z', 'Dubai Office'],
      ['cancelled', '2026-11-05T17:45:00.000Z', 'Dubai Office', 'Cancelled at sender request'],
    ],
  },
  {
    id: 'shp_009',
    trackingNumber: 'MRQ240001853',
    destinationCountry: 'AE',
    sender: { name: 'Nima Sharifi', phone: '+98 921 444 5566', address: 'Zand Blvd. 32, Shiraz, Iran' },
    receiver: { name: 'Elham Bagheri', phone: '+971 52 333 2211', address: 'Al Nahda 2, Sharjah, UAE' },
    packageType: 'goods',
    description: 'Ceramic handicrafts (fragile), 7 kg',
    steps: [
      ['registered', '2026-10-24T10:00:00.000Z', 'Shiraz Office'],
      ['in_warehouse', '2026-10-24T16:30:00.000Z', 'Tehran Hub'],
      ['dispatched', '2026-10-26T06:00:00.000Z', 'Tehran Hub'],
      ['in_transit', '2026-10-27T14:00:00.000Z', 'Bandar Abbas Port'],
      ['returned', '2026-11-01T10:30:00.000Z', 'Tehran Hub', 'Receiver unreachable — returned to sender'],
    ],
  },
  {
    id: 'shp_010',
    trackingNumber: 'MRQ240001854',
    destinationCountry: 'AF',
    sender: { name: 'Samira Rostami', phone: '+90 533 222 4455', address: 'Alsancak, Kıbrıs Şehitleri Cd. 9, Izmir, Türkiye' },
    receiver: { name: 'Farid Ghasemi', phone: '+93 70 555 6677', address: 'Pul-e Khishti, Kabul, Afghanistan' },
    packageType: 'goods',
    description: 'Kitchenware set, 11 kg',
    steps: [
      ['registered', '2026-11-07T12:15:00.000Z', 'Izmir Office'],
      ['in_warehouse', '2026-11-08T08:00:00.000Z', 'Istanbul Hub'],
      ['dispatched', '2026-11-10T05:30:00.000Z', 'Istanbul Airport'],
    ],
  },
  {
    id: 'shp_011',
    trackingNumber: 'MRQ240001855',
    destinationCountry: 'IR',
    sender: { name: 'Bahram Yousefi', phone: '+44 7400 112233', address: '5 Princes Street, Edinburgh EH2 2AN, United Kingdom' },
    receiver: { name: 'Roya Najafi', phone: '+98 914 321 0987', address: 'Shahnaz St. 41, Tabriz, Iran' },
    packageType: 'documents',
    description: 'Passport and visa documents',
    steps: [['registered', '2026-11-11T07:05:00.000Z', 'Edinburgh Office']],
  },
  {
    id: 'shp_012',
    trackingNumber: 'MRQ240001856',
    destinationCountry: 'AF',
    sender: { name: 'Kamran Haidari', phone: '+49 152 9876 5432', address: 'Mönckebergstraße 7, 20095 Hamburg, Germany' },
    receiver: { name: 'Sima Faizi', phone: '+93 79 222 8899', address: 'Kandahar City, District 3, Afghanistan' },
    packageType: 'goods',
    description: 'Auto spare parts, 14 kg',
    steps: [
      ['registered', '2026-10-30T09:10:00.000Z', 'Hamburg Office'],
      ['in_warehouse', '2026-10-30T17:20:00.000Z', 'Hamburg Hub'],
      ['dispatched', '2026-11-01T04:40:00.000Z', 'Hamburg Airport'],
      ['in_transit', '2026-11-02T22:10:00.000Z', 'Dubai Transit Hub'],
      ['delayed', '2026-11-06T08:00:00.000Z', 'Kandahar Depot', 'Road closure — delivery rescheduled'],
    ],
  },
]

export const mockShipments: Shipment[] = seeds.map(build)
