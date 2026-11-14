import { useEffect, useState } from 'react';
import { useResourceFile } from '../../../modules/resources';

interface ResourceFilePreviewProps {
  resourceId: number | string;
  title: string;
  className?: string;
}

/**
 * Shows a resource's PDF (R3-BUG-003). The file is private: its signed link
 * can't be framed (the API sends frame-ancestors 'self'), so the file is read
 * through the API and shown from a local blob: link, released on close.
 */
export default function ResourceFilePreview({ resourceId, title, className = '' }: ResourceFilePreviewProps) {
  const { data: file, isError } = useResourceFile(resourceId);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
      setSrc(null);
    };
  }, [file]);

  if (isError) {
    return (
      <div className={`resource-modal-empty flex-grow-1 ${className}`}>
        <div className="text-center">
          <p className="fw-bold fs-15 text-dark mb-1">The preview could not be loaded.</p>
          <p className="text-muted fs-13 mb-0">Click Download to save this file to your device.</p>
        </div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`resource-modal-empty flex-grow-1 ${className}`}>
        <div className="spinner-border rh-text-brand" role="status">
          <span className="visually-hidden">Loading preview...</span>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={`${src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
      className={`resource-modal-iframe flex-grow-1 ${className}`}
      title={title}
      width="100%"
      height="100%"
    />
  );
}
