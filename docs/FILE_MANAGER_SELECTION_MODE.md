# File Manager Selection Mode - Usage Guide

## Overview

The file manager now supports **Selection Mode**, allowing you to use it as a file picker for any section of your application (driver license, documents, etc.).

## How to Use

### Basic Example

```tsx
import { useState } from "react";
import { FileManagerModal } from "./components/FileManagerModal/FileManagerModal";
import type { FileSystemItem } from "./modules/filemanager/types";

function DriverLicenseUpload() {
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);

  const handleSelectFiles = (files: FileSystemItem[]) => {
    // Get the first selected file
    if (files.length > 0) {
      setSelectedFile(files[0]);
      console.log("Selected file:", files[0]);
      // You can now use the file URL: files[0].url
      // Or file path: files[0].path
    }
  };

  return (
    <div>
      <h3>Driver License</h3>

      {/* Show selected file */}
      {selectedFile && (
        <div>
          <p>Selected: {selectedFile.name}</p>
          {selectedFile.url && (
            <img
              src={selectedFile.url}
              alt={selectedFile.name}
              style={{ maxWidth: 200 }}
            />
          )}
        </div>
      )}

      {/* Button to open file manager */}
      <button onClick={() => setIsFileManagerOpen(true)}>
        Select File from Manager
      </button>

      {/* File Manager Modal in Selection Mode */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        toggle={() => setIsFileManagerOpen(false)}
        section="documents"
        selectionMode={true}
        onSelectFiles={handleSelectFiles}
      />
    </div>
  );
}
```

### Multiple File Selection Example

```tsx
function DocumentsUpload() {
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileSystemItem[]>([]);

  const handleSelectFiles = (files: FileSystemItem[]) => {
    setSelectedFiles(files);
    // Files array contains all selected files
    console.log("Selected files:", files);
  };

  return (
    <div>
      <h3>Upload Documents</h3>

      {/* Show selected files */}
      {selectedFiles.length > 0 && (
        <div>
          <p>Selected {selectedFiles.length} file(s):</p>
          <ul>
            {selectedFiles.map((file) => (
              <li key={file.path}>
                {file.name} -{" "}
                <a href={file.url} target="_blank">
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Button to open file manager */}
      <button onClick={() => setIsFileManagerOpen(true)}>Select Files</button>

      {/* File Manager Modal */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        toggle={() => setIsFileManagerOpen(false)}
        selectionMode={true}
        onSelectFiles={handleSelectFiles}
      />
    </div>
  );
}
```

## Props

### FileManagerModal Props

| Prop            | Type                                | Required | Description                                   |
| --------------- | ----------------------------------- | -------- | --------------------------------------------- |
| `isOpen`        | `boolean`                           | Yes      | Controls modal visibility                     |
| `toggle`        | `() => void`                        | Yes      | Function to close modal                       |
| `section`       | `string`                            | No       | Section name for API calls                    |
| `initialPath`   | `string`                            | No       | Initial directory path (default: `/`)         |
| `selectionMode` | `boolean`                           | No       | Enable file selection mode (default: `false`) |
| `onSelectFiles` | `(files: FileSystemItem[]) => void` | No       | Callback when files are selected              |

## Selection Mode Behavior

### When `selectionMode={true}`:

**What Users Can Do:**

- ✅ Browse folders
- ✅ Select files (click to select, Ctrl+Click for multiple)
- ✅ Click "Select" button to confirm selection
- ✅ Click "Cancel" to close without selecting

**What Users Cannot Do:**

- ❌ Upload new files (Upload button hidden)
- ❌ Create folders (New Folder button hidden)
- ❌ Delete files (Delete option disabled)
- ❌ Rename files (Rename option disabled)
- ❌ Right-click context menu (disabled)

### When `selectionMode={false}` (default):

Full file management capabilities:

- Upload, create, rename, delete, copy, move, download

## File Data Structure

When files are selected, you receive an array of `FileSystemItem`:

```typescript
interface FileSystemItem {
  name: string; // File name
  path: string; // Full path
  isDirectory: boolean; // true if folder, false if file
  updatedAt: string; // Last modified date
  size?: number; // File size in bytes
  type?: string; // MIME type
  url?: string; // Public URL for the file
}
```

## Use Cases

**Driver License Upload:**

```tsx
<FileManagerModal
  isOpen={open}
  toggle={toggle}
  section="documents"
  selectionMode={true}
  onSelectFiles={(files) => setDriverLicense(files[0])}
/>
```

**Profile Picture:**

```tsx
<FileManagerModal
  isOpen={open}
  toggle={toggle}
  section="profile-images"
  selectionMode={true}
  onSelectFiles={(files) => setProfilePicture(files[0])}
/>
```

**Document Attachments:**

```tsx
<FileManagerModal
  isOpen={open}
  toggle={toggle}
  section="documents"
  selectionMode={true}
  onSelectFiles={(files) => setAttachments(files)}
/>
```

## Tips

1. **Only Files are Selectable** - Folders cannot be selected in selection mode
2. **Multiple Selection** - Users can select multiple files with Ctrl+Click
3. **Selection Count** - The Select button shows count: "Select (3)"
4. **Auto-Close** - Modal automatically closes after selection
5. **Cancel Anytime** - Users can cancel selection without picking files
