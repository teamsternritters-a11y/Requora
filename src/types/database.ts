export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'customer' | 'provider'
export type RequirementStatus = 'open' | 'closed' | 'completed' | 'cancelled'
export type OfferStatus = 'pending' | 'shortlisted' | 'selected' | 'rejected'
export type NotificationType =
  | 'new_offer' | 'shortlisted' | 'selected' | 'closed' | 'new_requirement' | 'offer_rejected'
  | 'payment_received' | 'order_created' | 'delivery_submitted' | 'delivery_approved'
  | 'delivery_revision_requested' | 'order_completed' | 'refund_issued' | 'dispute_raised'

// v2 enums
export type OrderStatus =
  | 'pending' | 'paid' | 'escrowed' | 'in_progress' | 'delivered'
  | 'revision_requested' | 'approved' | 'completed' | 'cancelled' | 'refunded' | 'disputed'
export type PaymentMethod = 'upi' | 'card' | 'net_banking' | 'wallet' | 'demo'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type EscrowStatus = 'held' | 'released' | 'refunded'
export type DeliveryType = 'digital' | 'physical'
export type PhysicalDeliveryStatus = 'packed' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered'
export type DeliveryReviewStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected'
export type TransactionType = 'payment' | 'escrow_hold' | 'escrow_release' | 'refund' | 'fee'
export type DisputeStatus = 'open' | 'resolved' | 'escalated'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          bio: string | null
          location: string | null
          website: string | null
          rating: number
          review_count: number
          skills: string[]
          years_experience: number | null
          portfolio_urls: string[]
          projects_completed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role: UserRole
          bio?: string | null
          location?: string | null
          website?: string | null
          rating?: number
          review_count?: number
          skills?: string[]
          years_experience?: number | null
          portfolio_urls?: string[]
          projects_completed?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string
          description: string | null
          parent_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      requirements: {
        Row: {
          id: string
          customer_id: string
          category_id: string
          title: string
          description: string
          requirement_type: string
          budget_min: number
          budget_max: number
          deadline: string
          preferences: Json
          reference_files: string[]
          status: RequirementStatus
          offer_count: number
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          category_id: string
          title: string
          description: string
          requirement_type: string
          budget_min: number
          budget_max: number
          deadline: string
          preferences?: Json
          reference_files?: string[]
          status?: RequirementStatus
          offer_count?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['requirements']['Insert']>
      }
      offers: {
        Row: {
          id: string
          requirement_id: string
          provider_id: string
          price: number
          delivery_days: number
          proposal: string
          portfolio_urls: string[]
          status: OfferStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          provider_id: string
          price: number
          delivery_days: number
          proposal: string
          portfolio_urls?: string[]
          status?: OfferStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }
      offer_scores: {
        Row: {
          id: string
          offer_id: string
          budget_score: number
          delivery_score: number
          relevance_score: number
          total_score: number
          explanation: Json
          calculated_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          budget_score: number
          delivery_score: number
          relevance_score: number
          total_score: number
          explanation?: Json
          calculated_at?: string
        }
        Update: Partial<Database['public']['Tables']['offer_scores']['Insert']>
      }
      shortlists: {
        Row: {
          id: string
          requirement_id: string
          offer_id: string
          customer_id: string
          created_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          offer_id: string
          customer_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['shortlists']['Insert']>
      }
      selections: {
        Row: {
          id: string
          requirement_id: string
          offer_id: string
          customer_id: string
          provider_id: string
          created_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          offer_id: string
          customer_id: string
          provider_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['selections']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          requirement_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Convenience types with joins
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Requirement = Database['public']['Tables']['requirements']['Row']
export type Offer = Database['public']['Tables']['offers']['Row']
export type OfferScore = Database['public']['Tables']['offer_scores']['Row']
export type Shortlist = Database['public']['Tables']['shortlists']['Row']
export type Selection = Database['public']['Tables']['selections']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type RequirementWithDetails = Requirement & {
  profiles: Profile
  categories: Category
  offers?: OfferWithDetails[]
}

export type OfferWithDetails = Offer & {
  profiles: Profile
  offer_scores?: OfferScore | null
  shortlists?: Shortlist[]
  selections?: Selection[]
}

// ─── v2 Table Row Types ──────────────────────────────────────

export interface Order {
  id: string
  selection_id: string
  requirement_id: string
  offer_id: string
  customer_id: string
  provider_id: string
  amount: number
  platform_fee: number
  status: OrderStatus
  requirement_type: DeliveryType
  notes: string | null
  // Delivery contact
  delivery_contact_name: string | null
  delivery_contact_email: string | null
  delivery_contact_phone: string | null
  // Physical address
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_pincode: string | null
  delivery_instructions: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  customer_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transaction_ref: string | null
  paid_at: string | null
  created_at: string
}

export interface EscrowRecord {
  id: string
  order_id: string
  amount: number
  status: EscrowStatus
  held_at: string
  released_at: string | null
  released_to: string | null
}

export interface Delivery {
  id: string
  order_id: string
  provider_id: string
  type: DeliveryType
  files: string[]
  drive_link: string | null
  github_link: string | null
  extra_links: string[]
  notes: string | null
  courier: string | null
  tracking_number: string | null
  shipment_date: string | null
  estimated_arrival: string | null
  physical_status: PhysicalDeliveryStatus | null
  status: DeliveryReviewStatus
  revision_notes: string | null
  submitted_at: string
  reviewed_at: string | null
}

export interface Transaction {
  id: string
  order_id: string
  type: TransactionType
  from_user: string | null
  to_user: string | null
  amount: number
  description: string | null
  created_at: string
}

export interface OrderEvent {
  id: string
  order_id: string
  actor_id: string | null
  event_type: string
  description: string | null
  data: Json
  created_at: string
}

export interface Dispute {
  id: string
  order_id: string
  raised_by: string
  reason: string
  status: DisputeStatus
  resolution: string | null
  created_at: string
  resolved_at: string | null
}

// ─── v2 Joined Types ─────────────────────────────────────────

export type OrderWithDetails = Order & {
  requirements?: Requirement & { categories?: Category }
  offers?: Offer
  customer?: Profile
  provider?: Profile
  payments?: Payment[]
  escrow_records?: EscrowRecord[]
  deliveries?: Delivery[]
  transactions?: Transaction[]
  order_events?: OrderEvent[]
  disputes?: Dispute[]
}
