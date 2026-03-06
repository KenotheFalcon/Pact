'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import { AnimatedSection, AnimatedItem } from '@/components/AnimatedSection'

const testimonials = [
    {
        id: 1,
        name: "Emmanuel Okafor",
        role: "Yam Farmer, Benue",
        content: "Pact has completely transformed how I sell my harvest. No more middlemen taking all the profit. I connect directly with buyers and get paid instantly.",
        avatar: "/images/avatars/farmer-1.jpg",
        rating: 5
    },
    {
        id: 2,
        name: "Sarah Adebayo",
        role: "Restaurant Owner, Lagos",
        content: "The quality of produce I get through Pact is unmatched. Plus, the pooled buying options save me over 30% on my weekly supplies. It's a game changer.",
        avatar: "/images/avatars/buyer-1.jpg",
        rating: 5
    },
    {
        id: 3,
        name: "Musa Ibrahim",
        role: "Rice Distributor, Kano",
        content: "I was skeptical at first, but the platform is so easy to use. The logistics support means I don't have to worry about transport. Highly recommended.",
        avatar: "/images/avatars/farmer-2.jpg",
        rating: 4
    }
]

export function TestimonialsSection() {
    return (
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden transition-colors duration-300">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pact-orange/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pact-green/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">
                            Trusted by Growers and Buyers Across Nigeria
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400">
                            Don&apos;t just take our word for it. Hear from the community building the future of agriculture with Pact.
                        </p>
                    </motion.div>
                </div>

                <AnimatedSection className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <AnimatedItem key={testimonial.id} className="h-full">
                            <div className="h-full p-8 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                                <Quote className="absolute top-6 right-6 w-8 h-8 text-pact-green/10 group-hover:text-pact-green/20 transition-colors" />

                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < testimonial.rating ? 'text-pact-orange fill-pact-orange' : 'text-zinc-300 dark:text-zinc-600'}`}
                                        />
                                    ))}
                                </div>

                                <p className="text-zinc-700 dark:text-zinc-300 mb-8 leading-relaxed italic">
                                    &ldquo;{testimonial.content}&rdquo;
                                </p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                                        {/* Placeholder for avatar if image fails or doesn't exist */}
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold text-lg">
                                            {testimonial.name.charAt(0)}
                                        </div>
                                        {/* Uncomment when real images are available
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      fill 
                      className="object-cover"
                    />
                    */}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{testimonial.name}</h4>
                                        <p className="text-xs text-pact-green font-medium uppercase tracking-wide">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </AnimatedItem>
                    ))}
                </AnimatedSection>
            </div>
        </section>
    )
}
