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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acessos_demo: {
        Row: {
          criado_em: string
          criado_por: string | null
          expira_em: string
          id: string
          interessado_id: string | null
          nome: string
          revogado: boolean
          token: string
          ultimo_uso: string | null
          usos: number
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          expira_em: string
          id?: string
          interessado_id?: string | null
          nome: string
          revogado?: boolean
          token: string
          ultimo_uso?: string | null
          usos?: number
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          interessado_id?: string | null
          nome?: string
          revogado?: boolean
          token?: string
          ultimo_uso?: string | null
          usos?: number
        }
        Relationships: [
          {
            foreignKeyName: "acessos_demo_interessado_id_fkey"
            columns: ["interessado_id"]
            isOneToOne: false
            referencedRelation: "interessados"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          arquivo_nome: string
          arquivo_path: string | null
          criado_em: string
          duracao_min: number | null
          formato: string
          id: string
          imobiliaria_id: string
          ordem: number
          tamanho_bytes: number
          tipo: string
          titulo: string
          trilha_id: string
          video_url: string | null
        }
        Insert: {
          arquivo_nome: string
          arquivo_path?: string | null
          criado_em?: string
          duracao_min?: number | null
          formato: string
          id?: string
          imobiliaria_id: string
          ordem?: number
          tamanho_bytes?: number
          tipo: string
          titulo: string
          trilha_id: string
          video_url?: string | null
        }
        Update: {
          arquivo_nome?: string
          arquivo_path?: string | null
          criado_em?: string
          duracao_min?: number | null
          formato?: string
          id?: string
          imobiliaria_id?: string
          ordem?: number
          tamanho_bytes?: number
          tipo?: string
          titulo?: string
          trilha_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      captacoes: {
        Row: {
          area_m2: number
          captado_em: string
          checklist_captacao: boolean[]
          checklist_marketing: boolean[]
          corretor_id: string
          finalidade: string
          id: string
          imobiliaria_id: string
          imovel_id: string
          proprietario_id: string
          status: string
          unidade: string | null
          valor: number
        }
        Insert: {
          area_m2: number
          captado_em?: string
          checklist_captacao?: boolean[]
          checklist_marketing?: boolean[]
          corretor_id: string
          finalidade: string
          id?: string
          imobiliaria_id: string
          imovel_id: string
          proprietario_id: string
          status?: string
          unidade?: string | null
          valor: number
        }
        Update: {
          area_m2?: number
          captado_em?: string
          checklist_captacao?: boolean[]
          checklist_marketing?: boolean[]
          corretor_id?: string
          finalidade?: string
          id?: string
          imobiliaria_id?: string
          imovel_id?: string
          proprietario_id?: string
          status?: string
          unidade?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "captacoes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captacoes_imobiliaria_id_imovel_id_fkey"
            columns: ["imobiliaria_id", "imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["imobiliaria_id", "id"]
          },
          {
            foreignKeyName: "captacoes_imobiliaria_id_proprietario_id_fkey"
            columns: ["imobiliaria_id", "proprietario_id"]
            isOneToOne: false
            referencedRelation: "proprietarios"
            referencedColumns: ["imobiliaria_id", "id"]
          },
        ]
      }
      chamados: {
        Row: {
          assunto: string
          autor_id: string
          categoria: string
          criado_em: string
          id: string
          imobiliaria_id: string
          mensagem: string
          respondido_em: string | null
          resposta: string | null
          status: string
        }
        Insert: {
          assunto: string
          autor_id: string
          categoria: string
          criado_em?: string
          id?: string
          imobiliaria_id: string
          mensagem: string
          respondido_em?: string | null
          resposta?: string | null
          status?: string
        }
        Update: {
          assunto?: string
          autor_id?: string
          categoria?: string
          criado_em?: string
          id?: string
          imobiliaria_id?: string
          mensagem?: string
          respondido_em?: string | null
          resposta?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      compromissos: {
        Row: {
          captacao_id: string | null
          criado_em: string
          dono_id: string
          fim: string
          id: string
          imobiliaria_id: string | null
          inicio: string
          lead_id: string | null
          local: string | null
          observacoes: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          captacao_id?: string | null
          criado_em?: string
          dono_id: string
          fim: string
          id?: string
          imobiliaria_id?: string | null
          inicio: string
          lead_id?: string | null
          local?: string | null
          observacoes?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          captacao_id?: string | null
          criado_em?: string
          dono_id?: string
          fim?: string
          id?: string
          imobiliaria_id?: string | null
          inicio?: string
          lead_id?: string | null
          local?: string | null
          observacoes?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_captacao_id_fkey"
            columns: ["captacao_id"]
            isOneToOne: false
            referencedRelation: "captacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          aceito_por: string | null
          criado_por: string | null
          email: string
          enviado_em: string
          id: string
          imobiliaria_id: string
          papel: string
          status: string
          token: string
        }
        Insert: {
          aceito_por?: string | null
          criado_por?: string | null
          email: string
          enviado_em?: string
          id?: string
          imobiliaria_id: string
          papel?: string
          status?: string
          token?: string
        }
        Update: {
          aceito_por?: string | null
          criado_por?: string | null
          email?: string
          enviado_em?: string
          id?: string
          imobiliaria_id?: string
          papel?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      erros_sistema: {
        Row: {
          id: string
          imobiliarias_afetadas: string[]
          local: string
          mensagem: string
          ocorrencias: number
          primeira_vez: string
          status: string
          ultima_vez: string
        }
        Insert: {
          id?: string
          imobiliarias_afetadas?: string[]
          local: string
          mensagem: string
          ocorrencias?: number
          primeira_vez?: string
          status?: string
          ultima_vez?: string
        }
        Update: {
          id?: string
          imobiliarias_afetadas?: string[]
          local?: string
          mensagem?: string
          ocorrencias?: number
          primeira_vez?: string
          status?: string
          ultima_vez?: string
        }
        Relationships: []
      }
      fechamentos_informados: {
        Row: {
          captacao_id: string
          corretor_id: string
          criado_em: string
          data: string
          id: string
          imobiliaria_id: string
          observacao: string | null
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          captacao_id: string
          corretor_id: string
          criado_em?: string
          data: string
          id?: string
          imobiliaria_id: string
          observacao?: string | null
          status?: string
          tipo: string
          valor: number
        }
        Update: {
          captacao_id?: string
          corretor_id?: string
          criado_em?: string
          data?: string
          id?: string
          imobiliaria_id?: string
          observacao?: string | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_informados_imobiliaria_id_captacao_id_fkey"
            columns: ["imobiliaria_id", "captacao_id"]
            isOneToOne: false
            referencedRelation: "captacoes"
            referencedColumns: ["imobiliaria_id", "id"]
          },
          {
            foreignKeyName: "fechamentos_informados_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      frankkia_admins: {
        Row: {
          criado_em: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          usuario_id?: string
        }
        Relationships: []
      }
      frankkia_emails_autorizados: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      imobiliarias: {
        Row: {
          cidade: string | null
          cliente_desde: string
          cnpj: string | null
          criado_em: string
          email: string | null
          id: string
          limite_corretores: number
          meta_mensal_vgv: number
          nome: string
          plano: string
          status: string
          telefone: string | null
          teste_ate: string | null
          teste_dias: number | null
          ultimo_acesso: string | null
        }
        Insert: {
          cidade?: string | null
          cliente_desde?: string
          cnpj?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          limite_corretores?: number
          meta_mensal_vgv?: number
          nome: string
          plano?: string
          status?: string
          telefone?: string | null
          teste_ate?: string | null
          teste_dias?: number | null
          ultimo_acesso?: string | null
        }
        Update: {
          cidade?: string | null
          cliente_desde?: string
          cnpj?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          limite_corretores?: number
          meta_mensal_vgv?: number
          nome?: string
          plano?: string
          status?: string
          telefone?: string | null
          teste_ate?: string | null
          teste_dias?: number | null
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imobiliarias_plano_fkey"
            columns: ["plano"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["nome"]
          },
        ]
      }
      imoveis: {
        Row: {
          bairro: string
          categoria: string
          cidade: string
          criado_em: string
          criado_por: string | null
          id: string
          imobiliaria_id: string
          logradouro: string
          nome: string | null
          numero: string
          uf: string
        }
        Insert: {
          bairro: string
          categoria: string
          cidade: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id: string
          logradouro: string
          nome?: string | null
          numero: string
          uf: string
        }
        Update: {
          bairro?: string
          categoria?: string
          cidade?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id?: string
          logradouro?: string
          nome?: string | null
          numero?: string
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      interessados: {
        Row: {
          atualizado_em: string | null
          criado_em: string
          email: string
          equipe: string | null
          id: string
          imobiliaria: string
          mensagem: string | null
          nome: string
          observacao: string | null
          origem: string
          status: string
          telefone: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string
          email: string
          equipe?: string | null
          id?: string
          imobiliaria: string
          mensagem?: string | null
          nome: string
          observacao?: string | null
          origem?: string
          status?: string
          telefone: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string
          email?: string
          equipe?: string | null
          id?: string
          imobiliaria?: string
          mensagem?: string | null
          nome?: string
          observacao?: string | null
          origem?: string
          status?: string
          telefone?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          checklist: boolean[]
          corretor_id: string
          criado_em: string
          etapa: string
          id: string
          imobiliaria_id: string
          interesse: string
          nome: string
          observacoes: string | null
          origem: string
          telefone: string
          visita_em: string | null
        }
        Insert: {
          checklist?: boolean[]
          corretor_id: string
          criado_em?: string
          etapa?: string
          id?: string
          imobiliaria_id: string
          interesse?: string
          nome: string
          observacoes?: string | null
          origem?: string
          telefone: string
          visita_em?: string | null
        }
        Update: {
          checklist?: boolean[]
          corretor_id?: string
          criado_em?: string
          etapa?: string
          id?: string
          imobiliaria_id?: string
          interesse?: string
          nome?: string
          observacoes?: string | null
          origem?: string
          telefone?: string
          visita_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      marca_logo: {
        Row: {
          altura: number | null
          arquivo_path: string
          enviado_em: string
          imobiliaria_id: string
          largura: number | null
          nome: string
          tamanho_bytes: number
          transparente: boolean | null
        }
        Insert: {
          altura?: number | null
          arquivo_path: string
          enviado_em?: string
          imobiliaria_id: string
          largura?: number | null
          nome: string
          tamanho_bytes?: number
          transparente?: boolean | null
        }
        Update: {
          altura?: number | null
          arquivo_path?: string
          enviado_em?: string
          imobiliaria_id?: string
          largura?: number | null
          nome?: string
          tamanho_bytes?: number
          transparente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marca_logo_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: true
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          imobiliaria_id: string
          meta_mensal_vgv: number | null
          papel: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          imobiliaria_id: string
          meta_mensal_vgv?: number | null
          papel: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          imobiliaria_id?: string
          meta_mensal_vgv?: number | null
          papel?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          creci: string | null
          criado_em: string
          empresa: string | null
          id: string
          imobiliaria_id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          creci?: string | null
          criado_em?: string
          empresa?: string | null
          id?: string
          imobiliaria_id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          creci?: string | null
          criado_em?: string
          empresa?: string | null
          id?: string
          imobiliaria_id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parceiros_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_upgrade: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          imobiliaria_id: string
          liberado: boolean
          liberado_em: string | null
          metodo: string | null
          pagamento: string
          pago_em: string | null
          plano_atual: string
          plano_novo: string
          referencia: string | null
          valor_mensal: number
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id: string
          liberado?: boolean
          liberado_em?: string | null
          metodo?: string | null
          pagamento?: string
          pago_em?: string | null
          plano_atual: string
          plano_novo: string
          referencia?: string | null
          valor_mensal: number
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id?: string
          liberado?: boolean
          liberado_em?: string | null
          metodo?: string | null
          pagamento?: string
          pago_em?: string | null
          plano_atual?: string
          plano_novo?: string
          referencia?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_upgrade_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_upgrade_plano_atual_fkey"
            columns: ["plano_atual"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["nome"]
          },
          {
            foreignKeyName: "pedidos_upgrade_plano_novo_fkey"
            columns: ["plano_novo"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["nome"]
          },
        ]
      }
      perfis: {
        Row: {
          aniversario: string | null
          creci: string | null
          creci_uf: string | null
          criado_em: string
          email: string
          estagiario: boolean
          id: string
          iniciais: string
          nome: string
          telefone: string | null
        }
        Insert: {
          aniversario?: string | null
          creci?: string | null
          creci_uf?: string | null
          criado_em?: string
          email?: string
          estagiario?: boolean
          id: string
          iniciais?: string
          nome?: string
          telefone?: string | null
        }
        Update: {
          aniversario?: string | null
          creci?: string | null
          creci_uf?: string | null
          criado_em?: string
          email?: string
          estagiario?: boolean
          id?: string
          iniciais?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      planos: {
        Row: {
          limite: number
          nome: string
          ordem: number
          preco: number
        }
        Insert: {
          limite: number
          nome: string
          ordem: number
          preco: number
        }
        Update: {
          limite?: number
          nome?: string
          ordem?: number
          preco?: number
        }
        Relationships: []
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida_em: string
          imobiliaria_id: string
          usuario_id: string
        }
        Insert: {
          aula_id: string
          concluida_em?: string
          imobiliaria_id: string
          usuario_id: string
        }
        Update: {
          aula_id?: string
          concluida_em?: string
          imobiliaria_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aulas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      proprietarios: {
        Row: {
          corretor_id: string
          criado_em: string
          id: string
          imobiliaria_id: string
          nome: string
          whatsapp: string
        }
        Insert: {
          corretor_id: string
          criado_em?: string
          id?: string
          imobiliaria_id: string
          nome: string
          whatsapp: string
        }
        Update: {
          corretor_id?: string
          criado_em?: string
          id?: string
          imobiliaria_id?: string
          nome?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "proprietarios_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      transacao_detalhes: {
        Row: {
          cliente: string | null
          honorarios_pct: number
          imobiliaria_id: string
          transacao_id: string
        }
        Insert: {
          cliente?: string | null
          honorarios_pct: number
          imobiliaria_id: string
          transacao_id: string
        }
        Update: {
          cliente?: string | null
          honorarios_pct?: number
          imobiliaria_id?: string
          transacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacao_detalhes_imobiliaria_id_transacao_id_fkey"
            columns: ["imobiliaria_id", "transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["imobiliaria_id", "id"]
          },
        ]
      }
      transacao_participantes: {
        Row: {
          corretor_id: string | null
          id: string
          imobiliaria_id: string
          parceiro_id: string | null
          pct: number
          tipo: string
          transacao_id: string
        }
        Insert: {
          corretor_id?: string | null
          id?: string
          imobiliaria_id: string
          parceiro_id?: string | null
          pct: number
          tipo: string
          transacao_id: string
        }
        Update: {
          corretor_id?: string | null
          id?: string
          imobiliaria_id?: string
          parceiro_id?: string | null
          pct?: number
          tipo?: string
          transacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacao_participantes_imobiliaria_id_parceiro_id_fkey"
            columns: ["imobiliaria_id", "parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["imobiliaria_id", "id"]
          },
          {
            foreignKeyName: "transacao_participantes_imobiliaria_id_transacao_id_fkey"
            columns: ["imobiliaria_id", "transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["imobiliaria_id", "id"]
          },
        ]
      }
      transacoes: {
        Row: {
          captacao_id: string
          criado_em: string
          data: string
          id: string
          imobiliaria_id: string
          registrado_por: string | null
          tipo: string
          valor: number
        }
        Insert: {
          captacao_id: string
          criado_em?: string
          data?: string
          id?: string
          imobiliaria_id: string
          registrado_por?: string | null
          tipo: string
          valor: number
        }
        Update: {
          captacao_id?: string
          criado_em?: string
          data?: string
          id?: string
          imobiliaria_id?: string
          registrado_por?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_imobiliaria_id_captacao_id_fkey"
            columns: ["imobiliaria_id", "captacao_id"]
            isOneToOne: false
            referencedRelation: "captacoes"
            referencedColumns: ["imobiliaria_id", "id"]
          },
          {
            foreignKeyName: "transacoes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      trilhas: {
        Row: {
          capa_hue: number
          criado_em: string
          id: string
          imobiliaria_id: string
          subtitulo: string
          titulo: string
        }
        Insert: {
          capa_hue?: number
          criado_em?: string
          id?: string
          imobiliaria_id: string
          subtitulo?: string
          titulo: string
        }
        Update: {
          capa_hue?: number
          criado_em?: string
          id?: string
          imobiliaria_id?: string
          subtitulo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilhas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_convite: {
        Args: {
          p_aniversario: string
          p_creci: string
          p_creci_uf: string
          p_estagiario: boolean
          p_nome: string
          p_telefone: string
          p_token: string
        }
        Returns: string
      }
      aplicar_upgrade: { Args: { p_pedido: string }; Returns: undefined }
      compartilha_imobiliaria: { Args: { p_usuario: string }; Returns: boolean }
      criar_imobiliaria: {
        Args: {
          p_admin_email: string
          p_cidade: string
          p_cnpj: string
          p_nome: string
          p_plano: string
          p_teste_dias?: number
        }
        Returns: {
          imobiliaria_id: string
          token: string
        }[]
      }
      estudo_mercado: {
        Args: { p_imob: string }
        Returns: {
          area_m2: number
          bairro: string
          captado_em: string
          categoria: string
          data: string
          imovel_nome: string
          logradouro: string
          numero: string
          tipo: string
          transacao_id: string
          unidade: string
          valor: number
        }[]
      }
      excluir_imobiliaria: {
        Args: { p_confirmacao: string; p_imob: string }
        Returns: undefined
      }
      imob_liberada: {
        Args: { p_status: string; p_teste_ate: string }
        Returns: boolean
      }
      is_admin: { Args: { p_imob: string }; Returns: boolean }
      is_admin_conta: { Args: { p_imob: string }; Returns: boolean }
      is_frankkia: { Args: never; Returns: boolean }
      is_member: { Args: { p_imob: string }; Returns: boolean }
      is_membro_ativo: {
        Args: { p_imob: string; p_usuario: string }
        Returns: boolean
      }
      liberar_upgrade: { Args: { p_pedido: string }; Returns: undefined }
      minhas_participacoes: {
        Args: { p_imob: string }
        Returns: {
          soma_pct: number
          transacao_id: string
        }[]
      }
      ofertas_mercado: {
        Args: { p_imob: string }
        Returns: {
          area_m2: number
          bairro: string
          categoria: string
          finalidade: string
          valor: number
        }[]
      }
      painel_imobiliarias: {
        Args: never
        Returns: {
          admin_email: string
          admin_nome: string
          cidade: string
          cliente_desde: string
          cnpj: string
          id: string
          nome: string
          plano: string
          status: string
          teste_ate: string
          teste_dias: number
          ultimo_acesso: string
          uso_academy: number
          uso_marketing: number
          uso_negocios: number
          uso_performance: number
          vagas: number
        }[]
      }
      pasta_imobiliaria: { Args: { p_nome: string }; Returns: string }
      pertence: { Args: { p_imob: string }; Returns: boolean }
      ranking_mes: {
        Args: { p_imob: string; p_mes: string }
        Returns: {
          alugados: number
          atendidos: number
          captados: number
          corretor_id: string
          iniciais: string
          nome: string
          vgc: number
          vgv: number
        }[]
      }
      registrar_erro: {
        Args: { p_local: string; p_mensagem: string }
        Returns: undefined
      }
      registrar_transacao: {
        Args: {
          p_captacao: string
          p_cliente: string
          p_data: string
          p_fechamento?: string
          p_honorarios: number
          p_participantes: Json
          p_valor: number
        }
        Returns: string
      }
      vagas_em_uso: { Args: { p_imob: string }; Returns: number }
      validar_demo: { Args: { p_token: string }; Returns: string }
      ver_convite: {
        Args: { p_token: string }
        Returns: {
          email: string
          imobiliaria: string
          papel: string
        }[]
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
