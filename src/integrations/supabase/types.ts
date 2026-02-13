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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      claim_evidence: {
        Row: {
          claim_id: string
          created_at: string
          evidence_id: string
          id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          evidence_id: string
          id?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          evidence_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          label: string
          parent_claim_id: string | null
          status: string
          title: string
          topic_id: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          parent_claim_id?: string | null
          status?: string
          title: string
          topic_id?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          parent_claim_id?: string | null
          status?: string
          title?: string
          topic_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "claims_parent_claim_id_fkey"
            columns: ["parent_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      context_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          evidence_id: string | null
          id: string
          target_id: string
          target_type: string
          usefulness_score: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          evidence_id?: string | null
          id?: string
          target_id: string
          target_type: string
          usefulness_score?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          evidence_id?: string | null
          id?: string
          target_id?: string
          target_type?: string
          usefulness_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "context_notes_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          author: string | null
          created_at: string
          created_by: string | null
          credibility: string | null
          excerpt: string | null
          id: string
          published_date: string | null
          source_type: string
          title: string
          url: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          created_by?: string | null
          credibility?: string | null
          excerpt?: string | null
          id?: string
          published_date?: string | null
          source_type?: string
          title: string
          url?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          created_by?: string | null
          credibility?: string | null
          excerpt?: string | null
          id?: string
          published_date?: string | null
          source_type?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      graph_connections: {
        Row: {
          created_at: string
          description: string | null
          edge_type: string
          evidence_id: string | null
          id: string
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edge_type: string
          evidence_id?: string | null
          id?: string
          source_node_id: string
          target_node_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edge_type?: string
          evidence_id?: string | null
          id?: string
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_connections_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_connections_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_connections_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          node_type: string
          ref_id: string | null
          topic_id: string | null
          x_pos: number | null
          y_pos: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          node_type: string
          ref_id?: string | null
          topic_id?: string | null
          x_pos?: number | null
          y_pos?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          node_type?: string
          ref_id?: string | null
          topic_id?: string | null
          x_pos?: number | null
          y_pos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_nodes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          created_at: string
          entries_added: number | null
          entries_found: number | null
          error_message: string | null
          id: string
          query: string
          source_type: string
          status: string
        }
        Insert: {
          created_at?: string
          entries_added?: number | null
          entries_found?: number | null
          error_message?: string | null
          id?: string
          query: string
          source_type?: string
          status?: string
        }
        Update: {
          created_at?: string
          entries_added?: number | null
          entries_found?: number | null
          error_message?: string | null
          id?: string
          query?: string
          source_type?: string
          status?: string
        }
        Relationships: []
      }
      intel_connections: {
        Row: {
          connection_type: string
          created_at: string
          description: string | null
          evidence_strength: string
          id: string
          source_entry_id: string
          target_entry_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          description?: string | null
          evidence_strength?: string
          id?: string
          source_entry_id: string
          target_entry_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          description?: string | null
          evidence_strength?: string
          id?: string
          source_entry_id?: string
          target_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intel_connections_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "intel_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intel_connections_target_entry_id_fkey"
            columns: ["target_entry_id"]
            isOneToOne: false
            referencedRelation: "intel_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      intel_entries: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          credibility_score: number | null
          description: string | null
          fact_check_notes: string | null
          fact_check_status: string
          id: string
          ingested_at: string
          lat: number | null
          lng: number | null
          published_at: string | null
          raw_content: string | null
          related_entities: string[] | null
          source_type: string
          source_url: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          credibility_score?: number | null
          description?: string | null
          fact_check_notes?: string | null
          fact_check_status?: string
          id?: string
          ingested_at?: string
          lat?: number | null
          lng?: number | null
          published_at?: string | null
          raw_content?: string | null
          related_entities?: string[] | null
          source_type?: string
          source_url?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          credibility_score?: number | null
          description?: string | null
          fact_check_notes?: string | null
          fact_check_status?: string
          id?: string
          ingested_at?: string
          lat?: number | null
          lng?: number | null
          published_at?: string | null
          raw_content?: string | null
          related_entities?: string[] | null
          source_type?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      intel_sources: {
        Row: {
          created_at: string
          id: string
          last_fetched_at: string | null
          name: string
          reliability_rating: number | null
          source_type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_fetched_at?: string | null
          name: string
          reliability_rating?: number | null
          source_type?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_fetched_at?: string | null
          name?: string
          reliability_rating?: number | null
          source_type?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          handle: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          branch: string | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          evidence_id: string | null
          id: string
          title: string
          topic_id: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          evidence_id?: string | null
          id?: string
          title: string
          topic_id?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          evidence_id?: string | null
          id?: string
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          created_by: string | null
          depth_score: number | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          depth_score?: number | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          depth_score?: number | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
