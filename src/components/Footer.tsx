'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const footerLinks = {
    company: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Mission', href: '/mission' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
    ],
    resources: [
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'For Farmers', href: '/farmer' },
        { label: 'For Buyers', href: '/buyer' },
        { label: 'Help Center', href: '/help' },
    ],
    legal: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
    ],
}

const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export function Footer() {
    const pathname = usePathname()

    // Hide footer on dashboard routes
    if (pathname?.startsWith('/farmer') || pathname?.startsWith('/buyer')) {
        return null
    }

    return (
        <footer className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pt-24 pb-12 overflow-hidden relative border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}
            />

            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-pact-green/5 dark:bg-pact-green/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pact-green to-emerald-600 flex items-center justify-center shadow-lg shadow-pact-green/20 group-hover:scale-105 transition-transform duration-300">
                                <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pact</span>
                        </Link>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm text-lg">
                            Building connected and thriving agricultural communities through technology and sustainable practices.
                        </p>

                        <div className="pt-6">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-4">Subscribe to our newsletter</h4>
                            <div className="flex gap-2 max-w-sm relative">
                                <Input
                                    placeholder="Enter your email"
                                    className="bg-white dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-pact-green focus:border-pact-green/50 h-12 rounded-xl"
                                />
<Button size="icon" className="bg-pact-green hover:bg-emerald-600 shrink-0 h-12 w-12 rounded-xl absolute right-0 top-0 shadow-lg shadow-pact-green/20" aria-label="Subscribe to newsletter">
                                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-1">
                        <h3 className="font-bold text-lg mb-6 text-zinc-900 dark:text-white">Company</h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-pact-green transition-colors duration-200 block text-base"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-1">
                        <h3 className="font-bold text-lg mb-6 text-zinc-900 dark:text-white">Resources</h3>
                        <ul className="space-y-4">
                            {footerLinks.resources.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-pact-green transition-colors duration-200 block text-base"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h3 className="font-bold text-lg mb-6 text-zinc-900 dark:text-white">Contact</h3>
                        <div className="space-y-6 text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-start space-x-4 group">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center shrink-0 group-hover:bg-pact-green/10 transition-colors">
                                    <MapPin className="w-5 h-5 text-pact-green group-hover:scale-110 transition-transform" aria-hidden="true" />
                                </div>
                                <span className="mt-2">123 Farm Street, Agriculture City<br />Lagos, Nigeria</span>
                            </div>
                            <div className="flex items-center space-x-4 group">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center shrink-0 group-hover:bg-pact-green/10 transition-colors">
                                    <Mail className="w-5 h-5 text-pact-green group-hover:scale-110 transition-transform" aria-hidden="true" />
                                </div>
                                <a href="mailto:hello@pact.com" className="hover:text-zinc-900 dark:hover:text-white transition-colors">hello@pact.com</a>
                            </div>
                            <div className="flex items-center space-x-4 group">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center shrink-0 group-hover:bg-pact-green/10 transition-colors">
                                    <Phone className="w-5 h-5 text-pact-green group-hover:scale-110 transition-transform" aria-hidden="true" />
                                </div>
                                <a href="tel:+2345551234567" className="hover:text-zinc-900 dark:hover:text-white transition-colors">+234 (555) 123-4567</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-500 dark:text-zinc-500 text-sm">
                        © {new Date().getFullYear()} Pact. All rights reserved.
                    </p>

                    <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-500">
                        {footerLinks.legal.map((link) => (
                            <Link key={link.href} href={link.href} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        {socialLinks.map((social) => {
                            const Icon = social.icon
                            return (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-pact-green hover:text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                                >
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>
        </footer>
    )
}
