export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      tenant_members: {
        Row: {
          tenant_id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      channel_settings: {
        Row: {
          id: string
          tenant_id: string
          evo_base_url: string
          instance_name: string
          instance_token: string
          webhook_url_inbound: string
          webhook_events: string[]
          wa_number?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          evo_base_url: string
          instance_name: string
          instance_token: string
          webhook_url_inbound: string
          webhook_events?: string[]
          wa_number?: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          evo_base_url?: string
          instance_name?: string
          instance_token?: string
          webhook_url_inbound?: string
          webhook_events?: string[]
          wa_number?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      contatos: {
        Row: {
          created_at: string | null
          email: string | null
          empresa: string | null
          id_lead: string
          nome: string
          score: number | null
          segmento: string | null
          status: Database["public"]["Enums"]["status_lead"] | null
          telefone: string | null
          ultima_interacao: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id_lead: string
          nome: string
          score?: number | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["status_lead"] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id_lead?: string
          nome?: string
          score?: number | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["status_lead"] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      historico: {
        Row: {
          acao_tomada: string | null
          created_at: string | null
          id_historico: string
          id_lead: string | null
          mensagem_enviada: string | null
          produto_relacionado: string | null
          resposta_cliente: string | null
          timestamp: string
          tipo_agente: Database["public"]["Enums"]["tipo_agente"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acao_tomada?: string | null
          created_at?: string | null
          id_historico: string
          id_lead?: string | null
          mensagem_enviada?: string | null
          produto_relacionado?: string | null
          resposta_cliente?: string | null
          timestamp: string
          tipo_agente: Database["public"]["Enums"]["tipo_agente"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acao_tomada?: string | null
          created_at?: string | null
          id_historico?: string
          id_lead?: string | null
          mensagem_enviada?: string | null
          produto_relacionado?: string | null
          resposta_cliente?: string | null
          timestamp?: string
          tipo_agente?: Database["public"]["Enums"]["tipo_agente"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_id_lead_fkey"
            columns: ["id_lead"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id_lead"]
          },
          {
            foreignKeyName: "historico_produto_relacionado_fkey"
            columns: ["produto_relacionado"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_produto"]
          },
        ]
      }
      produtos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id_produto: string
          link_foto: string | null
          nome_produto: string
          preco_normal: number | null
          preco_promo: number | null
          quantidade: number | null
          updated_at: string | null
          user_id: string
          validade_promo: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id_produto: string
          link_foto?: string | null
          nome_produto: string
          preco_normal?: number | null
          preco_promo?: number | null
          quantidade?: number | null
          updated_at?: string | null
          user_id: string
          validade_promo?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id_produto?: string
          link_foto?: string | null
          nome_produto?: string
          preco_normal?: number | null
          preco_promo?: number | null
          quantidade?: number | null
          updated_at?: string | null
          user_id?: string
          validade_promo?: string | null
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
      status_lead: "novo" | "contatado" | "respondeu" | "convertido" | "perdido"
      tipo_agente: "ativo" | "reativo"
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
    Enums: {
      status_lead: ["novo", "contatado", "respondeu", "convertido", "perdido"],
      tipo_agente: ["ativo", "reativo"],
    },
  },
} as const
