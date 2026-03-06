'use client'

import { motion } from 'framer-motion'

import { PoolProgressCard } from '@/components/marketplace/PoolProgressCard'

import type { Pool } from '@/types/database'

interface AnimatedPoolCardProps {
  pool: Pool
  index: number
}

export function AnimatedPoolCard({ pool, index }: AnimatedPoolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <PoolProgressCard pool={pool} />
    </motion.div>
  )
}
