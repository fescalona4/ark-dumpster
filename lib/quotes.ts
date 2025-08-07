import { supabase } from './supabase'

// Quote-related database operations
export async function saveQuoteSubmission(data: {
  firstName: string
  lastName?: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  dumpsterSize?: string
  dropoffDate?: string
  timeNeeded?: string
  message?: string
}) {
  try {
    const { data: result, error } = await supabase
      .from('quotes')
      .insert([
        {
          first_name: data.firstName,
          last_name: data.lastName || null,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zipCode || null,
          dumpster_size: data.dumpsterSize || null,
          dropoff_date: data.dropoffDate || null,
          time_needed: data.timeNeeded || null,
          message: data.message || null,
          status: 'pending',
          priority: 'normal'
        }
      ])
      .select()

    if (error) {
      console.error('Error saving quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to save quote submission' }
  }
}

// Get all quotes with filtering options
export async function getQuotes(filters?: {
  status?: string
  priority?: string
  city?: string
  state?: string
  limit?: number
}) {
  try {
    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching quotes:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch quotes' }
  }
}

// Update quote status and pricing
export async function updateQuote(id: string, updates: {
  status?: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed'
  quoted_price?: number
  quote_notes?: string
  assigned_to?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to update quote' }
  }
}

// Delete quote
export async function deleteQuote(id: string) {
  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to delete quote' }
  }
}

// Get quote statistics
export async function getQuoteStats() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('status, priority, created_at')

    if (error) {
      console.error('Error fetching quote stats:', error)
      return { success: false, error: error.message }
    }

    const stats = {
      total: data.length,
      pending: data.filter(q => q.status === 'pending').length,
      quoted: data.filter(q => q.status === 'quoted').length,
      accepted: data.filter(q => q.status === 'accepted').length,
      completed: data.filter(q => q.status === 'completed').length,
      high_priority: data.filter(q => q.priority === 'high').length,
      urgent: data.filter(q => q.priority === 'urgent').length,
      this_week: data.filter(q => {
        const createdDate = new Date(q.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return createdDate >= weekAgo
      }).length
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch quote statistics' }
  }
}
