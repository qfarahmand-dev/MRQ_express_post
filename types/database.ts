import type { PackageType, ShipmentStatus } from '@/types/shipment'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin'
          created_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          tracking_number: string
          sender_name: string
          sender_phone: string
          sender_address: string
          receiver_name: string
          receiver_phone: string
          receiver_address: string
          package_type: PackageType
          description: string
          registration_date: string
          status: ShipmentStatus
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          tracking_number: string
          sender_name: string
          sender_phone: string
          sender_address: string
          receiver_name: string
          receiver_phone: string
          receiver_address: string
          package_type: PackageType
          description?: string
          registration_date: string
          status?: ShipmentStatus
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tracking_number?: string
          sender_name?: string
          sender_phone?: string
          sender_address?: string
          receiver_name?: string
          receiver_phone?: string
          receiver_address?: string
          package_type?: PackageType
          description?: string
          registration_date?: string
          status?: ShipmentStatus
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          id: string
          shipment_id: string
          status: ShipmentStatus
          location: string | null
          note: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          shipment_id: string
          status: ShipmentStatus
          location?: string | null
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          shipment_id?: string
          status?: ShipmentStatus
          location?: string | null
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_shipment: {
        Args: {
          p_tracking_number: string
          p_sender_name: string
          p_sender_phone: string
          p_sender_address: string
          p_receiver_name: string
          p_receiver_phone: string
          p_receiver_address: string
          p_package_type: PackageType
          p_description: string
          p_registration_date: string
          p_status: ShipmentStatus
        }
        Returns: string
      }
      update_shipment: {
        Args: {
          p_shipment_id: string
          p_tracking_number: string
          p_sender_name: string
          p_sender_phone: string
          p_sender_address: string
          p_receiver_name: string
          p_receiver_phone: string
          p_receiver_address: string
          p_package_type: PackageType
          p_description: string
          p_registration_date: string
          p_status: ShipmentStatus
        }
        Returns: string
      }
      update_shipment_status: {
        Args: {
          p_shipment_id: string
          p_status: ShipmentStatus
          p_location: string | null
          p_note: string | null
        }
        Returns: string
      }
      get_shipment_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
          registered: number
          in_transit: number
          delivered: number
        }[]
      }
      track_shipment: {
        Args: { p_tracking_number: string }
        Returns: {
          tracking_number: string
          sender_name: string
          receiver_name: string
          package_type: PackageType
          status: ShipmentStatus
          registration_date: string
          updated_at: string
          events: {
            id: string
            status: ShipmentStatus
            location: string | null
            note: string | null
            createdAt: string
          }[]
        }[]
      }
    }
    Enums: {
      app_role: 'admin'
      shipment_status: ShipmentStatus
      package_type: PackageType
    }
    CompositeTypes: Record<string, never>
  }
}
