import { supabase } from './supabase'

// Example: Contact form submission to database
export async function saveContactSubmission(data: {
  name: string
  email: string
  phone: string
  message: string
}) {
  try {
    const { data: result, error } = await supabase
      .from('contacts')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error saving contact:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to save contact submission' }
  }
}

// Example: Get all contacts (admin function)
export async function getContacts() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch contacts' }
  }
}

// Example: Delete contact (admin function)
export async function deleteContact(id: string) {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting contact:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to delete contact' }
  }
}
