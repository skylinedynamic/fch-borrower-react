import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { createFolder, deleteItems, downloadFile } from '../../../src/modules/filemanager/services'

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

describe('createFolder', () => {
  it('normalizes the root path "/" to null', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/filemanager/folder', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ data: { name: 'New Folder', path: '/New Folder' } })
      })
    )
    await createFolder('New Folder', '/')
    expect(receivedBody.path).toBeNull()
  })

  it('passes a non-root path through unchanged', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/filemanager/folder', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ data: { name: 'Sub', path: '/docs/Sub' } })
      })
    )
    await createFolder('Sub', '/docs')
    expect(receivedBody.path).toBe('/docs')
  })
})

describe('deleteItems', () => {
  it('returns the success flag', async () => {
    server.use(http.post('*/filemanager/delete', () => HttpResponse.json({ success: true })))
    await expect(deleteItems(['/docs/file.pdf'])).resolves.toBe(true)
  })
})

describe('downloadFile', () => {
  it('creates a blob URL, triggers a click, and cleans up', async () => {
    server.use(http.post('*/filemanager/download', () => new HttpResponse('file-bytes', { status: 200 })))

    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    window.URL.createObjectURL = createObjectURL as any
    window.URL.revokeObjectURL = revokeObjectURL as any
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    await downloadFile('/docs/report.pdf', 'report.pdf')

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('rethrows and logs on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.post('*/filemanager/download', () => HttpResponse.error()))
    await expect(downloadFile('/docs/report.pdf', 'report.pdf')).rejects.toBeTruthy()
  })
})
