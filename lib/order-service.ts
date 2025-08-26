/**
 * Order Service - Handles multi-service order operations
 * 
 * This service provides functions for creating and managing orders
 * with the new multi-service structure that supports:
 * - Multiple dumpsters per order
 * - Additional services (tree removal, extra charges)
 * - Flexible pricing and scheduling
 */

import { supabase } from '@/lib/supabase';
import { 
  OrderCreateData, 
  ServiceSelection, 
  Order, 
  OrderService, 
  Service, 
  ServiceCategory,
  DumpsterAssignmentData,
  OrderWithServices,
  FullOrder 
} from '@/types/database';

// =============================================================================
// ORDER CREATION
// =============================================================================

/**
 * Creates a new order with multiple services
 */
export async function createOrderWithServices(orderData: OrderCreateData): Promise<{ order: Order; services: OrderService[] }> {
  if (!orderData.services || orderData.services.length === 0) {
    throw new Error('At least one service is required to create an order');
  }

  try {
    // Start a transaction by creating the order first
    const orderInsertData = {
      quote_id: orderData.quoteId || null,
      first_name: orderData.firstName,
      last_name: orderData.lastName || null,
      email: orderData.email,
      phone: orderData.phone || null,
      address: orderData.address || null,
      address2: orderData.address2 || null,
      city: orderData.city || null,
      state: orderData.state || null,
      zip_code: orderData.zipCode || null,
      status: 'pending' as const,
      priority: orderData.priority || 'normal',
      assigned_to: orderData.assignedTo || 'Ariel',
      scheduled_delivery_date: orderData.scheduledDeliveryDate || null,
      scheduled_pickup_date: orderData.scheduledPickupDate || null,
      internal_notes: orderData.internalNotes || null,
    };

    // Generate order number and create order
    const { data: orderNumber, error: orderNumError } = await supabase
      .rpc('generate_order_number');

    if (orderNumError) {
      throw new Error(`Failed to generate order number: ${orderNumError.message}`);
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ ...orderInsertData, order_number: orderNumber }])
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // Create order services
    const orderServices = await createOrderServices(order.id, orderData.services);

    // Update quote status if this was created from a quote
    if (orderData.quoteId) {
      await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', orderData.quoteId);
    }

    return {
      order,
      services: orderServices
    };
  } catch (error) {
    console.error('Error creating order with services:', error);
    throw error;
  }
}

/**
 * Creates order services for an existing order
 */
export async function createOrderServices(orderId: string, services: ServiceSelection[]): Promise<OrderService[]> {
  const createdServices: OrderService[] = [];

  for (const serviceSelection of services) {
    // Get service details for pricing
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceSelection.service_id)
      .single();

    if (serviceError || !service) {
      throw new Error(`Service not found: ${serviceSelection.service_id}`);
    }

    const unitPrice = serviceSelection.unit_price || service.base_price;
    const totalPrice = serviceSelection.quantity * unitPrice;

    const orderServiceData = {
      order_id: orderId,
      service_id: serviceSelection.service_id,
      quantity: serviceSelection.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      service_date: serviceSelection.service_date || null,
      notes: serviceSelection.notes || null,
      metadata: serviceSelection.metadata || null,
      status: 'pending' as const,
    };

    const { data: orderService, error: orderServiceError } = await supabase
      .from('order_services')
      .insert([orderServiceData])
      .select()
      .single();

    if (orderServiceError || !orderService) {
      throw new Error(`Failed to create order service: ${orderServiceError?.message}`);
    }

    createdServices.push(orderService);
  }

  return createdServices;
}

/**
 * Converts a quote to a multi-service order (legacy support)
 */
