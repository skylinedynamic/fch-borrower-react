import type { FileSystemItem } from '../modules/filemanager/types'
import { DOCUMENT_STATUS } from '../config/fileTypeConfig'

/**
 * Where a document category stands (BUG-135):
 *
 *   empty    - nothing uploaded
 *   reupload - only rejected files: a new one is needed
 *   pending  - a usable file, none accepted yet: waiting for review
 *   accepted - at least one file accepted
 *
 * A rejected file doesn't count as uploaded, as in the API's onboarding step
 * (OnboardingStepService::hasUploadedDocuments); a pending one does, but is
 * not shown as accepted.
 */
export type DocumentCategoryState = 'empty' | 'reupload' | 'pending' | 'accepted'

/** The category's own files (not folders). */
export const categoryFiles = (files: FileSystemItem[] | undefined) => (files ?? []).filter((f) => !f.isDirectory)

export const isUsableDocument = (file: FileSystemItem) =>
  !file.isDirectory && file.reviewStatus !== DOCUMENT_STATUS.REJECTED

export function documentCategoryState(files: FileSystemItem[] | undefined): DocumentCategoryState {
  const own = categoryFiles(files)
  if (!own.length) return 'empty'
  if (own.some((f) => f.reviewStatus === DOCUMENT_STATUS.ACCEPTED)) return 'accepted'
  return own.some(isUsableDocument) ? 'pending' : 'reupload'
}

/** Counts towards "x of N uploaded" and the next step: accepted or pending, as the API counts. */
export const isCategoryUploaded = (state: DocumentCategoryState) => state === 'accepted' || state === 'pending'

/** What the category list and heading say for each state. */
export const DOCUMENT_REUPLOAD_LABEL = 'Re-upload needed'
export const DOCUMENT_PENDING_LABEL = 'Pending review'
export const DOCUMENT_ACCEPTED_LABEL = 'Accepted'
