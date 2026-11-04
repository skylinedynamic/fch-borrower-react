import { describe, expect, it } from 'vitest'
import { FILE_MANAGER_ACCEPT, FILE_MANAGER_CONFIG, fileRejectionReason, maxUploadSizeFor } from '../../../src/modules/filemanager/config'

const file = (name: string, size = 1024) => new File([new Uint8Array(size)], name)

/**
 * BUG-015 (QA round 2): an SVG can carry a <script> that runs when the file is
 * opened, so it is not a document. The API refuses it (config/uploads.php);
 * the picker refuses it first so nobody waits for an upload to fail.
 */
describe('file manager upload types', () => {
  it('refuses an SVG, as the API does', () => {
    expect(fileRejectionReason(file('qa-r2-logo.svg'))).toMatch(/not an allowed file type \(\.svg\)/)
    expect(FILE_MANAGER_ACCEPT.split(',')).not.toContain('.svg')
  })

  it('still takes documents and ordinary images', () => {
    expect(fileRejectionReason(file('bank statement.pdf'))).toBeNull()
    expect(fileRejectionReason(file('license.JPG'))).toBeNull()
    expect(fileRejectionReason(file('taxes.xlsx'))).toBeNull()
  })

  it('refuses HTML and files with no extension', () => {
    expect(fileRejectionReason(file('page.html'))).toMatch(/not an allowed file type/)
    expect(fileRejectionReason(file('README'))).toMatch(/not an allowed file type/)
  })
})

/**
 * BUG-014 (QA round 2): a 12 MB file named .png was accepted and could be set
 * as a profile picture. The API now takes a picture up to 5 MB and anything
 * else up to 20 MB (config/uploads.php); the picker refuses larger files first.
 */
describe('file manager size limits', () => {
  const MB = 1024 * 1024

  it('allows a picture up to 5 MB and any other file up to 20 MB', () => {
    expect(maxUploadSizeFor('photo.PNG')).toBe(5 * MB)
    expect(maxUploadSizeFor('statement.pdf')).toBe(20 * MB)
    expect(FILE_MANAGER_CONFIG.MAX_PICTURE_SIZE).toBe(5 * MB)
  })

  it("refuses QA's 12 MB .png and a 6 MB picture, but not a 6 MB PDF", () => {
    expect(fileRejectionReason(file('qa-12mb.png', 12 * MB))).toBe('"qa-12mb.png" exceeds the 5MB limit.')
    expect(fileRejectionReason(file('scan.jpg', 6 * MB))).toBe('"scan.jpg" exceeds the 5MB limit.')
    expect(fileRejectionReason(file('statement.pdf', 6 * MB))).toBeNull()
    expect(fileRejectionReason(file('statement.pdf', 20 * MB + 1))).toBe('"statement.pdf" exceeds the 20MB limit.')
  })
})
