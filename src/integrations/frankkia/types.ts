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
      anuncio_fotos: {
        Row: {
          altura: number | null
          captacao_id: string
          chave: string
          criado_em: string
          id: string
          imobiliaria_id: string
          largura: number | null
          ordem: number
          tamanho_bytes: number | null
          url: string
          url_jpg: string | null
        }
        Insert: {
          altura?: number | null
          captacao_id: string
          chave: string
          criado_em?: string
          id?: string
          imobiliaria_id: string
          largura?: number | null
          ordem?: number
          tamanho_bytes?: number | null
          url: string
          url_jpg?: string | null
        }
        Update: {
          altura?: number | null
          captacao_id?: string
          chave?: string
          criado_em?: string
          id?: string
          imobiliaria_id?: string
          largura?: number | null
          ordem?: number
          tamanho_bytes?: number | null
          url?: string
          url_jpg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anuncio_fotos_captacao_id_fkey"
            columns: ["captacao_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["captacao_id"]
          },
          {
            foreignKeyName: "anuncio_fotos_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      anuncios: {
        Row: {
          atualizado_em: string
          banheiros: number | null
          captacao_id: string
          caracteristicas: string[]
          condominio: number | null
          descricao: string
          imobiliaria_id: string
          iptu: number | null
          portais: boolean
          portais_destaque: string
          publicado: boolean
          publicado_em: string | null
          quartos: number | null
          slug: string | null
          suites: number | null
          titulo: string
          vagas: number | null
        }
        Insert: {
          atualizado_em?: string
          banheiros?: number | null
          captacao_id: string
          caracteristicas?: string[]
          condominio?: number | null
          descricao?: string
          imobiliaria_id: string
          iptu?: number | null
          portais?: boolean
          portais_destaque?: string
          publicado?: boolean
          publicado_em?: string | null
          quartos?: number | null
          slug?: string | null
          suites?: number | null
          titulo?: string
          vagas?: number | null
        }
        Update: {
          atualizado_em?: string
          banheiros?: number | null
          captacao_id?: string
          caracteristicas?: string[]
          condominio?: number | null
          descricao?: string
          imobiliaria_id?: string
          iptu?: number | null
          portais?: boolean
          portais_destaque?: string
          publicado?: boolean
          publicado_em?: string | null
          quartos?: number | null
          slug?: string | null
          suites?: number | null
          titulo?: string
          vagas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_captacao_id_fkey"
            columns: ["captacao_id"]
            isOneToOne: true
            referencedRelation: "captacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anuncios_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_stripe: {
        Row: {
          assinatura: string
          atualizado_em: string
          cancela_em: string | null
          ciclo: string
          cliente: string
          imobiliaria_id: string
          proxima_cobranca: string | null
          situacao: string
        }
        Insert: {
          assinatura: string
          atualizado_em?: string
          cancela_em?: string | null
          ciclo?: string
          cliente: string
          imobiliaria_id: string
          proxima_cobranca?: string | null
          situacao?: string
        }
        Update: {
          assinatura?: string
          atualizado_em?: string
          cancela_em?: string | null
          ciclo?: string
          cliente?: string
          imobiliaria_id?: string
          proxima_cobranca?: string | null
          situacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_stripe_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: true
            referencedRelation: "imobiliarias"
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
      avaliacao_amostras: {
        Row: {
          ano_construcao: number | null
          area_m2: number
          avaliacao_id: string
          bairro: string | null
          banheiros: number | null
          criado_em: string
          endereco: string | null
          foto_url: string | null
          id: string
          infraestrutura: string | null
          origem: string
          portal: string | null
          portaria: string | null
          quartos: number | null
          suites: number | null
          titulo: string | null
          url: string | null
          usar: boolean
          vagas: number | null
          valor: number
        }
        Insert: {
          ano_construcao?: number | null
          area_m2: number
          avaliacao_id: string
          bairro?: string | null
          banheiros?: number | null
          criado_em?: string
          endereco?: string | null
          foto_url?: string | null
          id?: string
          infraestrutura?: string | null
          origem?: string
          portal?: string | null
          portaria?: string | null
          quartos?: number | null
          suites?: number | null
          titulo?: string | null
          url?: string | null
          usar?: boolean
          vagas?: number | null
          valor: number
        }
        Update: {
          ano_construcao?: number | null
          area_m2?: number
          avaliacao_id?: string
          bairro?: string | null
          banheiros?: number | null
          criado_em?: string
          endereco?: string | null
          foto_url?: string | null
          id?: string
          infraestrutura?: string | null
          origem?: string
          portal?: string | null
          portaria?: string | null
          quartos?: number | null
          suites?: number | null
          titulo?: string | null
          url?: string | null
          usar?: boolean
          vagas?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_amostras_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacao_notas: {
        Row: {
          autor_id: string
          avaliacao_id: string
          compromisso_id: string | null
          criado_em: string
          id: string
          lembrete_em: string | null
          texto: string
        }
        Insert: {
          autor_id?: string
          avaliacao_id: string
          compromisso_id?: string | null
          criado_em?: string
          id?: string
          lembrete_em?: string | null
          texto: string
        }
        Update: {
          autor_id?: string
          avaliacao_id?: string
          compromisso_id?: string | null
          criado_em?: string
          id?: string
          lembrete_em?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_notas_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacao_precos: {
        Row: {
          avaliacao_id: string
          criado_em: string
          id: string
          valor: number
        }
        Insert: {
          avaliacao_id: string
          criado_em?: string
          id?: string
          valor: number
        }
        Update: {
          avaliacao_id?: string
          criado_em?: string
          id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_precos_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          ajuste_improvavel: number
          ajuste_mercado: number
          ajuste_urgencia: number
          ano_construcao: number | null
          apresentado: boolean
          area_m2: number
          area_terreno: number | null
          atualizado_em: string
          bairro: string | null
          banheiros: number | null
          captacao_id: string | null
          categoria: string
          cep: string | null
          cidade: string | null
          complemento: string | null
          conservacao: string | null
          corretor_id: string
          criado_em: string
          data_visita: string | null
          em_condominio: boolean | null
          exclusividade: boolean
          expirado: boolean
          finalidade: string
          foto_url: string | null
          id: string
          imobiliaria_id: string
          infraestrutura: string | null
          lat: number | null
          link_liberado: boolean
          lng: number | null
          logradouro: string | null
          mobilia: string | null
          mostrar_improvavel: boolean
          mostrar_mercado: boolean
          mostrar_urgencia: boolean
          numero: string | null
          observacoes: string | null
          orientacao_solar: string | null
          portaria: string | null
          proprietario_id: string | null
          quartos: number | null
          suites: number | null
          titulo: string
          token: string
          uf: string | null
          usar_variaveis: boolean
          vagas: number | null
          valor_anunciado: number | null
          vendido: boolean
        }
        Insert: {
          ajuste_improvavel?: number
          ajuste_mercado?: number
          ajuste_urgencia?: number
          ano_construcao?: number | null
          apresentado?: boolean
          area_m2: number
          area_terreno?: number | null
          atualizado_em?: string
          bairro?: string | null
          banheiros?: number | null
          captacao_id?: string | null
          categoria: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conservacao?: string | null
          corretor_id?: string
          criado_em?: string
          data_visita?: string | null
          em_condominio?: boolean | null
          exclusividade?: boolean
          expirado?: boolean
          finalidade: string
          foto_url?: string | null
          id?: string
          imobiliaria_id: string
          infraestrutura?: string | null
          lat?: number | null
          link_liberado?: boolean
          lng?: number | null
          logradouro?: string | null
          mobilia?: string | null
          mostrar_improvavel?: boolean
          mostrar_mercado?: boolean
          mostrar_urgencia?: boolean
          numero?: string | null
          observacoes?: string | null
          orientacao_solar?: string | null
          portaria?: string | null
          proprietario_id?: string | null
          quartos?: number | null
          suites?: number | null
          titulo: string
          token?: string
          uf?: string | null
          usar_variaveis?: boolean
          vagas?: number | null
          valor_anunciado?: number | null
          vendido?: boolean
        }
        Update: {
          ajuste_improvavel?: number
          ajuste_mercado?: number
          ajuste_urgencia?: number
          ano_construcao?: number | null
          apresentado?: boolean
          area_m2?: number
          area_terreno?: number | null
          atualizado_em?: string
          bairro?: string | null
          banheiros?: number | null
          captacao_id?: string | null
          categoria?: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conservacao?: string | null
          corretor_id?: string
          criado_em?: string
          data_visita?: string | null
          em_condominio?: boolean | null
          exclusividade?: boolean
          expirado?: boolean
          finalidade?: string
          foto_url?: string | null
          id?: string
          imobiliaria_id?: string
          infraestrutura?: string | null
          lat?: number | null
          link_liberado?: boolean
          lng?: number | null
          logradouro?: string | null
          mobilia?: string | null
          mostrar_improvavel?: boolean
          mostrar_mercado?: boolean
          mostrar_urgencia?: boolean
          numero?: string | null
          observacoes?: string | null
          orientacao_solar?: string | null
          portaria?: string | null
          proprietario_id?: string | null
          quartos?: number | null
          suites?: number | null
          titulo?: string
          token?: string
          uf?: string | null
          usar_variaveis?: boolean
          vagas?: number | null
          valor_anunciado?: number | null
          vendido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos_email: {
        Row: {
          chave: string
          criado_em: string
          dados: Json
          enviado_em: string | null
          erro: string | null
          id: string
          imobiliaria_id: string | null
          para: string
          tentativas: number
          tipo: string
        }
        Insert: {
          chave: string
          criado_em?: string
          dados?: Json
          enviado_em?: string | null
          erro?: string | null
          id?: string
          imobiliaria_id?: string | null
          para: string
          tentativas?: number
          tipo: string
        }
        Update: {
          chave?: string
          criado_em?: string
          dados?: Json
          enviado_em?: string | null
          erro?: string | null
          id?: string
          imobiliaria_id?: string | null
          para?: string
          tentativas?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_email_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
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
          codigo: string
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
          codigo?: string
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
          codigo?: string
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
          google_atualizado: string | null
          google_evento_id: string | null
          id: string
          imobiliaria_id: string | null
          inicio: string
          lead_id: string | null
          local: string | null
          local_lat: number | null
          local_lng: number | null
          observacoes: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          captacao_id?: string | null
          criado_em?: string
          dono_id: string
          fim: string
          google_atualizado?: string | null
          google_evento_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          inicio: string
          lead_id?: string | null
          local?: string | null
          local_lat?: number | null
          local_lng?: number | null
          observacoes?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          captacao_id?: string | null
          criado_em?: string
          dono_id?: string
          fim?: string
          google_atualizado?: string | null
          google_evento_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          inicio?: string
          lead_id?: string | null
          local?: string | null
          local_lat?: number | null
          local_lng?: number | null
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
      config_cadastro: {
        Row: {
          aberto: boolean
          id: boolean
          limite_dia: number
          teste_dias: number
        }
        Insert: {
          aberto?: boolean
          id?: boolean
          limite_dia?: number
          teste_dias?: number
        }
        Update: {
          aberto?: boolean
          id?: boolean
          limite_dia?: number
          teste_dias?: number
        }
        Relationships: []
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
      documentos: {
        Row: {
          caminho: string
          corretor_id: string
          criado_em: string
          enviado_por: string | null
          id: string
          imobiliaria_id: string
          mime: string | null
          nome: string
          ref_id: string
          tamanho: number
          tipo: string
        }
        Insert: {
          caminho: string
          corretor_id: string
          criado_em?: string
          enviado_por?: string | null
          id?: string
          imobiliaria_id: string
          mime?: string | null
          nome: string
          ref_id: string
          tamanho?: number
          tipo: string
        }
        Update: {
          caminho?: string
          corretor_id?: string
          criado_em?: string
          enviado_por?: string | null
          id?: string
          imobiliaria_id?: string
          mime?: string | null
          nome?: string
          ref_id?: string
          tamanho?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_imobiliaria_id_fkey"
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
      feeds_portais: {
        Row: {
          criado_em: string
          imobiliaria_id: string
          token: string
        }
        Insert: {
          criado_em?: string
          imobiliaria_id: string
          token?: string
        }
        Update: {
          criado_em?: string
          imobiliaria_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_portais_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: true
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
      google_conexoes: {
        Row: {
          conectado_em: string
          email: string
          refresh_token: string
          usuario_id: string
        }
        Insert: {
          conectado_em?: string
          email: string
          refresh_token: string
          usuario_id: string
        }
        Update: {
          conectado_em?: string
          email?: string
          refresh_token?: string
          usuario_id?: string
        }
        Relationships: []
      }
      google_oauth_estados: {
        Row: {
          criado_em: string
          estado: string
          origem: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          estado: string
          origem: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          estado?: string
          origem?: string
          usuario_id?: string
        }
        Relationships: []
      }
      google_sync_fila: {
        Row: {
          acao: string
          compromisso_id: string
          criado_em: string
          erro: string | null
          evento_id: string | null
          tentativas: number
          usuario_id: string
        }
        Insert: {
          acao: string
          compromisso_id: string
          criado_em?: string
          erro?: string | null
          evento_id?: string | null
          tentativas?: number
          usuario_id: string
        }
        Update: {
          acao?: string
          compromisso_id?: string
          criado_em?: string
          erro?: string | null
          evento_id?: string | null
          tentativas?: number
          usuario_id?: string
        }
        Relationships: []
      }
      imobiliarias: {
        Row: {
          cidade: string | null
          cliente_desde: string
          cnpj: string | null
          creci_j: string | null
          criado_em: string
          email: string | null
          id: string
          limite_corretores: number
          meta_mensal_vgv: number
          mostrar_corretor_vendidos: boolean
          nome: string
          plano: string
          rodizio_ativo: boolean
          rodizio_fora: string[]
          rodizio_minutos: number | null
          slug: string | null
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
          creci_j?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          limite_corretores?: number
          meta_mensal_vgv?: number
          mostrar_corretor_vendidos?: boolean
          nome: string
          plano?: string
          rodizio_ativo?: boolean
          rodizio_fora?: string[]
          rodizio_minutos?: number | null
          slug?: string | null
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
          creci_j?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          limite_corretores?: number
          meta_mensal_vgv?: number
          mostrar_corretor_vendidos?: boolean
          nome?: string
          plano?: string
          rodizio_ativo?: boolean
          rodizio_fora?: string[]
          rodizio_minutos?: number | null
          slug?: string | null
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
          cep: string | null
          cidade: string
          criado_em: string
          criado_por: string | null
          id: string
          imobiliaria_id: string
          lat: number | null
          lng: number | null
          logradouro: string
          nome: string | null
          numero: string
          uf: string
        }
        Insert: {
          bairro: string
          categoria: string
          cep?: string | null
          cidade: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id: string
          lat?: number | null
          lng?: number | null
          logradouro: string
          nome?: string | null
          numero: string
          uf: string
        }
        Update: {
          bairro?: string
          categoria?: string
          cep?: string | null
          cidade?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          imobiliaria_id?: string
          lat?: number | null
          lng?: number | null
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
          atribuido_em: string | null
          checklist: boolean[]
          corretor_id: string
          criado_em: string
          criado_por: string | null
          etapa: string
          id: string
          imobiliaria_id: string
          interesse: string
          nome: string
          observacoes: string | null
          origem: string
          passou_por: string[]
          rodizio: boolean
          telefone: string
          ultimo_contato: string | null
          visita_em: string | null
          voltou_ao_admin: boolean
        }
        Insert: {
          atribuido_em?: string | null
          checklist?: boolean[]
          corretor_id: string
          criado_em?: string
          criado_por?: string | null
          etapa?: string
          id?: string
          imobiliaria_id: string
          interesse?: string
          nome: string
          observacoes?: string | null
          origem?: string
          passou_por?: string[]
          rodizio?: boolean
          telefone: string
          ultimo_contato?: string | null
          visita_em?: string | null
          voltou_ao_admin?: boolean
        }
        Update: {
          atribuido_em?: string | null
          checklist?: boolean[]
          corretor_id?: string
          criado_em?: string
          criado_por?: string | null
          etapa?: string
          id?: string
          imobiliaria_id?: string
          interesse?: string
          nome?: string
          observacoes?: string | null
          origem?: string
          passou_por?: string[]
          rodizio?: boolean
          telefone?: string
          ultimo_contato?: string | null
          visita_em?: string | null
          voltou_ao_admin?: boolean
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
          foto_url: string | null
          id: string
          imobiliaria_id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          creci?: string | null
          criado_em?: string
          empresa?: string | null
          foto_url?: string | null
          id?: string
          imobiliaria_id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          creci?: string | null
          criado_em?: string
          empresa?: string | null
          foto_url?: string | null
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
          ciclo: string
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
          tipo: string
          valor_mensal: number
        }
        Insert: {
          ciclo?: string
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
          tipo?: string
          valor_mensal: number
        }
        Update: {
          ciclo?: string
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
          tipo?: string
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
          bio: string | null
          creci: string | null
          creci_conferido_em: string | null
          creci_obs: string | null
          creci_status: string
          creci_uf: string | null
          criado_em: string
          email: string
          estagiario: boolean
          foto_url: string | null
          id: string
          iniciais: string
          nome: string
          redes: Json
          slug: string | null
          telefone: string | null
        }
        Insert: {
          aniversario?: string | null
          bio?: string | null
          creci?: string | null
          creci_conferido_em?: string | null
          creci_obs?: string | null
          creci_status?: string
          creci_uf?: string | null
          criado_em?: string
          email?: string
          estagiario?: boolean
          foto_url?: string | null
          id: string
          iniciais?: string
          nome?: string
          redes?: Json
          slug?: string | null
          telefone?: string | null
        }
        Update: {
          aniversario?: string | null
          bio?: string | null
          creci?: string | null
          creci_conferido_em?: string | null
          creci_obs?: string | null
          creci_status?: string
          creci_uf?: string | null
          criado_em?: string
          email?: string
          estagiario?: boolean
          foto_url?: string | null
          id?: string
          iniciais?: string
          nome?: string
          redes?: Json
          slug?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      planos: {
        Row: {
          anuncios: number
          limite: number
          nome: string
          ordem: number
          preco: number
          solo: boolean
        }
        Insert: {
          anuncios?: number
          limite: number
          nome: string
          ordem: number
          preco: number
          solo?: boolean
        }
        Update: {
          anuncios?: number
          limite?: number
          nome?: string
          ordem?: number
          preco?: number
          solo?: boolean
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
      testes_gratis: {
        Row: {
          creci: string | null
          criado_em: string
          email: string
          id: string
          imobiliaria_id: string | null
          telefone: string
        }
        Insert: {
          creci?: string | null
          criado_em?: string
          email: string
          id?: string
          imobiliaria_id?: string | null
          telefone: string
        }
        Update: {
          creci?: string | null
          criado_em?: string
          email?: string
          id?: string
          imobiliaria_id?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "testes_gratis_imobiliaria_id_fkey"
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
      vendas_externas: {
        Row: {
          area_m2: number
          bairro: string
          categoria: string
          cidade: string
          corretor_id: string
          criado_em: string
          data_venda: string
          dias_para_vender: number | null
          finalidade: string
          id: string
          imobiliaria_id: string
          logradouro: string | null
          quartos: number | null
          uf: string | null
          vagas: number | null
          valor_anunciado: number | null
          valor_venda: number
        }
        Insert: {
          area_m2: number
          bairro: string
          categoria: string
          cidade: string
          corretor_id?: string
          criado_em?: string
          data_venda: string
          dias_para_vender?: number | null
          finalidade?: string
          id?: string
          imobiliaria_id: string
          logradouro?: string | null
          quartos?: number | null
          uf?: string | null
          vagas?: number | null
          valor_anunciado?: number | null
          valor_venda: number
        }
        Update: {
          area_m2?: number
          bairro?: string
          categoria?: string
          cidade?: string
          corretor_id?: string
          criado_em?: string
          data_venda?: string
          dias_para_vender?: number | null
          finalidade?: string
          id?: string
          imobiliaria_id?: string
          logradouro?: string | null
          quartos?: number | null
          uf?: string | null
          vagas?: number | null
          valor_anunciado?: number | null
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_externas_imobiliaria_id_fkey"
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
      _fila_rodizio: { Args: { p_imob: string }; Returns: string[] }
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
      agendar_avisos_teste: { Args: never; Returns: undefined }
      aplicar_mudanca_google: {
        Args: {
          p_atualizado: string
          p_compromisso: string
          p_excluir: boolean
          p_fim: string
          p_inicio: string
          p_local: string
          p_titulo: string
        }
        Returns: undefined
      }
      aplicar_reducao: { Args: { p_pedido: string }; Returns: undefined }
      aplicar_upgrade: { Args: { p_pedido: string }; Returns: undefined }
      compartilha_imobiliaria: { Args: { p_usuario: string }; Returns: boolean }
      conferir_creci: {
        Args: { p_obs?: string; p_status: string; p_usuario: string }
        Returns: undefined
      }
      configurar_rodizio: {
        Args: {
          p_ativo: boolean
          p_fora: string[]
          p_imob: string
          p_minutos: number
        }
        Returns: undefined
      }
      criar_conta_teste: {
        Args: {
          p_cidade: string
          p_creci: string
          p_creci_uf: string
          p_imobiliaria: string
          p_nome: string
          p_plano: string
          p_telefone: string
        }
        Returns: string
      }
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
      documento_valido: {
        Args: {
          p_caminho: string
          p_corretor: string
          p_imob: string
          p_ref: string
          p_tipo: string
        }
        Returns: boolean
      }
      enfileirar_aviso: {
        Args: {
          p_chave: string
          p_dados?: Json
          p_imob: string
          p_tipo: string
        }
        Returns: undefined
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
      estudo_publico: { Args: { p_token: string }; Returns: Json }
      excluir_imobiliaria: {
        Args: { p_confirmacao: string; p_imob: string }
        Returns: undefined
      }
      excluir_transacao: { Args: { p_id: string }; Returns: undefined }
      feed_portais: { Args: { p_token: string }; Returns: Json }
      fila_rodizio: { Args: { p_imob: string }; Returns: string[] }
      gerar_codigo_imovel: { Args: never; Returns: string }
      google_enfileirar_futuros: {
        Args: { p_usuario: string }
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
      link_portais: {
        Args: { p_imob: string; p_novo?: boolean }
        Returns: string
      }
      minha_assinatura: {
        Args: { p_imob: string }
        Returns: {
          cancela_em: string
          ciclo: string
          proxima_cobranca: string
          situacao: string
        }[]
      }
      minha_conexao_google: {
        Args: never
        Returns: {
          conectado_em: string
          email: string
        }[]
      }
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
      painel_corretores: {
        Args: never
        Returns: {
          ativo: boolean
          desde: string
          email: string
          imobiliaria: string
          imobiliaria_id: string
          nome: string
          papel: string
          plano: string
          usuario_id: string
        }[]
      }
      painel_creci: {
        Args: never
        Returns: {
          conferido_em: string
          creci: string
          creci_uf: string
          desde: string
          email: string
          imobiliaria: string
          nome: string
          obs: string
          plano: string
          status: string
          usuario_id: string
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
      pedir_reativacao: {
        Args: { p_motivo: string; p_usuario: string }
        Returns: string
      }
      pertence: { Args: { p_imob: string }; Returns: boolean }
      pode_editar_captacao: { Args: { p_captacao: string }; Returns: boolean }
      pode_mexer_avaliacao: { Args: { p_avaliacao: string }; Returns: boolean }
      pode_mexer_avatar: { Args: { p_nome: string }; Returns: boolean }
      portal_anuncio: { Args: { p_slug: string }; Returns: Json }
      portal_busca: { Args: never; Returns: Json }
      portal_cartao_corretor: { Args: { p_corretor: string }; Returns: Json }
      portal_cartoes: {
        Args: { p_corretor: string; p_imob: string }
        Returns: Json
      }
      portal_contato: {
        Args: {
          p_email: string
          p_mensagem: string
          p_nome: string
          p_slug: string
          p_telefone: string
        }
        Returns: boolean
      }
      portal_corretor: { Args: { p_slug: string }; Returns: Json }
      portal_imobiliaria: { Args: { p_slug: string }; Returns: Json }
      portal_logo: { Args: { p_imob: string }; Returns: string }
      portal_relacionados: { Args: { p_slug: string }; Returns: Json }
      portal_vitrine: { Args: never; Returns: Json }
      publicar_anuncio: {
        Args: { p_captacao: string; p_publicar: boolean }
        Returns: string
      }
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
      reativar_corretor: {
        Args: { p_imob: string; p_usuario: string }
        Returns: undefined
      }
      redes_validas: { Args: { r: Json }; Returns: boolean }
      registrar_assinatura: {
        Args: {
          p_assinatura: string
          p_cancela: string
          p_proxima: string
          p_situacao: string
        }
        Returns: undefined
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
      rodizio_repassar: { Args: never; Returns: number }
      slugificar: { Args: { p: string }; Returns: string }
      solicitar_reducao: { Args: { p_plano: string }; Returns: string }
      tem_assinatura: { Args: { p_imob: string }; Returns: boolean }
      uso_supabase: {
        Args: never
        Returns: {
          arquivos_bytes: number
          arquivos_qtd: number
          banco_bytes: number
          contas: number
        }[]
      }
      vagas_em_uso: { Args: { p_imob: string }; Returns: number }
      validar_demo: { Args: { p_token: string }; Returns: string }
      vendidos_regiao: {
        Args: {
          p_bairro?: string
          p_categoria?: string
          p_cidade?: string
          p_finalidade?: string
          p_meses?: number
        }
        Returns: {
          area: number
          bairro: string
          categoria: string
          cidade: string
          corretor: string
          data_venda: string
          dias: number
          foto: string
          id: string
          imobiliaria: string
          logradouro: string
          origem: string
          quartos: number
          uf: string
          vagas: number
          valor_anunciado: number
          valor_venda: number
        }[]
      }
      ver_convite: {
        Args: { p_token: string }
        Returns: {
          email: string
          imobiliaria: string
          papel: string
          solo: boolean
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
