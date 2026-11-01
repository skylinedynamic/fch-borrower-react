import { describe, expect, it } from 'vitest'
import { documentCategoryState, isCategoryUploaded, isUsableDocument } from '../../src/utils/documentProgress'
import type { FileSystemItem } from '../../src/modules/filemanager/types'

const file = (reviewStatus?: string, isDirectory = false) => ({ name: 'f.pdf', isDirectory, reviewStatus }) as unknown as FileSystemItem

describe('documentCategoryState (BUG-135)', () => {
  it('is empty with no files, or only folders', () => {
    expect(documentCategoryState(undefined)).toBe('empty')
    expect(documentCategoryState([file(undefined, true)])).toBe('empty')
  })

  it('needs a re-upload when every file is rejected', () => {
    expect(documentCategoryState([file('Rejected')])).toBe('reupload')
    expect(documentCategoryState([file('Rejected'), file('Rejected')])).toBe('reupload')
  })

  it('is accepted once any file is accepted', () => {
    expect(documentCategoryState([file('Rejected'), file('Accepted')])).toBe('accepted')
    expect(documentCategoryState([file('Uploaded'), file('Accepted')])).toBe('accepted')
  })

  // A pending file isn't shown as accepted - only "uploaded, waiting for review".
  it('is pending while its usable files still wait for review', () => {
    expect(documentCategoryState([file('Uploaded')])).toBe('pending')
    expect(documentCategoryState([file('Under Review')])).toBe('pending')
    expect(documentCategoryState([file(undefined)])).toBe('pending')
    expect(documentCategoryState([file('Rejected'), file('Pending')])).toBe('pending')
  })

  it('counts accepted and pending as uploaded, as the API does, and nothing else', () => {
    expect(isCategoryUploaded('accepted')).toBe(true)
    expect(isCategoryUploaded('pending')).toBe(true)
    expect(isCategoryUploaded('reupload')).toBe(false)
    expect(isCategoryUploaded('empty')).toBe(false)
  })

  it('never counts a rejected file or a folder as usable', () => {
    expect(isUsableDocument(file('Rejected'))).toBe(false)
    expect(isUsableDocument(file('Accepted', true))).toBe(false)
    expect(isUsableDocument(file('Pending'))).toBe(true)
  })
})
