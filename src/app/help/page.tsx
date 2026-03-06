"use client"

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, MessageSquare, ShieldCheck, CreditCard, Truck, UserCog, Package, RefreshCw } from 'lucide-react'

const faqCategories = [
  {
    category: 'Getting Started',
    icon: MessageSquare,
    faqs: [
      {
        q: 'What is Pact and how does it work?',
        a: 'Pact connects farmers directly with buyers through group-buys (pools). Buyers join a pool for a product, and once the target is met, farmers fulfil and logistics deliver to pickup points. This reduces waste, stabilizes prices, and ensures fresher produce.'
      },
      {
        q: 'How do I join a pool and place an order?',
        a: 'Browse Marketplace → Choose a Pool → Select quantity → Checkout. If the pool reaches its target, you\'ll receive fulfilment and pickup details. If a pool does not reach its minimum target, you\'ll be notified and refunded automatically.'
      },
      {
        q: 'Do I need to create an account to browse pools?',
        a: 'No, you can browse available pools without an account. However, you need to sign up to join pools, track orders, and receive updates.'
      }
    ]
  },
  {
    category: 'Orders & Fulfilment',
    icon: Package,
    faqs: [
      {
        q: 'When will my order be ready?',
        a: 'Each pool displays an estimated fulfilment window based on the product and farm schedule. Once a pool closes, we coordinate harvest and logistics. You\'ll get updates via email/SMS until pickup or delivery.'
      },
      {
        q: 'What happens if a pool doesn\'t reach its target?',
        a: 'If a pool does not reach its minimum target by the deadline, it will be cancelled. All participants will be automatically refunded within 3-5 business days, and you\'ll receive an email notification.'
      },
      {
        q: 'Can I track my order status?',
        a: 'Yes! Once you join a pool, you can track its progress in your dashboard. You\'ll see real-time updates on pool status, harvest schedule, and delivery/pickup details.'
      },
      {
        q: 'Can I change or cancel my order after joining a pool?',
        a: 'You can cancel or modify your order before the pool closes. Once a pool is confirmed and production begins, modifications are no longer possible. Refunds follow our standard policy.'
      }
    ]
  },
  {
    category: 'Payments & Refunds',
    icon: CreditCard,
    faqs: [
      {
        q: 'Which payment methods are supported?',
        a: 'We support major cards (Visa, Mastercard, Amex) and compatible regional payment methods. Your payment is authorized at checkout and captured when the pool is confirmed. If a pool does not proceed, your authorization is released or refunded as applicable.'
      },
      {
        q: 'When will I be charged?',
        a: 'Your payment is authorized when you join a pool. The charge is only captured when the pool reaches its target and is confirmed. If the pool is cancelled, no charge is made.'
      },
      {
        q: 'How do refunds work?',
        a: 'If a pool is cancelled or doesn\'t meet its target, refunds are processed automatically within 3-5 business days. If you cancel before the pool closes, the same refund timeline applies. Refunds are issued to your original payment method.'
      },
      {
        q: 'Are there any fees?',
        a: 'Pact charges a small service fee to maintain the platform and ensure quality. This fee is clearly shown at checkout before you confirm your order. There are no hidden fees.'
      }
    ]
  },
  {
    category: 'Delivery & Pickup',
    icon: Truck,
    faqs: [
      {
        q: 'How will I receive my order?',
        a: 'Once a pool is fulfilled, you\'ll receive pickup location details and time windows. Some areas offer home delivery. Pickup points are strategically located for convenience, and you\'ll receive reminders before your pickup window.'
      },
      {
        q: 'What if I miss my pickup window?',
        a: 'Contact support immediately if you\'ll miss your pickup. We\'ll try to accommodate late pickups when possible, but unclaimed orders may be forfeited after 24 hours to maintain product freshness.'
      },
      {
        q: 'Can I change my pickup location?',
        a: 'You can request a pickup location change before the pool closes. Once logistics are coordinated, changes may not be possible. Contact support as early as possible.'
      }
    ]
  },
  {
    category: 'For Farmers',
    icon: UserCog,
    faqs: [
      {
        q: 'I\'m a farmer. How do I start selling on Pact?',
        a: 'Create a farmer account, complete onboarding (including verification), and list your produce with schedule and pricing. Our tools help you plan supply, set pool targets, and coordinate logistics. Visit the For Farmers section to begin.'
      },
      {
        q: 'How do farmers get paid?',
        a: 'Farmers receive payment within 2-3 business days after successful delivery/pickup confirmation. Payouts are processed securely and transparently, with clear transaction history in your farmer dashboard.'
      },
      {
        q: 'What fees do farmers pay?',
        a: 'Farmers pay a platform fee on successful transactions to cover payment processing, platform maintenance, and logistics coordination. Fees are transparent and shown before you list your produce.'
      }
    ]
  },
  {
    category: 'Account & Security',
    icon: ShieldCheck,
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard encryption, follow least-privilege access, and never share your data without consent. Sensitive payment data is processed by certified payment providers (PCI-DSS compliant).'
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page. You\'ll receive a password reset link via email. Follow the link to create a new password securely.'
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. You can request account deletion from your account settings. Note that this will permanently delete your data and order history. Active orders must be completed before deletion.'
      }
    ]
  },
  {
    category: 'Troubleshooting',
    icon: RefreshCw,
    faqs: [
      {
        q: 'I didn\'t receive a confirmation email',
        a: 'Check your spam/junk folder first. If still not found, verify your email address in account settings and request a new confirmation. Contact support if the issue persists.'
      },
      {
        q: 'The website is not loading properly',
        a: 'Try clearing your browser cache, disabling ad blockers, or using a different browser. Pact works best on modern browsers (Chrome, Firefox, Safari, Edge). Contact support if issues continue.'
      },
      {
        q: 'I have an issue not covered here',
        a: 'No problem! Contact our support team via the contact form and we\'ll get back to you within 24 hours. Provide as much detail as possible to help us assist you quickly.'
      }
    ]
  }
]

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-28 md:pt-36 pb-10 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <HelpCircle className="h-7 w-7" />
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight mb-3">Help Center</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Answers to common questions, plus tips to get the best out of Pact.
            </p>
          </motion.div>
        </section>

        {/* Quick Topics */}
        <section className="container mx-auto px-4 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, title: 'Getting Started', href: '#getting-started', desc: 'Join your first pool in minutes.' },
              { icon: CreditCard, title: 'Payments', href: '#payments-refunds', desc: 'How payments and refunds work.' },
              { icon: Truck, title: 'Fulfilment', href: '#delivery-pickup', desc: 'Timelines and pickup points.' },
              { icon: UserCog, title: 'Account', href: '#account-security', desc: 'Managing your profile and settings.' },
            ].map(({ icon: Icon, title, href, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Card className="border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" /> {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <Link href={href} className="text-primary text-sm font-medium hover:underline">View</Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ by Category */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqCategories.map(({ category, icon: Icon, faqs }, catIdx) => (
              <motion.div
                key={category}
                id={category.toLowerCase().replace(/\s+/g, '-')}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: catIdx * 0.05 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">{category}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full border border-border rounded-2xl px-4 divide-y divide-border bg-card shadow-sm">
                  {faqs.map(({ q, a }, idx) => (
                    <AccordionItem key={idx} value={`${category}-${idx}`}>
                      <AccordionTrigger className="text-base">{q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}

            <Card className="mt-8 border-dashed border-border/60">
              <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Still need help?</p>
                  <p className="text-sm text-muted-foreground">Contact our support team and we&apos;ll get back within 24 hours.</p>
                </div>
                <Button asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
