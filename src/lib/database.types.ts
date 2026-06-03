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
          actorUserID: string | null
          correlationID: string
          creationTime: string
          entityID: string | null
          entityType: string
          id: string
          payload: Json
        }
        Insert: {
          action: string
          actorUserID?: string | null
          correlationID: string
          creationTime?: string
          entityID?: string | null
          entityType: string
          id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actorUserID?: string | null
          correlationID?: string
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
          locationID: string
          productID: string
          quantity: number
          updatedAt: string | null
        }
        Insert: {
          id?: string
          locationID: string
          productID: string
          quantity?: number
          updatedAt?: string | null
        }
        Update: {
          id?: string
          locationID?: string
          productID?: string
          quantity?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_locations_locationID_fkey"
            columns: ["locationID"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_locations_productID_fkey"
            columns: ["productID"]
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
          lowStockThreshold: number
          name: string
          price: number
          quantity: number
          sku: string
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          lowStockThreshold?: number
          name: string
          price?: number
          quantity?: number
          sku: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          lowStockThreshold?: number
          name?: string
          price?: number
          quantity?: number
          sku?: string
        }
        Relationships: []
      }
      userPermissions: {
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
            foreignKeyName: "userPermissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "userPermissions_user_id_fkey"
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
          clearanceLevel: string
          creationTime: string | null
          fullName: string
          id: string
          isActive: boolean
          password: string
          rank: string
          sessionVersion: string | null
          unit: string
          username: string
        }
        Insert: {
          callsign?: string | null
          clearanceLevel?: string
          creationTime?: string | null
          fullName: string
          id?: string
          isActive?: boolean
          password: string
          rank: string
          sessionVersion?: string | null
          unit: string
          username: string
        }
        Update: {
          callsign?: string | null
          clearanceLevel?: string
          creationTime?: string | null
          fullName?: string
          id?: string
          isActive?: boolean
          password?: string
          rank?: string
          sessionVersion?: string | null
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
          p_actorUserID: string
          p_correlationID: string
          p_locationID: string
          p_productID: string
          p_quantity: number
        }
        Returns: {
          id: string
          locationID: string
          productID: string
          quantity: number
          updatedAt: string | null
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
          p_actorUserID: string
          p_category: string
          p_correlationID: string
          p_description: string
          p_lowStockThreshold: number
          p_name: string
          p_price: number
          p_quantity: number
          p_sku: string
        }
        Returns: {
          category: string
          description: string | null
          id: string
          lowStockThreshold: number
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
          p_actorUserID: string
          p_callsign: string
          p_clearanceLevel: string
          p_correlationID: string
          p_fullName: string
          p_isActive: boolean
          p_password: string
          p_rank: string
          p_unit: string
          p_username: string
        }
        Returns: string
      }
      delete_product_location_with_audit: {
        Args: {
          p_actorUserID: string
          p_correlationID: string
          p_id: string
        }
        Returns: boolean
      }
      delete_product_with_audit: {
        Args: {
          p_actorUserID: string
          p_correlationID: string
          p_productID: string
        }
        Returns: boolean
      }
      delete_user_with_audit: {
        Args: {
          p_actorUserID: string
          p_correlationID: string
          p_user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actorUserID: string
          p_correlationID: string
          p_entityID: string
          p_entityType: string
          p_payload?: Json
        }
        Returns: undefined
      }
      logs_audit_event: {
        Args: {
          p_action: string
          p_actorUserID: string
          p_correlationID: string
          p_entityID: string
          p_entityType: string
          p_payload?: Json
        }
        Returns: undefined
      }
      replace_userPermissions_with_audit: {
        Args: {
          p_actorUserID: string
          p_correlationID: string
          p_permission_keys: string[]
          p_user_id: string
        }
        Returns: boolean
      }
      update_product_location_with_audit: {
        Args: {
          p_actorUserID: string
          p_correlationID: string
          p_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          locationID: string
          productID: string
          quantity: number
          updatedAt: string | null
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
          p_actorUserID: string
          p_correlationID: string
          p_productID: string
          p_updates: Json
        }
        Returns: {
          category: string
          description: string | null
          id: string
          lowStockThreshold: number
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
          p_actorUserID: string
          p_correlationID: string
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
