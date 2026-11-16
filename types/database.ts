import type { PackageType, ShipmentStatus, ShippingCompany } from '@/types/shipment'
import type { AccountStatus, UserRole } from '@/types/user'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WarehouseOperationType = 'receive' | 'dispatch' | 'storage_record' | 'transfer_out' | 'transfer_in' | 'status_update'
export type OfficeOperationType = 'incoming' | 'outgoing' | 'transfer' | 'handover' | 'status_change'
export type IssueKind = 'damaged' | 'missing' | 'delay'
export type IssueState = 'open' | 'resolved'
export type TransferState = 'in_transit' | 'received'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          office_id: string | null
          account_status: AccountStatus
          must_change_password: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          office_id?: string | null
          account_status?: AccountStatus
          must_change_password?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          office_id?: string | null
          account_status?: AccountStatus
          must_change_password?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
        ]
      }
      offices: {
        Row: {
          id: string
          name: string
          code: string
          address: string
          phone: string
          email: string
          status: AccountStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string
          phone?: string
          email?: string
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string
          phone?: string
          email?: string
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          email: string
          full_name: string
          role: UserRole
          office_id: string | null
          invited_by: string
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          email: string
          full_name: string
          role: UserRole
          office_id?: string | null
          invited_by: string
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: UserRole
          office_id?: string | null
          invited_by?: string
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          tracking_number: string | null
          destination_country: string
          weight_kg: number
          length_cm: number | null
          width_cm: number | null
          height_cm: number | null
          shipping_company: ShippingCompany | null
          received_date: string | null
          sender_id_photo_path: string | null
          receiver_home_photo_path: string | null
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
          office_id: string | null
        }
        Insert: {
          id?: string
          tracking_number: string | null
          destination_country?: string
          weight_kg?: number
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          shipping_company?: ShippingCompany | null
          received_date?: string | null
          sender_id_photo_path?: string | null
          receiver_home_photo_path?: string | null
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
          office_id?: string | null
        }
        Update: {
          id?: string
          tracking_number?: string | null
          destination_country?: string
          weight_kg?: number
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          shipping_company?: ShippingCompany | null
          received_date?: string | null
          sender_id_photo_path?: string | null
          receiver_home_photo_path?: string | null
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
          office_id?: string | null
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
      warehouses: {
        Row: {
          id: string
          name: string
          code: string
          office_id: string
          address: string
          phone: string
          email: string
          status: AccountStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          office_id: string
          address?: string
          phone?: string
          email?: string
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          office_id?: string
          address?: string
          phone?: string
          email?: string
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'warehouses_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
        ]
      }
      warehouse_operations: {
        Row: {
          id: string
          shipment_id: string
          warehouse_id: string
          office_id: string
          operation_type: WarehouseOperationType
          previous_status: ShipmentStatus | null
          new_status: ShipmentStatus
          location: string | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          shipment_id: string
          warehouse_id: string
          office_id: string
          operation_type: WarehouseOperationType
          previous_status?: ShipmentStatus | null
          new_status: ShipmentStatus
          location?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          shipment_id?: string
          warehouse_id?: string
          office_id?: string
          operation_type?: WarehouseOperationType
          previous_status?: ShipmentStatus | null
          new_status?: ShipmentStatus
          location?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'warehouse_operations_shipment_id_fkey'
            columns: ['shipment_id']
            isOneToOne: false
            referencedRelation: 'shipments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'warehouse_operations_warehouse_id_fkey'
            columns: ['warehouse_id']
            isOneToOne: false
            referencedRelation: 'warehouses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'warehouse_operations_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'warehouse_operations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      office_operations: {
        Row: {
          id: string
          shipment_id: string | null
          source_office_id: string | null
          destination_office_id: string | null
          office_id: string
          operation_type: OfficeOperationType
          previous_status: ShipmentStatus | null
          new_status: ShipmentStatus | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          shipment_id?: string | null
          source_office_id?: string | null
          destination_office_id?: string | null
          office_id: string
          operation_type: OfficeOperationType
          previous_status?: ShipmentStatus | null
          new_status?: ShipmentStatus | null
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          shipment_id?: string | null
          source_office_id?: string | null
          destination_office_id?: string | null
          office_id?: string
          operation_type?: OfficeOperationType
          previous_status?: ShipmentStatus | null
          new_status?: ShipmentStatus | null
          notes?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'office_operations_shipment_id_fkey'
            columns: ['shipment_id']
            isOneToOne: false
            referencedRelation: 'shipments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'office_operations_source_office_id_fkey'
            columns: ['source_office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'office_operations_destination_office_id_fkey'
            columns: ['destination_office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'office_operations_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'office_operations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string
          office_id: string | null
          previous_values: Json | null
          new_values: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string
          office_id?: string | null
          previous_values?: Json | null
          new_values?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          office_id?: string | null
          previous_values?: Json | null
          new_values?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
        ]
      }
      shipment_issues: {
        Row: {
          id: string
          shipment_id: string
          office_id: string
          kind: IssueKind
          description: string
          state: IssueState
          created_by: string
          resolved_by: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          shipment_id: string
          office_id: string
          kind: IssueKind
          description: string
          state?: IssueState
          created_by: string
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          shipment_id?: string
          office_id?: string
          kind?: IssueKind
          description?: string
          state?: IssueState
          created_by?: string
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'shipment_issues_shipment_id_fkey'
            columns: ['shipment_id']
            isOneToOne: false
            referencedRelation: 'shipments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_issues_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_issues_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_issues_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      shipment_transfers: {
        Row: {
          id: string
          shipment_id: string
          source_office_id: string
          destination_office_id: string
          office_id: string
          state: TransferState
          note: string | null
          created_by: string
          received_by: string | null
          created_at: string
          received_at: string | null
        }
        Insert: {
          id?: string
          shipment_id: string
          source_office_id: string
          destination_office_id: string
          office_id: string
          state?: TransferState
          note?: string | null
          created_by: string
          received_by?: string | null
          created_at?: string
          received_at?: string | null
        }
        Update: {
          id?: string
          shipment_id?: string
          source_office_id?: string
          destination_office_id?: string
          office_id?: string
          state?: TransferState
          note?: string | null
          created_by?: string
          received_by?: string | null
          created_at?: string
          received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'shipment_transfers_shipment_id_fkey'
            columns: ['shipment_id']
            isOneToOne: false
            referencedRelation: 'shipments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_transfers_source_office_id_fkey'
            columns: ['source_office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_transfers_destination_office_id_fkey'
            columns: ['destination_office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_transfers_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_transfers_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shipment_transfers_received_by_fkey'
            columns: ['received_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          entity_type: string | null
          entity_id: string | null
          office_id: string | null
          priority: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          entity_type?: string | null
          entity_id?: string | null
          office_id?: string | null
          priority?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          entity_type?: string | null
          entity_id?: string | null
          office_id?: string | null
          priority?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          id: string
          office_id: string
          type: string
          category: string
          amount: number
          currency: string
          description: string
          reference_type: string | null
          reference_id: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          office_id: string
          type: string
          category: string
          amount: number
          currency: string
          description: string
          reference_type?: string | null
          reference_id?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          type?: string
          category?: string
          amount?: number
          currency?: string
          description?: string
          reference_type?: string | null
          reference_id?: string | null
          created_by?: string
          created_at?: string
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
          p_destination_country: string
          p_weight_kg: number
          p_length_cm: number | null
          p_width_cm: number | null
          p_height_cm: number | null
          p_shipping_company: ShippingCompany
          p_received_date: string | null
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
          p_destination_country: string
          p_weight_kg: number
          p_length_cm: number | null
          p_width_cm: number | null
          p_height_cm: number | null
          p_shipping_company: ShippingCompany
          p_received_date: string | null
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
      can_access_office: {
        Args: { p_office_id: string }
        Returns: boolean
      }
      is_office_manager_for: {
        Args: { p_office_id: string }
        Returns: boolean
      }
      warehouse_update_shipment_status: {
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
          in_warehouse: number
          in_transit: number
          delivered: number
        }[]
      }
      get_shipment_reports: {
        Args: Record<PropertyKey, never>
        Returns: {
          this_week: number
          this_month: number
          this_year: number
          top_destinations: { country: string; total: number }[]
        }[]
      }
      track_shipment: {
        Args: { p_tracking_number: string }
        Returns: {
          tracking_number: string | null
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
      warehouse_receive_shipment: {
        Args: {
          p_shipment_id: string
          p_warehouse_id: string
          p_location: string
          p_note: string
        }
        Returns: string
      }
      warehouse_dispatch_shipment: {
        Args: {
          p_shipment_id: string
          p_warehouse_id: string
          p_location: string
          p_note: string
        }
        Returns: string
      }
      warehouse_record_storage_location: {
        Args: {
          p_shipment_id: string
          p_warehouse_id: string
          p_location: string
          p_note: string
        }
        Returns: string
      }
      office_register_incoming: {
        Args: {
          p_shipment_id: string
          p_office_id: string
          p_note: string
        }
        Returns: string
      }
      office_register_outgoing: {
        Args: {
          p_shipment_id: string
          p_office_id: string
          p_destination_office_id: string
          p_note: string
        }
        Returns: string
      }
      office_transfer_shipment: {
        Args: {
          p_shipment_id: string
          p_source_office_id: string
          p_destination_office_id: string
          p_note: string
        }
        Returns: string
      }
      office_record_handover: {
        Args: {
          p_shipment_id: string
          p_source_office_id: string
          p_destination_office_id: string
          p_note: string
        }
        Returns: string
      }
      report_shipment_issue: {
        Args: {
          p_shipment_id: string
          p_office_id: string
          p_kind: IssueKind
          p_description: string
        }
        Returns: string
      }
      resolve_shipment_issue: {
        Args: {
          p_issue_id: string
          p_office_id: string
        }
        Returns: string
      }
      record_audit_log: {
        Args: {
          p_actor_id: string
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_office_id: string | null
          p_previous_values: Json | null
          p_new_values: Json | null
          p_metadata: Json | null
        }
        Returns: string
      }
      can_access_warehouse: {
        Args: { p_warehouse_id: string }
        Returns: boolean
      }
      is_warehouse_member: {
        Args: { p_warehouse_id: string }
        Returns: boolean
      }
      can_read_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_financial_summary: {
        Args: {
          p_office_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_revenue: number
          total_expense: number
          net_balance: number
          transaction_count: number
        }[]
      }
    }
    Enums: {
      app_role: UserRole
      shipment_status: ShipmentStatus
      package_type: PackageType
      shipping_company: ShippingCompany
      warehouse_operation_type: WarehouseOperationType
      office_operation_type: OfficeOperationType
      issue_kind: IssueKind
      issue_state: IssueState
      transfer_state: TransferState
    }
    CompositeTypes: Record<string, never>
  }
}
