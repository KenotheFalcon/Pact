import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDestinationForRole } from "@/lib/auth/roles"
import AdminHeader from "@/components/admin/AdminHeader"
import type { UserRole } from "@/types/database"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    const role = profile?.role as UserRole | undefined
    if (role !== "admin") {
        redirect(getDestinationForRole(role))
    }

    return (
        <div className="flex min-h-screen flex-col">
            <AdminHeader />
            <main className="flex-1 container py-6">{children}</main>
        </div>
    )
}
