
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "cohorts": {
                  Row: {
                    "created_at": string,"end_date": string | null,"id": string,"name": string,"start_date": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date"?: never,"id"?: string,"name": string,"start_date": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: never,"id"?: string,"name"?: string,"start_date"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"group_memberships": {
                  Row: {
                    "created_at": string,"ended_on": string | null,"group_id": string,"id": string,"role": Database["public"]['Enums']["membership_role"],"started_on": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ended_on"?: string | null,"group_id": string,"id"?: string,"role": Database["public"]['Enums']["membership_role"],"started_on"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"ended_on"?: string | null,"group_id"?: string,"id"?: string,"role"?: Database["public"]['Enums']["membership_role"],"started_on"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_memberships_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "cohort_id": string,"created_at": string,"id": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"created_at"?: string,"id"?: string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "cohort_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    }
                  ]
                },"journey_stages": {
                  Row: {
                    "created_at": string,"description": string | null,"from_day": number,"id": string,"sort_order": number,"title": string,"to_day": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"from_day": number,"id"?: string,"sort_order"?: number,"title": string,"to_day": number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"from_day"?: number,"id"?: string,"sort_order"?: number,"title"?: string,"to_day"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "active_role": Database["public"]['Enums']["app_role"],"city": string | null,"created_at": string,"deletion_requested_at": string | null,"email": string,"full_name": string,"gender": Database["public"]['Enums']["gender"] | null,"id": string,"notification_prefs": NonNullable<Json>,"phone": string | null,"time_zone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_role"?: Database["public"]['Enums']["app_role"],"city"?: string | null,"created_at"?: string,"deletion_requested_at"?: string | null,"email": string,"full_name": string,"gender"?: Database["public"]['Enums']["gender"] | null,"id": string,"notification_prefs"?: NonNullable<Json>,"phone"?: string | null,"time_zone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active_role"?: Database["public"]['Enums']["app_role"],"city"?: string | null,"created_at"?: string,"deletion_requested_at"?: string | null,"email"?: string,"full_name"?: string,"gender"?: Database["public"]['Enums']["gender"] | null,"id"?: string,"notification_prefs"?: NonNullable<Json>,"phone"?: string | null,"time_zone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_cohort_id":
{ Args: { "p_user": string }; Returns: string
                           },
"has_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"] }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_group_facilitator":
{ Args: { "p_group": string }; Returns: boolean
                           },
"is_group_member":
{ Args: { "p_group": string }; Returns: boolean
                           },
"is_in_cohort":
{ Args: { "p_cohort": string }; Returns: boolean
                           },
"journey_day":
{ Args: { "p_local_date": string,"p_user": string }; Returns: number
                           },
"user_local_date":
{ Args: { "p_user": string }; Returns: string
                           }
          }
          Enums: {
            "app_role": "member"|"facilitator"|"admin","gender": "male"|"female","membership_role": "member"|"facilitator"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["member", "facilitator", "admin"],"gender": ["male", "female"],"membership_role": ["member", "facilitator"]
          }
        }
} as const