export async function convertQuoteToOrder(quoteId: string): Promise<{ order: Order; services: OrderService[] }> {
  // Get the quote data
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) {
    throw new Error(`Quote not found: ${quoteId}`);
  }

  // Validate required fields
  if (!quote.dropoff_date) {
    throw new Error('Dropoff date is required to create an order');
  }

  // Find the appropriate service for the quote's dumpster size
  let service_id: string | null = null;
  
  if (quote.dumpster_size) {
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('dumpster_size', quote.dumpster_size)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!serviceError && service) {
      service_id = service.id;
    }
  }

  // If no specific service found, use general service
  if (!service_id) {
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('sku', 'GENERAL-SERVICE')
      .single();

    if (serviceError || !service) {
      throw new Error('No suitable service found for this quote');
    }
    service_id = service.id;
  }

  // Create the order data
  const orderData: OrderCreateData = {
    quoteId: quote.id,
    firstName: quote.first_name,
    lastName: quote.last_name,
    email: quote.email,
    phone: quote.phone,
    address: quote.address,
    address2: quote.address2,
    city: quote.city,
    state: quote.state,
    zipCode: quote.zip_code,
    assignedTo: quote.assigned_to || 'Ariel',
    priority: quote.priority,
    scheduledDeliveryDate: quote.dropoff_date,
    internalNotes: quote.quote_notes,
    services: [
      {
        service_id: service_id!,
        quantity: 1,
        unit_price: quote.quoted_price || undefined,
        service_date: quote.dropoff_date,
        notes: quote.message,
        metadata: {
          converted_from_quote: true,
          original_dumpster_size: quote.dumpster_size,
          dropoff_time: quote.dropoff_time,
          time_needed: quote.time_needed,
        }
      }
    ]
  };

  return await createOrderWithServices(orderData);
}

// =============================================================================
// ORDER MANAGEMENT
// =============================================================================

/**
 * Adds a service to an existing order
 */
export async function addServiceToOrder(
  orderId: string,
  serviceSelection: ServiceSelection
): Promise<OrderService> {
  const services = await createOrderServices(orderId, [serviceSelection]);
  return services[0];
}

/**
 * Updates an order service
 */
export async function updateOrderService(
  orderServiceId: string,
  updates: Partial<OrderService>
): Promise<OrderService> {
  const { data: orderService, error } = await supabase
    .from('order_services')
    .update(updates)
    .eq('id', orderServiceId)
    .select()
    .single();

  if (error || !orderService) {
    throw new Error(`Failed to update order service: ${error?.message}`);
  }

  return orderService;
}

/**
 * Assigns a dumpster to an order service
 */
export async function assignDumpsterToOrderService(
  assignmentData: DumpsterAssignmentData
): Promise<void> {
  // Check if dumpster is available
  const { data: existingAssignment, error: checkError } = await supabase
    .from('order_dumpsters')
    .select('id')
    .eq('dumpster_id', assignmentData.dumpster_id)
    .in('status', ['assigned', 'delivered'])
    .limit(1);

  if (checkError) {
    throw new Error(`Failed to check dumpster availability: ${checkError.message}`);
  }

  if (existingAssignment && existingAssignment.length > 0) {
    throw new Error('Dumpster is already assigned to another order');
  }

  // Get order ID from order service
  const { data: orderService, error: osError } = await supabase
    .from('order_services')
    .select('order_id')
    .eq('id', assignmentData.order_service_id)
    .single();

  if (osError || !orderService) {
    throw new Error(`Order service not found: ${assignmentData.order_service_id}`);
  }

  // Create the assignment
  const assignmentRecord = {
    order_service_id: assignmentData.order_service_id,
    dumpster_id: assignmentData.dumpster_id,
    order_id: orderService.order_id,
    delivery_address: assignmentData.delivery_address || null,
    scheduled_pickup_date: assignmentData.scheduled_pickup_date || null,
    delivery_notes: assignmentData.delivery_notes || null,
    status: 'assigned' as const,
  };

  const { error: assignError } = await supabase
    .from('order_dumpsters')
    .insert([assignmentRecord]);

  if (assignError) {
    throw new Error(`Failed to assign dumpster: ${assignError.message}`);
  }
}

