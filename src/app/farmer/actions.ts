'use server'

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )
}

export async function shipItem(data: { poolId: string, driverName: string, driverPhone: string, waybill: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Update pool status to 'shipping' or 'shipped'
    const { error } = await supabase
        .from('pools')
        .update({ 
            status: 'shipped',
            // In a real app, storing waybill/driver info in a separate table 'shipments'
        })
        .eq('id', data.poolId)

    if (error) {
        console.error('Error shipping item:', error)
        throw new Error('Failed to ship item')
    }

    revalidatePath('/farmer')
    return { success: true }
}
