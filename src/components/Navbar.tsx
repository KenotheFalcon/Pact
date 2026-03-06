'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, X, Leaf, User as UserIcon, ShoppingCart, ChevronRight, HelpCircle, LogOut, FileQuestion } from 'lucide-react'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { mobileMenuItemVariants } from '@/lib/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

const navLinks = [
    { href: '/marketplace', label: 'Active Pools', icon: ShoppingCart },
    { href: '/buyer', label: 'For Buyers', icon: UserIcon },
    { href: '/farmer', label: 'For Farmers', icon: Leaf },
]

/**
 * Main navigation component
 * Handles responsive navigation, user authentication state, and theme switching
 */
export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const pathname = usePathname()
    const router = useRouter()
    const prefersReducedMotion = useReducedMotion()
    const supabase = useMemo(() => createClient(), [])

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
  
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Check auth state
    useEffect(() => {
        let isMounted = true

        const checkUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (!isMounted) return
            if (!error) {
                setUser(user)
            }
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (!isMounted) return
            setUser(session?.user ?? null)
        })

        return () => {
            isMounted = false
            subscription?.unsubscribe()
        }
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    // Radix Sheet handles scroll lock and Escape key automatically

    const isHomePage = pathname === '/'
    const isAuthPage = pathname === '/login' || pathname === '/signup'
    const showSolid = isScrolled || !isHomePage

    // Hide navbar on dashboard routes
    if (pathname?.startsWith('/farmer') || pathname?.startsWith('/buyer')) {
        return null
    }

    return (
        <>
            <motion.nav
                role="navigation"
                transition={prefersReducedMotion ? undefined : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                    "fixed left-0 right-0 top-0 z-50 py-3 md:py-4 transition-all duration-500 ease-in-out",
                    showSolid
                        ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm"
                        : "bg-transparent"
                )}
            >
                <div className="container relative mx-auto px-4">
                    <div
                        className={cn(
                            "relative flex h-12 items-center justify-between rounded-full px-3 transition-colors duration-500 md:h-14 md:px-4",
                            showSolid
                                ? "bg-card/90 border border-border/70 shadow-sm backdrop-blur-xl"
                                : "bg-white/5 border border-white/10 backdrop-blur-2xl"
                        )}
                    >
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group relative z-50 flex-shrink-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pact-green/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Leaf className={cn(
                                    "w-8 h-8 transition-colors duration-300 relative",
                                    showSolid ? "text-pact-green" : "text-white drop-shadow-md"
                                )} aria-hidden="true" />
                            </div>
                            <span className={cn(
                                "text-xl font-bold tracking-tight transition-colors duration-300",
                                showSolid ? "text-zinc-900 dark:text-white" : "text-white drop-shadow-md"
                            )}>
                                Pact
                            </span>
                        </Link>

                        {/* Desktop Navigation - Centered */}
                        <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-1">
                            {navLinks.map((link) => {
                                const isActive = pathname?.startsWith(link.href) ?? false
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className="relative group px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-h-10"
                                    >
                                        <span className={cn(
                                            "text-sm font-medium transition-colors duration-300 relative z-10 inline-block",
                                            isActive
                                                ? "text-pact-green font-semibold"
                                                : showSolid
                                                    ? "text-zinc-600 dark:text-zinc-400 group-hover:text-pact-green"
                                                    : "text-white/90 group-hover:text-white"
                                        )}>
                                            {link.label}
                                        </span>

                                        {/* Magnetic Hover Effect Background */}
                                        <div className={cn(
                                            "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100",
                                            showSolid ? "bg-zinc-100 dark:bg-zinc-800/50" : "bg-white/10"
                                        )} />

                                        {isActive && (
                                            <motion.div
                                                layoutId="navbar-indicator"
                                                className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-pact-green rounded-full z-20"
                                                initial={false}
                                                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Desktop Auth Buttons & Theme Toggle */}
                        <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
                            <ThemeToggle className={cn(
                                "transition-colors duration-300 hover:bg-transparent",
                                showSolid ? "text-zinc-600 dark:text-zinc-400 hover:text-pact-green" : "text-white/90 hover:text-white"
                            )} />

                            <div className={cn(
                                "h-6 w-px mx-2 transition-colors duration-300",
                                showSolid ? "bg-zinc-200 dark:bg-zinc-800" : "bg-white/20"
                            )} />

                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800">
                                                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                                                <AvatarFallback className="bg-pact-green/10 text-pact-green font-bold">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/help" className="cursor-pointer">
                                                <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                                <span>Help Centre</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/faqs" className="cursor-pointer">
                                                <FileQuestion className="mr-2 h-4 w-4" aria-hidden="true" />
                                                <span>FAQs</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/cart" className="cursor-pointer">
                                                <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                                                <span>Cart</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    {pathname !== '/login' && (
                                        <Link href="/login">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "font-medium transition-colors hover:bg-transparent",
                                                    showSolid
                                                        ? "text-zinc-600 dark:text-zinc-400 hover:text-pact-green"
                                                        : "text-white hover:text-white/80"
                                                )}
                                            >
                                                Sign In
                                            </Button>
                                        </Link>
                                    )}
                                    {!isAuthPage && (
                                        <Link href="/signup">
                                            <Button
                                                variant={showSolid ? "default" : "white"}
                                                className={cn(
                                                    "font-bold shadow-lg shadow-pact-green/20 transition-all hover:scale-105 active:scale-95",
                                                    !showSolid && "bg-white text-pact-green hover:bg-white/90 border-none"
                                                )}
                                            >
                                                Get Started
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile Menu (Sheet) */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "md:hidden relative z-50",
                                        showSolid
                                            ? "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            : "text-white hover:bg-white/10"
                                    )}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="w-6 h-6" />
                                    ) : (
                                        <Menu className="w-6 h-6" />
                                    )}
                                </Button>
                            </SheetTrigger>

                            <SheetContent side="right" className="md:hidden w-[85%] max-w-sm overflow-y-auto">
                                <div className="flex flex-col h-full pt-24 pb-8 px-4 sm:px-6">
                                    {/* Navigation Links */}
                                    <div className="flex-1 space-y-2">
                                        {navLinks.map((link, index) => {
                                            const Icon = link.icon
                                            const isActive = pathname?.startsWith(link.href) ?? false

                                            return (
                                                <motion.div
                                                    key={link.href}
                                                    custom={index}
                                                    variants={prefersReducedMotion ? {} : mobileMenuItemVariants}
                                                >
                                                    <SheetClose asChild>
                                                        <Link
                                                            href={link.href}
                                                            className={cn(
                                                                "flex items-center justify-between h-14 px-4 rounded-2xl transition-all group border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                                                                isActive
                                                                    ? "bg-pact-green/10 text-pact-green border-pact-green/20"
                                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-800"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                                                                    isActive ? "bg-pact-green text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-pact-green"
                                                                )}>
                                                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                                                </div>
                                                                <span className="font-bold text-base sm:text-lg">{link.label}</span>
                                                            </div>
                                                            <ChevronRight className={cn(
                                                                "w-5 h-5 transition-transform group-hover:translate-x-1 flex-shrink-0",
                                                                isActive ? "text-pact-green" : "text-zinc-300 group-hover:text-pact-green"
                                                            )} aria-hidden="true" />
                                                        </Link>
                                                    </SheetClose>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    {/* Auth Buttons */}
                                    <motion.div
                                        className="pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
                                            <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">Appearance</span>
                                            <ThemeToggle />
                                        </div>

                                        {user ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                                    <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                                                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                                                        <AvatarFallback className="bg-pact-green/10 text-pact-green font-bold text-sm">
                                                            {user.email?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-sm truncate">{user.user_metadata?.full_name || "User"}</span>
                                                        <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                                <SheetClose asChild>
                                                    <Button 
                                                        onClick={handleSignOut} 
                                                        variant="outline" 
                                                        className="w-full h-14 text-base rounded-xl border-red-200 dark:border-red-900 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                                                    >
                                                        <LogOut className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                                        <span>Log Out</span>
                                                    </Button>
                                                </SheetClose>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <SheetClose asChild>
                                                    <Link href="/login" className="block">
                                                        <Button 
                                                            variant="outline" 
                                                            className="w-full h-14 text-base rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                                                        >
                                                            Sign In
                                                        </Button>
                                                    </Link>
                                                </SheetClose>
                                                {!isAuthPage && (
                                                    <SheetClose asChild>
                                                        <Link href="/signup" className="block">
                                                            <Button 
                                                                className="w-full h-14 text-base shadow-lg shadow-pact-green/20 rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                                                            >
                                                                Get Started
                                                            </Button>
                                                        </Link>
                                                    </SheetClose>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu handled by Sheet above */}
        </>
    )
}
