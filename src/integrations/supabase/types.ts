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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      app_feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          phone: string
          school_name: string
          sender_name: string
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          phone?: string
          school_name?: string
          sender_name?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          phone?: string
          school_name?: string
          sender_name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance_early_learners: {
        Row: {
          admission_no: string
          class_id: string
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          admission_no?: string
          class_id: string
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          admission_no?: string
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_early_learners_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_trials: {
        Row: {
          school_id: string
          started_at: string
        }
        Insert: {
          school_id: string
          started_at?: string
        }
        Update: {
          school_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_trials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_attendance: {
        Row: {
          attendance_date: string
          class_id: string
          entries: Json
          id: string
          recorded_by: string
          school_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          entries?: Json
          id?: string
          recorded_by: string
          school_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          entries?: Json
          id?: string
          recorded_by?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_roster_acks: {
        Row: {
          acked_at: string
          roster_id: string
          user_id: string
        }
        Insert: {
          acked_at?: string
          roster_id: string
          user_id: string
        }
        Update: {
          acked_at?: string
          roster_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_roster_acks_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "duty_rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_rosters: {
        Row: {
          created_at: string
          created_by: string
          entries: Json
          id: string
          notes: string
          school_id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entries?: Json
          id?: string
          notes?: string
          school_id: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entries?: Json
          id?: string
          notes?: string
          school_id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_rosters_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_codes: {
        Row: {
          code: string
          created_at: string
          days: number
          id: string
          kind: string
          redeemed_at: string | null
          redeemed_by: string | null
          redeemed_school: string | null
        }
        Insert: {
          code: string
          created_at?: string
          days?: number
          id?: string
          kind?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_school?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          days?: number
          id?: string
          kind?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_school?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_pesewas: number
          created_at: string
          currency: string
          id: string
          plan: string
          reference: string
          school_id: string | null
          scope: string
          status: string
          terms: number
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_pesewas: number
          created_at?: string
          currency?: string
          id?: string
          plan: string
          reference: string
          school_id?: string | null
          scope: string
          status?: string
          terms: number
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_pesewas?: number
          created_at?: string
          currency?: string
          id?: string
          plan?: string
          reference?: string
          school_id?: string | null
          scope?: string
          status?: string
          terms?: number
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      record_shares: {
        Row: {
          class_id: string
          id: string
          payload: Json
          recipient_id: string
          sender_id: string
          sender_name: string
          updated_at: string
        }
        Insert: {
          class_id: string
          id?: string
          payload?: Json
          recipient_id: string
          sender_id: string
          sender_name?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          id?: string
          payload?: Json
          recipient_id?: string
          sender_id?: string
          sender_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_members: {
        Row: {
          created_at: string
          id: string
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_students: {
        Row: {
          class_id: string
          data: Json
          id: string
          school_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          class_id: string
          data?: Json
          id: string
          school_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          class_id?: string
          data?: Json
          id?: string
          school_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_by: string
          details: Json
          first_printed_at: string | null
          id: string
          join_code: string
          license_expires_at: string | null
          license_permanent: boolean
          license_terms: number | null
          name: string
          print_term_key: string | null
          updated_at: string
        }
        Insert: {
          created_by: string
          details?: Json
          first_printed_at?: string | null
          id?: string
          join_code: string
          license_expires_at?: string | null
          license_permanent?: boolean
          license_terms?: number | null
          name?: string
          print_term_key?: string | null
          updated_at?: string
        }
        Update: {
          created_by?: string
          details?: Json
          first_printed_at?: string | null
          id?: string
          join_code?: string
          license_expires_at?: string | null
          license_permanent?: boolean
          license_terms?: number | null
          name?: string
          print_term_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_notice_reads: {
        Row: {
          notice_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notice_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notice_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "staff_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notices: {
        Row: {
          agenda: string
          created_at: string
          created_by: string
          id: string
          meeting_date: string
          meeting_time: string
          notes: string
          school_id: string
          sender_name: string
          title: string
          venue: string
        }
        Insert: {
          agenda?: string
          created_at?: string
          created_by: string
          id?: string
          meeting_date?: string
          meeting_time?: string
          notes?: string
          school_id: string
          sender_name?: string
          title?: string
          venue?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          created_by?: string
          id?: string
          meeting_date?: string
          meeting_time?: string
          notes?: string
          school_id?: string
          sender_name?: string
          title?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_licenses: {
        Row: {
          expires_at: string | null
          first_printed_at: string | null
          license_terms: number | null
          permanent: boolean
          print_term_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          first_printed_at?: string | null
          license_terms?: number | null
          permanent?: boolean
          print_term_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          first_printed_at?: string | null
          license_terms?: number | null
          permanent?: boolean
          print_term_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attendance_access: { Args: { _school: string }; Returns: Json }
      can_edit_attendance: {
        Args: { _class: string; _school: string }
        Returns: boolean
      }
      create_school: {
        Args: { _name: string }
        Returns: {
          created_by: string
          details: Json
          first_printed_at: string | null
          id: string
          join_code: string
          license_expires_at: string | null
          license_permanent: boolean
          license_terms: number | null
          name: string
          print_term_key: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "schools"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_license: { Args: never; Returns: Json }
      is_developer: { Args: never; Returns: boolean }
      is_school_admin: { Args: { _school: string }; Returns: boolean }
      is_school_member: { Args: { _school: string }; Returns: boolean }
      join_school: { Args: { _code: string }; Returns: string }
      print_window_closed: {
        Args: { _first: string; _key: string; _terms: number }
        Returns: boolean
      }
      record_print: { Args: { _term_key: string }; Returns: Json }
      redeem_code: { Args: { _code: string }; Returns: Json }
      regenerate_join_code: { Args: { _school: string }; Returns: string }
      remove_member: { Args: { _member: string }; Returns: undefined }
      save_daily_attendance: {
        Args: {
          _class: string
          _date: string
          _present_ids: string[]
          _school: string
        }
        Returns: {
          attendance_date: string
          class_id: string
          entries: Json
          id: string
          recorded_by: string
          school_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_attendance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_member_role: {
        Args: { _member: string; _role: string }
        Returns: undefined
      }
      shares_school_with: { Args: { _other: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