// =============================================================================
// ORDER QUERIES
// =============================================================================

/**
 * Gets an order with all its services and dumpster assignments
 */
export async function getOrderWithServices(orderId: string): Promise<FullOrder | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      services:order_services (
        *,
        service:services (
          *,
          category:service_categories (*)
        ),
        dumpster_assignments:order_dumpsters (
          *,
          dumpster:dumpsters (*)
        )
      ),
      payments (*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return null;
  }

  return order as FullOrder;
}

/**
 * Gets orders with service summaries
 */
export async function getOrdersWithServiceSummary(filters: {
  status?: string;
  assignedTo?: string;
  email?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<OrderWithServices[]> {
  let query = supabase
    .from('order_summary_with_services')
    .select('*');

  // Apply filters
  if (filters.status) {
    query = query.eq('order_status', filters.status);
  }
  
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  
  if (filters.email) {
    query = query.eq('email', filters.email);
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  const { data: orders, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return orders as OrderWithServices[] || [];
}

/**
 * Gets available services for order creation
 */
export async function getAvailableServices(): Promise<(Service & { category: ServiceCategory })[]> {
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      category:service_categories (*)
    `)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch services: ${error.message}`);
  }

  return services as (Service & { category: ServiceCategory })[] || [];
}

/**
 * Gets available dumpsters for a specific service
 */
export async function getAvailableDumpsters(service_id?: string): Promise<any[]> {
  if (service_id) {
    // Use the database function to get filtered results
    const { data: dumpsters, error } = await supabase
      .rpc('get_available_dumpsters_for_service', { service_uuid: service_id });

    if (error) {
      throw new Error(`Failed to fetch available dumpsters: ${error.message}`);
    }

    return dumpsters || [];
  } else {
    // Get all available dumpsters
    const { data: dumpsters, error } = await supabase
      .from('dumpsters')
      .select('*')
      .eq('status', 'available')
      .not('id', 'in', 
        supabase
          .from('order_dumpsters')
          .select('dumpster_id')
          .in('status', ['assigned', 'delivered'])
      )
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch dumpsters: ${error.message}`);
    }

    return dumpsters || [];
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calculates total price for a list of service selections
 */
export async function calculateOrderTotal(services: ServiceSelection[]): Promise<{
  subtotal: number;
  tax: number;
  total: number;
}> {
  let subtotal = 0;
  let tax = 0;

  for (const serviceSelection of services) {
    // Get service details
    const { data: service, error } = await supabase
      .from('services')
      .select('base_price, is_taxable, tax_rate')
      .eq('id', serviceSelection.service_id)
      .single();

    if (!error && service) {
      const unitPrice = serviceSelection.unit_price || service.base_price;
      const serviceTotal = serviceSelection.quantity * unitPrice;
      
      subtotal += serviceTotal;
      
      if (service.is_taxable) {
        tax += serviceTotal * (service.tax_rate || 0);
      }
    }
  }

  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
}

/**
 * Gets order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  by_status: Record<string, number>;
  with_multiple_services: number;
  average_services_per_order: number;
}> {
  const { data, error } = await supabase
    .from('orders')
    .select('status, service_count, has_multiple_services');

  if (error) {
    throw new Error(`Failed to get order stats: ${error.message}`);
  }

  const stats = {
    total: data.length,
    by_status: {} as Record<string, number>,
    with_multiple_services: 0,
    average_services_per_order: 0
  };

  let totalServices = 0;

  for (const order of data) {
    // Count by status
    stats.by_status[order.status] = (stats.by_status[order.status] || 0) + 1;
    
    // Count multiple services
    if (order.has_multiple_services) {
      stats.with_multiple_services++;
    }
    
    // Sum services for average
    totalServices += order.service_count || 0;
  }

  stats.average_services_per_order = data.length > 0 ? totalServices / data.length : 0;

  return stats;
}