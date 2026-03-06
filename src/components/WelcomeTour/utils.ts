import type { CSSProperties } from 'react'

export const getTooltipStyle = (
  targetRect: DOMRect | null,
  placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
): CSSProperties => {
  if (!targetRect) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }

  const padding = 16
  const tooltipWidth = 320
  const tooltipHeight = 180

  switch (placement) {
    case 'top':
      return {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.top - tooltipHeight - padding,
        transform: 'translateX(-50%)'
      }
    case 'bottom':
      return {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + padding,
        transform: 'translateX(-50%)'
      }
    case 'left':
      return {
        left: targetRect.left - tooltipWidth - padding,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translateY(-50%)'
      }
    case 'right':
      return {
        left: targetRect.right + padding,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translateY(-50%)'
      }
    default:
      return {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + padding,
        transform: 'translateX(-50%)'
      }
  }
}

export const getSpotlightClipPath = (targetRect: DOMRect | null): string => {
  if (!targetRect) return 'none'

  const padding = 8
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const width = targetRect.width + padding * 2
  const height = targetRect.height + padding * 2
  const radius = 8

  return `polygon(
    0% 0%, 0% 100%,
    ${x}px 100%, ${x}px ${y + radius}px,
    ${x + radius}px ${y}px, ${x + width - radius}px ${y}px,
    ${x + width}px ${y + radius}px, ${x + width}px ${y + height - radius}px,
    ${x + width - radius}px ${y + height}px, ${x + radius}px ${y + height}px,
    ${x}px ${y + height - radius}px, ${x}px 100%,
    100% 100%, 100% 0%
  )`
}
