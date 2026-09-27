import { toast } from 'react-toastify';

export const getMimeType = (fileName: string): string => {
    if (!fileName) return 'application/octet-stream';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv',
        zip: 'application/zip', rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
        txt: 'text/plain', json: 'application/json', xml: 'application/xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

export const downloadBlob = (blob: Blob, fileName: string, mimeType?: string) => {
    const finalMimeType = mimeType || getMimeType(fileName);
    const finalBlob = blob instanceof Blob ? blob : new Blob([blob], { type: finalMimeType });

    const url = window.URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        // May fire after a torn-down test environment, where the globals are gone.
        if (typeof document === 'undefined') return;
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Download file from URL using fetch (prevents browser redirect on 404)
 * Shows toast error if URL is missing, not found, or download fails
 */
export const downloadFileFromUrl = async (url: string, fileName: string): Promise<void> => {
    if (!url) {
        toast.error('Download failed: file URL is missing.');
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            toast.error(`Download failed: file not found (${response.status}).`);
            return;
        }
        const blob = await response.blob();
        downloadBlob(blob, fileName);
    } catch (error) {
        console.error('Download failed:', error);
        toast.error('Download failed');
    }
}

export const handleFileDownload = async (
    downloadFn: () => Promise<any>,
    fileName: string,
    filePath?: string
): Promise<void> => {
    try {
        const response = await downloadFn();
        let blob: Blob;
        if (response.data instanceof Blob) {
            blob = response.data;
        } else {
            const mimeType = getMimeType(fileName);
            blob = new Blob([response.data], { type: mimeType });
        }
        downloadBlob(blob, fileName);
    } catch (error) {
        console.error("Download failed via API", error);
        if (filePath) {
            await downloadFileFromUrl(filePath, fileName);
        } else {
            toast.error('Download failed');
        }
    }
};
