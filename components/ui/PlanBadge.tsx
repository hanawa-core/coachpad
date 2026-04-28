import { clsx } from 'clsx'
import { PLAN_CONFIG, type AthletePlan } from '@/types'

interface Props {
  plan: AthletePlan | null | undefined
  size?: 'sm' | 'md'
}

export function PlanBadge({ plan, size = 'sm' }: Props) {
  if (!plan) return null
  const config = PLAN_CONFIG[plan]
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium',
        config.color,
        config.bg,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}
