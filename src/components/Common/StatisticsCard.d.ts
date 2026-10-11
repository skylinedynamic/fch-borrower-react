import type { FC } from 'react'

export interface StatisticsCardProps {
  title: string
  count: number | string
  icon: string
  colorVariant?: string
  colSize?: string
}

declare const StatisticsCard: FC<StatisticsCardProps>
export default StatisticsCard
