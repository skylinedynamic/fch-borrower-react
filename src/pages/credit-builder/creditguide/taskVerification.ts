import { CREDIT_BUILDER_STATUS } from '../../../data/credit-builder'
import { tierCode } from '../../../data/tier'
import type { Tier, TierTask } from '../../../modules/credit-builder/guide/types'

/**
 * A task the borrower can (re)submit: never submitted, or rejected. Not one
 * already verified or waiting in review.
 */
export const isAwaitingSubmission = (task: TierTask): boolean =>
  task.status !== CREDIT_BUILDER_STATUS.VERIFIED && task.status !== CREDIT_BUILDER_STATUS.PROCESSING

/** "Verify All" is a Tier 0 shortcut only. */
export const supportsVerifyAll = (tier: Tier): boolean => tier.code === tierCode[0].value

export interface VerificationBatch {
  task_ids: number[]
  migrated_task_id: number | null
}

/**
 * One request per migrated-task id: the endpoint takes many task ids but a
 * single migrated_task_id, so tasks carried over from a migration can't share
 * a request with the rest.
 */
export function toVerificationBatches(tasks: TierTask[]): VerificationBatch[] {
  const batches = new Map<number | null, number[]>()
  for (const task of tasks) {
    const key = task.migrated_task_id ?? null
    batches.set(key, [...(batches.get(key) ?? []), task.id])
  }
  return [...batches.entries()].map(([migrated_task_id, task_ids]) => ({ task_ids, migrated_task_id }))
}
