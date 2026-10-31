import { describe, expect, it } from 'vitest'
import { FILE_MANAGER_ACCEPT, fileRejectionReason } from '../../../src/modules/filemanager/config'

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
