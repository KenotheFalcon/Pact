import { redirect } from 'next/navigation'

export default function ProductPage({ params }: { params: { id: string } }) {
    // Redirect to the new Marketplace Listing page
    redirect(`/marketplace/listings/${params.id}`)
}

