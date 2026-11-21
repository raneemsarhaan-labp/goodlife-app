
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activities": {
                  Row: {
                    "cancelled_at": string | null,"created_at": string,"created_by": string | null,"description": string | null,"ends_at": string | null,"id": string,"location": string | null,"starts_at": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"location"?: string | null,"starts_at": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"location"?: string | null,"starts_at"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"activity_audiences": {
                  Row: {
                    "activity_id": string,"cohort_id": string | null,"group_id": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_id": string,"cohort_id"?: string | null,"group_id"?: string | null,"id"?: string
                  }
                  Update: {
                    "activity_id"?: string,"cohort_id"?: string | null,"group_id"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_audiences_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_audiences_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_audiences_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    }
                  ]
                },"challenge_completions": {
                  Row: {
                    "client_mutation_id": string,"cohort_id": string,"created_at": string,"id": string,"journey_challenge_id": string | null,"kind": Database["public"]['Enums']["challenge_kind"],"local_date": string,"own_challenge_id": string | null,"recorded_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_mutation_id": string,"cohort_id": string,"created_at"?: string,"id"?: string,"journey_challenge_id"?: string | null,"kind": Database["public"]['Enums']["challenge_kind"],"local_date": string,"own_challenge_id"?: string | null,"recorded_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "client_mutation_id"?: string,"cohort_id"?: string,"created_at"?: string,"id"?: string,"journey_challenge_id"?: string | null,"kind"?: Database["public"]['Enums']["challenge_kind"],"local_date"?: string,"own_challenge_id"?: string | null,"recorded_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_completions_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_completions_journey_challenge_id_fkey"
      columns: ["journey_challenge_id"]
isOneToOne: false
      referencedRelation: "journey_challenges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_completions_own_challenge_id_fkey"
      columns: ["own_challenge_id"]
isOneToOne: false
      referencedRelation: "own_challenges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_completions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"closing_messages": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cohorts": {
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
                },"day_entries": {
                  Row: {
                    "closed_at": string | null,"closing_message_id": string | null,"cohort_id": string,"created_at": string,"id": string,"intention": string | null,"local_date": string,"reflection": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closed_at"?: string | null,"closing_message_id"?: string | null,"cohort_id": string,"created_at"?: string,"id"?: string,"intention"?: string | null,"local_date": string,"reflection"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "closed_at"?: string | null,"closing_message_id"?: string | null,"cohort_id"?: string,"created_at"?: string,"id"?: string,"intention"?: string | null,"local_date"?: string,"reflection"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "day_entries_closing_message_id_fkey"
      columns: ["closing_message_id"]
isOneToOne: false
      referencedRelation: "closing_messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "day_entries_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "day_entries_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"encouragement_phrases": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"sort_order": number,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"sort_order"?: number,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"sort_order"?: number,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"encouragements": {
                  Row: {
                    "created_at": string,"id": string,"local_date": string,"phrase_id": string,"recipient_id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"local_date": string,"phrase_id": string,"recipient_id": string,"sender_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"local_date"?: string,"phrase_id"?: string,"recipient_id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "encouragements_phrase_id_fkey"
      columns: ["phrase_id"]
isOneToOne: false
      referencedRelation: "encouragement_phrases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "encouragements_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "encouragements_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"focus_areas": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"plan_id": string,"sort_order": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"plan_id": string,"sort_order"?: number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"plan_id"?: string,"sort_order"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "focus_areas_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
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
                },"guidelines": {
                  Row: {
                    "created_at": string,"id": string,"number": number,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"number": number,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"number"?: number,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"habit_completions": {
                  Row: {
                    "client_mutation_id": string,"created_at": string,"habit_id": string,"local_date": string,"recorded_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_mutation_id": string,"created_at"?: string,"habit_id": string,"local_date": string,"recorded_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "client_mutation_id"?: string,"created_at"?: string,"habit_id"?: string,"local_date"?: string,"recorded_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "habit_completions_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "habit_completions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"habits": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"description": string | null,"focus_area_id": string | null,"id": string,"name": string,"plan_id": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"focus_area_id"?: string | null,"id"?: string,"name": string,"plan_id": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"focus_area_id"?: string | null,"id"?: string,"name"?: string,"plan_id"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "habits_focus_area_id_fkey"
      columns: ["focus_area_id"]
isOneToOne: false
      referencedRelation: "focus_areas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "habits_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"invitation_codes": {
                  Row: {
                    "code": string,"cohort_id": string,"created_at": string,"created_by": string | null,"expires_at": string,"group_id": string,"id": string,"max_uses": number,"revoked_at": string | null,"uses": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"cohort_id": string,"created_at"?: string,"created_by"?: string | null,"expires_at": string,"group_id": string,"id"?: string,"max_uses"?: number,"revoked_at"?: string | null,"uses"?: number
                  }
                  Update: {
                    "code"?: string,"cohort_id"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"group_id"?: string,"id"?: string,"max_uses"?: number,"revoked_at"?: string | null,"uses"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitation_codes_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitation_codes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitation_codes_group_id_cohort_id_fkey"
      columns: ["group_id","cohort_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id","cohort_id"]
    }
                  ]
                },"journey_challenges": {
                  Row: {
                    "created_at": string,"id": string,"journey_day": number,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"journey_day": number,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"journey_day"?: number,"text"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
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
                },"monthly_reviews": {
                  Row: {
                    "answers": NonNullable<Json>,"cohort_id": string,"completed_at": string | null,"created_at": string,"figures_snapshot": Json | null,"id": string,"month": string,"status": Database["public"]['Enums']["review_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"cohort_id": string,"completed_at"?: string | null,"created_at"?: string,"figures_snapshot"?: Json | null,"id"?: string,"month": string,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"cohort_id"?: string,"completed_at"?: string | null,"created_at"?: string,"figures_snapshot"?: Json | null,"id"?: string,"month"?: string,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "monthly_reviews_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "monthly_reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"own_challenges": {
                  Row: {
                    "cohort_id": string,"created_at": string,"id": string,"local_date": string,"text": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"created_at"?: string,"id"?: string,"local_date": string,"text": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cohort_id"?: string,"created_at"?: string,"id"?: string,"local_date"?: string,"text"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "own_challenges_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "own_challenges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "cohort_id": string,"created_at": string,"current_state": string,"id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"created_at"?: string,"current_state"?: string,"id"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cohort_id"?: string,"created_at"?: string,"current_state"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plans_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_audiences": {
                  Row: {
                    "cohort_id": string | null,"group_id": string | null,"id": string,"resource_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id"?: string | null,"group_id"?: string | null,"id"?: string,"resource_id": string
                  }
                  Update: {
                    "cohort_id"?: string | null,"group_id"?: string | null,"id"?: string,"resource_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_audiences_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_audiences_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_audiences_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "audience": Database["public"]['Enums']["resource_audience"],"category": string | null,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"sort_order": number,"storage_path": string | null,"title": string,"type": Database["public"]['Enums']["resource_type"],"updated_at": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["resource_audience"],"category"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"sort_order"?: number,"storage_path"?: string | null,"title": string,"type": Database["public"]['Enums']["resource_type"],"updated_at"?: string,"url"?: string | null
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["resource_audience"],"category"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"sort_order"?: number,"storage_path"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["resource_type"],"updated_at"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "resources_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"review_questions": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"sort_order": number,"text": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"sort_order"?: number,"text": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"sort_order"?: number,"text"?: string,"updated_at"?: string
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
            "daily_activity": {
                  Row: {
                    "closed": boolean | null,"cohort_id": string | null,"habits_done": number | null,"journey_done": number | null,"local_date": string | null,"own_done": number | null,"own_written": boolean | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "activity_created_by_me":
{ Args: { "p_activity": string }; Returns: boolean
                           },
"activity_led_by_me":
{ Args: { "p_activity": string }; Returns: boolean
                           },
"add_member":
{ Args: { "p_group": string,"p_user": string }; Returns: undefined
                           },
"assert_day_editable":
{ Args: { "p_cohort": string,"p_date": string,"p_recorded_at": string,"p_user": string }; Returns: undefined
                           },
"assign_facilitator":
{ Args: { "p_group": string,"p_user": string }; Returns: undefined
                           },
"can_read_resource_object":
{ Args: { "p_name": string }; Returns: boolean
                           },
"can_see_activity":
{ Args: { "p_activity": string }; Returns: boolean
                           },
"can_see_resource":
{ Args: { "p_resource": string }; Returns: boolean
                           },
"cancel_activity":
{ Args: { "p_id": string }; Returns: undefined
                           },
"check_invitation":
{ Args: { "p_code": string }; Returns: Record<string, unknown>
                           },
"close_day":
{ Args: { "p_reflection"?: string }; Returns: Json
                           },
"copy_habits_from_previous_plan":
{ Args: { "p_habit_ids"?: (string)[] }; Returns: number
                           },
"current_cohort_id":
{ Args: { "p_user": string }; Returns: string
                           },
"current_plan_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_today":
{ Args: { "p_which"?: string }; Returns: Json
                           },
"grant_admin":
{ Args: { "p_user": string }; Returns: undefined
                           },
"group_member_signals":
{ Args: { "p_from": string,"p_group": string,"p_to": string }; Returns: {
              "completion_rate": number,"days_closed": number,"full_name": string,"last_active": string,"user_id": string
            }[]
                           },
"group_peers":
{ Args: Record<PropertyKey, never>; Returns: {
              "full_name": string,"group_id": string,"role": Database["public"]['Enums']["membership_role"],"user_id": string
            }[]
                           },
"group_stats":
{ Args: { "p_from": string,"p_group": string,"p_to": string }; Returns: Json
                           },
"group_windows":
{ Args: { "p_from": string,"p_group": string,"p_to": string }; Returns: {
              "active": boolean,"d_from": string,"d_to": string,"user_id": string
            }[]
                           },
"habit_rates":
{ Args: { "p_cohort": string,"p_from": string,"p_to": string,"p_user": string }; Returns: {
              "archived": boolean,"done_days": number,"habit_id": string,"name": string,"possible_days": number
            }[]
                           },
"habit_streaks":
{ Args: { "p_cohort": string,"p_user": string }; Returns: {
              "current_streak": number,"habit_id": string,"longest_streak": number
            }[]
                           },
"has_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"] }; Returns: boolean
                           },
"is_active_in_cohort":
{ Args: { "p_cohort": string }; Returns: boolean
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
"member_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: Json
                           },
"month_figures":
{ Args: { "p_month": string }; Returns: Json
                           },
"move_member":
{ Args: { "p_group": string,"p_user": string }; Returns: undefined
                           },
"normalize_invitation_code":
{ Args: { "p_code": string }; Returns: string
                           },
"period_figures":
{ Args: { "p_from": string,"p_to": string,"p_user": string }; Returns: Json
                           },
"previous_plan_habit_count":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"received_encouragements":
{ Args: { "p_limit"?: number }; Returns: {
              "created_at": string,"id": string,"local_date": string,"phrase": string,"sender_name": string
            }[]
                           },
"redeem_invitation":
{ Args: { "p_auth_user": string,"p_city"?: string,"p_code": string,"p_email": string,"p_full_name": string,"p_gender"?: Database["public"]['Enums']["gender"],"p_phone"?: string,"p_time_zone": string }; Returns: string
                           },
"remove_facilitator":
{ Args: { "p_group": string,"p_user": string }; Returns: undefined
                           },
"reorder_focus_areas":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"reorder_habits":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"reorder_resources":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"request_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"require_admin":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"require_group_reader":
{ Args: { "p_group": string }; Returns: undefined
                           },
"revoke_admin":
{ Args: { "p_user": string }; Returns: undefined
                           },
"save_activity":
{ Args: { "p_cohort_id"?: string,"p_description"?: string,"p_ends_at"?: string,"p_group_ids"?: (string)[],"p_id"?: string,"p_location"?: string,"p_starts_at"?: string,"p_title"?: string }; Returns: string
                           },
"save_resource":
{ Args: { "p_audience"?: Database["public"]['Enums']["resource_audience"],"p_category"?: string,"p_cohort_ids"?: (string)[],"p_description"?: string,"p_group_ids"?: (string)[],"p_id"?: string,"p_storage_path"?: string,"p_title"?: string,"p_type"?: Database["public"]['Enums']["resource_type"],"p_url"?: string }; Returns: string
                           },
"save_review":
{ Args: { "p_answers": Json,"p_complete": boolean,"p_month": string }; Returns: undefined
                           },
"send_encouragement":
{ Args: { "p_phrase": string,"p_recipient": string }; Returns: undefined
                           },
"set_challenge_done":
{ Args: { "p_client_mutation_id": string,"p_done": boolean,"p_kind": Database["public"]['Enums']["challenge_kind"],"p_local_date": string,"p_recorded_at"?: string }; Returns: undefined
                           },
"set_habit_done":
{ Args: { "p_client_mutation_id": string,"p_done": boolean,"p_habit": string,"p_local_date": string,"p_recorded_at"?: string }; Returns: Json
                           },
"set_intention":
{ Args: { "p_text": string }; Returns: undefined
                           },
"set_own_challenge":
{ Args: { "p_text": string }; Returns: string
                           },
"shares_active_group":
{ Args: { "p_a": string,"p_b": string }; Returns: boolean
                           },
"user_local_date":
{ Args: { "p_user": string }; Returns: string
                           }
          }
          Enums: {
            "app_role": "member"|"facilitator"|"admin","challenge_kind": "journey"|"own","gender": "male"|"female","membership_role": "member"|"facilitator","resource_audience": "program"|"cohorts"|"groups","resource_type": "recording"|"file"|"reference","review_status": "draft"|"completed"
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
            "app_role": ["member", "facilitator", "admin"],"challenge_kind": ["journey", "own"],"gender": ["male", "female"],"membership_role": ["member", "facilitator"],"resource_audience": ["program", "cohorts", "groups"],"resource_type": ["recording", "file", "reference"],"review_status": ["draft", "completed"]
          }
        }
} as const
