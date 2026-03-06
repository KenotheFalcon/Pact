import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { 
  apiSuccess, 
  apiBadRequest, 
  apiInternalError,
  getErrorMessage 
} from '@/lib/api/responses'

// Validation schema for contact form
const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
})

/**
 * Submit a contact form message
 * POST /api/contact
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate input with Zod
    const parseResult = ContactFormSchema.safeParse(body)
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0]?.message || 'Invalid input')
    }

    const { name, email, subject, message } = parseResult.data

    // Get authenticated user if available
    const { data: { user } } = await supabase.auth.getUser()

    // Store in database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        user_id: user?.id || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Trigger email notification via Edge Function (non-blocking)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            submissionId: data?.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
          }),
        }
      )
    } catch {
      // Non-critical - don't fail the request if notification fails
    }

    return apiSuccess({
      message: 'Your message has been received. We will get back to you within 24 hours.',
      id: data?.id,
    })
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, 'Failed to submit message. Please try again later.'))
  }
}
