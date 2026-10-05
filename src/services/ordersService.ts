import { supabase } from '../lib/supabase'
import type {
  Order, OrderWithDetails, Payment, PaymentMethod,
  Delivery, DeliveryType
} from '../types/database'

// ─── Helpers ─────────────────────────────────────────────────

function generateTxnRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TXN-${new Date().getFullYear()}-${rand}`
}

async function logEvent(orderId: string, actorId: string | null, eventType: string, description: string, data: object = {}) {
  const { error } = await supabase.from('order_events').insert({
    order_id: orderId,
    actor_id: actorId,
    event_type: eventType,
    description,
    data,
  } as any)
  if (error) throw error
}

// ─── Orders Service ───────────────────────────────────────────

export const ordersService = {

  /** Called immediately after a selection is created */
  async createOrder(params: {
    selectionId: string
    requirementId: string
    offerId: string
    customerId: string
    providerId: string
    amount: number
    requirementType: DeliveryType
    notes?: string
  }): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        selection_id: params.selectionId,
        requirement_id: params.requirementId,
        offer_id: params.offerId,
        customer_id: params.customerId,
        provider_id: params.providerId,
        amount: params.amount,
        requirement_type: params.requirementType,
        notes: params.notes ?? null,
        status: 'pending',
      } as any)
      .select()
      .single()
    if (error) throw error

    const order = data as Order

    // Log the creation event
    await logEvent(order.id, params.customerId, 'created', 'Order created after provider selection.')

    // Notify provider
    await supabase.from('notifications').insert({
      user_id: params.providerId,
      type: 'order_created',
      title: 'New Order Created!',
      message: 'A new order has been placed for your offer. Awaiting payment.',
      data: { order_id: order.id, requirement_id: params.requirementId },
    } as any)

    return order
  },

  /** Simulate payment — creates payment + escrow record, advances order to in_progress */
  async submitPayment(params: {
    orderId: string
    customerId: string
    providerId: string
    amount: number
    method: PaymentMethod
    // Details for email
    customerEmail?: string
    customerName?: string
    providerName?: string
    requirementTitle?: string
    // Delivery contact
    deliveryContactName?: string
    deliveryContactEmail?: string
    deliveryContactPhone?: string
    // Physical address (only for physical orders)
    deliveryAddress?: string
    deliveryCity?: string
    deliveryState?: string
    deliveryPincode?: string
    deliveryInstructions?: string
  }): Promise<Payment> {
    const txnRef = generateTxnRef()

    // 1. Insert payment record
    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .insert({
        order_id: params.orderId,
        customer_id: params.customerId,
        amount: params.amount,
        method: params.method,
        status: 'completed',
        transaction_ref: txnRef,
        paid_at: new Date().toISOString(),
      } as any)
      .select()
      .single()
    if (pErr) throw pErr

    // 2. Create escrow record
    await supabase.from('escrow_records').insert({
      order_id: params.orderId,
      amount: params.amount,
      status: 'held',
    } as any)

    // 3. Advance order status + save delivery details
    await supabase.from('orders')
      .update({
        status: 'escrowed',
        updated_at: new Date().toISOString(),
        delivery_contact_name: params.deliveryContactName ?? null,
        delivery_contact_email: params.deliveryContactEmail ?? null,
        delivery_contact_phone: params.deliveryContactPhone ?? null,
        delivery_address: params.deliveryAddress ?? null,
        delivery_city: params.deliveryCity ?? null,
        delivery_state: params.deliveryState ?? null,
        delivery_pincode: params.deliveryPincode ?? null,
        delivery_instructions: params.deliveryInstructions ?? null,
      } as any)
      .eq('id', params.orderId)

    // 4. Log transaction
    await supabase.from('transactions').insert({
      order_id: params.orderId,
      type: 'payment',
      from_user: params.customerId,
      to_user: params.providerId,
      amount: params.amount,
      description: `Payment via ${params.method} — ${txnRef}`,
    } as any)

    // 5. Log event
    await logEvent(params.orderId, params.customerId, 'paid',
      `Payment of ₹${params.amount.toLocaleString()} completed (${txnRef})`,
      { method: params.method, txn_ref: txnRef }
    )

    // 6. Advance to in_progress after escrow confirmation
    await supabase.from('orders')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() } as any)
      .eq('id', params.orderId)

    await logEvent(params.orderId, null, 'in_progress', 'Order is now in progress. Awaiting delivery from provider.')

    // 7. Notify provider
    await supabase.from('notifications').insert({
      user_id: params.providerId,
      type: 'payment_received',
      title: 'Payment Received!',
      message: `Customer has paid ₹${params.amount.toLocaleString()}. Funds are in escrow. Please deliver the work.`,
      data: { order_id: params.orderId, txn_ref: txnRef },
    } as any)

    // 8. Trigger email confirmation via Edge Function (fire and forget)
    if (params.customerEmail) {
      supabase.functions.invoke('send-email', {
        body: {
          to: params.customerEmail,
          customerName: params.customerName || 'Customer',
          orderId: params.orderId,
          amount: params.amount,
          requirementTitle: params.requirementTitle,
          providerName: params.providerName
        }
      }).catch(err => console.error('Failed to trigger email confirmation:', err))
    }

    return payment as Payment
  },

  /** Provider submits delivery */
  async submitDelivery(params: {
    orderId: string
    providerId: string
    customerId: string
    type: DeliveryType
    files?: string[]
    driveLink?: string
    githubLink?: string
    extraLinks?: string[]
    notes?: string
    // Physical
    courier?: string
    trackingNumber?: string
    shipmentDate?: string
    estimatedArrival?: string
  }): Promise<Delivery> {
    const { data, error } = await supabase
      .from('deliveries')
      .insert({
        order_id: params.orderId,
        provider_id: params.providerId,
        type: params.type,
        files: params.files ?? [],
        drive_link: params.driveLink ?? null,
        github_link: params.githubLink ?? null,
        extra_links: params.extraLinks ?? [],
        notes: params.notes ?? null,
        courier: params.courier ?? null,
        tracking_number: params.trackingNumber ?? null,
        shipment_date: params.shipmentDate ?? null,
        estimated_arrival: params.estimatedArrival ?? null,
        physical_status: params.type === 'physical' ? 'packed' : null,
        status: 'pending',
      } as any)
      .select()
      .single()
    if (error) throw error

    // Advance order status
    await supabase.from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() } as any)
      .eq('id', params.orderId)

    await logEvent(params.orderId, params.providerId, 'delivered', 'Provider submitted delivery. Awaiting customer approval.')

    // Notify customer
    await supabase.from('notifications').insert({
      user_id: params.customerId,
      type: 'delivery_submitted',
      title: 'Delivery Submitted!',
      message: 'The provider has submitted the delivery. Please review and approve.',
      data: { order_id: params.orderId },
    } as any)

    return data as Delivery
  },

  /** Customer approves delivery — releases escrow */
  async approveDelivery(params: {
    orderId: string
    deliveryId: string
    customerId: string
    providerId: string
    amount: number
  }): Promise<void> {
    // Update delivery status
    const { error: e1 } = await supabase.from('deliveries')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() } as any)
      .eq('id', params.deliveryId)
    if (e1) throw e1

    // Release escrow
    const { error: e2 } = await supabase.from('escrow_records')
      .update({ status: 'released', released_at: new Date().toISOString(), released_to: params.providerId } as any)
      .eq('order_id', params.orderId)
    if (e2) throw e2

    // Log escrow release transaction
    const { error: e3 } = await supabase.from('transactions').insert({
      order_id: params.orderId,
      type: 'escrow_release',
      from_user: params.customerId,
      to_user: params.providerId,
      amount: params.amount,
      description: 'Escrow released to provider upon delivery approval.',
    } as any)
    if (e3) throw e3

    // Mark order completed
    const { error: e4 } = await supabase.from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() } as any)
      .eq('id', params.orderId)
    if (e4) throw e4

    // Mark requirement completed
    const { data: order, error: e5 } = await supabase.from('orders').select('requirement_id').eq('id', params.orderId).single()
    if (e5) throw e5
    if (order) {
      const { error: e6 } = await supabase.from('requirements')
        .update({ status: 'completed', updated_at: new Date().toISOString() } as any)
        .eq('id', (order as any).requirement_id)
      if (e6) throw e6
    }

    await logEvent(params.orderId, params.customerId, 'completed', 'Customer approved delivery. Escrow released to provider. Order completed!')

    // Notify provider
    const { error: e7 } = await supabase.from('notifications').insert({
      user_id: params.providerId,
      type: 'delivery_approved',
      title: 'Delivery Approved!',
      message: 'The customer approved your delivery. Payment has been released from escrow.',
      data: { order_id: params.orderId },
    } as any)
    if (e7) throw e7
  },

  /** Customer requests revision */
  async requestRevision(params: {
    orderId: string
    deliveryId: string
    customerId: string
    providerId: string
    notes: string
  }): Promise<void> {
    await supabase.from('deliveries')
      .update({ status: 'revision_requested', revision_notes: params.notes, reviewed_at: new Date().toISOString() } as any)
      .eq('id', params.deliveryId)

    await supabase.from('orders')
      .update({ status: 'revision_requested', updated_at: new Date().toISOString() } as any)
      .eq('id', params.orderId)

    await logEvent(params.orderId, params.customerId, 'revision_requested', `Customer requested revision: ${params.notes}`)

    await supabase.from('notifications').insert({
      user_id: params.providerId,
      type: 'delivery_revision_requested',
      title: 'Revision Requested',
      message: `The customer has requested a revision. Notes: ${params.notes}`,
      data: { order_id: params.orderId },
    } as any)
  },

  /** Customer raises a dispute */
  async raiseDispute(params: {
    orderId: string
    raisedBy: string
    providerId: string
    reason: string
  }): Promise<void> {
    await supabase.from('disputes').insert({
      order_id: params.orderId,
      raised_by: params.raisedBy,
      reason: params.reason,
    } as any)

    await supabase.from('orders')
      .update({ status: 'disputed', updated_at: new Date().toISOString() } as any)
      .eq('id', params.orderId)

    await logEvent(params.orderId, params.raisedBy, 'disputed', `Dispute raised: ${params.reason}`)

    await supabase.from('notifications').insert({
      user_id: params.providerId,
      type: 'dispute_raised',
      title: 'Dispute Raised',
      message: `A dispute has been raised on your order. Reason: ${params.reason}`,
      data: { order_id: params.orderId },
    } as any)
  },

  /** Update physical delivery tracking status */
  async updatePhysicalStatus(deliveryId: string, status: string): Promise<void> {
    await supabase.from('deliveries')
      .update({ physical_status: status as any } as any)
      .eq('id', deliveryId)
  },

  async getForCustomer(customerId: string): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        requirements (id, title, categories (name, icon, slug)),
        customer:profiles!orders_customer_id_fkey (id, full_name, avatar_url),
        provider:profiles!orders_provider_id_fkey (id, full_name, avatar_url, rating),
        payments (*),
        deliveries (*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as OrderWithDetails[]
  },

  async getForProvider(providerId: string): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        requirements (id, title, categories (name, icon, slug)),
        customer:profiles!orders_customer_id_fkey (id, full_name, avatar_url),
        provider:profiles!orders_provider_id_fkey (id, full_name, avatar_url, rating),
        payments (*),
        deliveries (*)
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as OrderWithDetails[]
  },

  async getById(orderId: string): Promise<OrderWithDetails> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        requirements (id, title, description, budget_min, budget_max, deadline, reference_files, categories (name, icon, slug)),
        offers (id, price, delivery_days, proposal, portfolio_urls),
        customer:profiles!orders_customer_id_fkey (id, full_name, avatar_url, email, rating, review_count),
        provider:profiles!orders_provider_id_fkey (id, full_name, avatar_url, email, rating, review_count, bio, skills, location),
        payments (*),
        escrow_records (*),
        deliveries (*),
        transactions (*),
        order_events (*),
        disputes (*)
      `)
      .eq('id', orderId)
      .single()
    if (error) throw error
    return data as OrderWithDetails
  },

  async uploadDeliveryFile(orderId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${orderId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('delivery-files').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('delivery-files').getPublicUrl(path)
    return data.publicUrl
  },
}
