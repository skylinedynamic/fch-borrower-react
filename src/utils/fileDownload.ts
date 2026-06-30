export const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

export const downloadFileFromUrl = async (url: string, fileName: string) => {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Network response was not ok')
        const blob = await response.blob()
        downloadBlob(blob, fileName)
    } catch (error) {
        console.error('Download failed:', error)
        // Fallback to opening in new tab
        window.open(url, '_blank')
    }
}
