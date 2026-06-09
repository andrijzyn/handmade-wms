export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      locations: {
        Row: {
          col: number
          id: string
          label: string | null
          level: number
          row: number
        }
        Insert: {
          col: number
          id?: string
          label?: string | null
          level: number
          row: number
        }
        Update: {
          col?: number
          id?: string
          label?: string | null
          level?: number
          row?: number
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string
          actor_user_id: string | null
          correlation_id: string
          creationTime: string
          entityID: string | null
          entityType: string
          id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          correlation_id: string
          creationTime?: string
          entityID?: string | null
          entityType: string
          id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          correlation_id?: string
          creationTime?: string
          entityID?: string | null
          entityType?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          key: string
          label: string
        }
        Insert: {
          id?: string
          key: string
          label: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      product_locations: {
        Row: {
          id: string
          location_id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          location_id: string
          product_id: string
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          location_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_locations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          description: string | null
          id: string
          low_stock_threshold: number
          name: string
          price: number
          quantity: number
          sku: string
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          low_stock_threshold?: number
          name: string
          price?: number
          quantity?: number
          sku: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          low_stock_threshold?: number
          name?: string
          price?: number
          quantity?: number
          sku?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted_at: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          callsign: string | null
          clearance_level: string
          creationTime: string | null
          full_name: string
          id: string
          is_active: boolean
          password: string
          rank: string
          session_version: string | null
          unit: string
          username: string
        }
        Insert: {
          callsign?: string | null
          clearance_level?: string
          creationTime?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          password: string
          rank: string
          session_version?: string | null
          unit: string
          username: string
        }
        Update: {
          callsign?: string | null
          clearance_level?: string
          creationTime?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          password?: string
          rank?: string
          session_version?: string | null
          unit?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_product_location_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_location_id: string
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          location_id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "product_locations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_product_with_audit: {
        Args: {
          p_actor_user_id: string
          p_category: string
          p_correlation_id: string
          p_description: string
          p_low_stock_threshold: number
          p_name: string
          p_price: number
          p_quantity: number
          p_sku: string
        }
        Returns: {
          category: string
          description: string | null
          id: string
          low_stock_threshold: number
          name: string
          price: number
          quantity: number
          sku: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_user_with_audit: {
        Args: {
          p_actor_user_id: string
          p_callsign: string
          p_clearance_level: string
          p_correlation_id: string
          p_full_name: string
          p_is_active: boolean
          p_password: string
          p_rank: string
          p_unit: string
          p_username: string
        }
        Returns: string
      }
      delete_product_location_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_id: string
        }
        Returns: boolean
      }
      delete_product_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_product_id: string
        }
        Returns: boolean
      }
      delete_user_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_correlation_id: string
          p_entity_id: string
          p_entity_type: string
          p_payload?: Json
        }
        Returns: undefined
      }
      logs_audit_event: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_correlation_id: string
          p_entity_id: string
          p_entity_type: string
          p_payload?: Json
        }
        Returns: undefined
      }
      replace_user_permissions_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_permission_keys: string[]
          p_user_id: string
        }
        Returns: boolean
      }
      update_product_location_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          location_id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "product_locations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_product_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_product_id: string
          p_updates: Json
        }
        Returns: {
          category: string
          description: string | null
          id: string
          low_stock_threshold: number
          name: string
          price: number
          quantity: number
          sku: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_with_audit: {
        Args: {
          p_actor_user_id: string
          p_correlation_id: string
          p_updates: Json
          p_user_id: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
