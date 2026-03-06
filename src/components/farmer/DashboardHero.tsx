'use client'

import { motion } from 'framer-motion'
import { Sun, CloudRain, Calendar } from 'lucide-react'

export default function DashboardHero() {
    const date = new Date()
    const hours = date.getHours()
    const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pact-green to-emerald-900 text-white shadow-xl"
        >
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-8 gap-6">
                <div>
                    <div className="flex items-center gap-2 text-emerald-100 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
                        {greeting}, Farmer!
                    </h1>
                    <p className="text-emerald-100 max-w-lg text-lg">
                        Your farm is performing well today. Check your latest listings and pool activities below.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Sun className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-200 font-medium">Weather</p>
                        <p className="text-lg font-bold">28°C <span className="text-sm font-normal text-emerald-100">Sunny</span></p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
