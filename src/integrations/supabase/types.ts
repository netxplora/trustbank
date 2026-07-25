export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          user_id: string
          card_number: string
          card_type: string
          card_brand: string
          cardholder_name: string
          expiry_date: string
          cvv: string
          status: string
          is_frozen: boolean
          is_physical: boolean
          online_enabled: boolean
          international_enabled: boolean
          spending_limit: number | null
          delivery_address: string | null
          request_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_number: string
          card_type?: string
          card_brand?: string
          cardholder_name: string
          expiry_date: string
          cvv: string
          status?: string
          is_frozen?: boolean
          is_physical?: boolean
          online_enabled?: boolean
          international_enabled?: boolean
          spending_limit?: number | null
          delivery_address?: string | null
          request_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_number?: string
          card_type?: string
          card_brand?: string
          cardholder_name?: string
          expiry_date?: string
          cvv?: string
          status?: string
          is_frozen?: boolean
          is_physical?: boolean
          online_enabled?: boolean
          international_enabled?: boolean
          spending_limit?: number | null
          delivery_address?: string | null
          request_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          account_type: string
          account_number: string
          balance: number
          currency: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_type: string
          account_number: string
          balance?: number
          currency?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_type?: string
          account_number?: string
          balance?: number
          currency?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      cms_site_settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          display_name: string | null
          kyc_tier: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          kyc_tier?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          kyc_tier?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_card_fee: {
        Args: {
          p_user_id: string
          p_account_id: string
          p_fee_amount: number
          p_reference: string
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
