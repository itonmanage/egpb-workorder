import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { FILE_UPLOAD } from '@/lib/constants';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

interface FileUploadProps {
    label: string;
    files: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number;
    accept?: string;
    error?: string;
}

export function FileUpload({
    label,
    files,
    onChange,
    maxFiles = FILE_UPLOAD.MAX_FILES,
    maxSize = FILE_UPLOAD.MAX_FILE_SIZE,
    accept = FILE_UPLOAD.ACCEPTED_EXTENSIONS.join(','),
    error,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previews, setPreviews] = useState<{ [key: string]: string }>({});

    const handleFileChange = async (selectedFiles: FileList | File[]) => {
        const fileArray = Array.from(selectedFiles);
        const validFiles: File[] = [];
        const errors: string[] = [];

        fileArray.forEach((file) => {
            if (file.size > maxSize) {
                errors.push(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
            } else if (files.length + validFiles.length >= maxFiles) {
                errors.push(`Maximum ${maxFiles} files allowed`);
            } else {
                validFiles.push(file);
                // Generate preview for images
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPreviews(prev => ({ ...prev, [file.name]: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                }
            }
        });

        if (errors.length > 0) {
            const { toast } = await import('sonner');
            toast.error(errors[0]);
        }

        if (validFiles.length > 0) {
            onChange([...files, ...validFiles]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        handleFileChange(e.target.files);
    };

    const removeFile = (index: number) => {
        const fileToRemove = files[index];
        const newFiles = files.filter((_, i) => i !== index);
        onChange(newFiles);

        // Remove preview
        setPreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[fileToRemove.name];
            return newPreviews;
        });
    };

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFileChange(droppedFiles);
        }
    };

    // Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    // Create a new file with a meaningful name
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const extension = file.type.split('/')[1] || 'png';
                    const newFile = new File([file], `pasted-image-${timestamp}.${extension}`, { type: file.type });
                    imageFiles.push(newFile);
                }
            }
        }

        if (imageFiles.length > 0) {
            handleFileChange(imageFiles);
            toast.success(`${imageFiles.length} image(s) pasted from clipboard`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Add paste event listener
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-black mb-2">{label}</label>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${error
                    ? 'border-red-300 bg-red-50'
                    : isDragging
                        ? 'border-green-500 bg-green-100 scale-[1.02]'
                        : 'border-green-200 hover:bg-green-50'
                    }`}
            >
                <input
                    type="file"
                    id="fileUpload"
                    multiple
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                />
                <label htmlFor="fileUpload" className="cursor-pointer block">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${isDragging ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                        }`}>
                        <Upload size={24} />
                    </div>
                    <p className="text-sm text-black font-medium">
                        {isDragging ? 'Drop files here' : 'Click to upload, drag and drop, or Ctrl+V to paste'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG, GIF, WebP (max {maxSize / 1024 / 1024}MB, {maxFiles} files)
                    </p>
                </label>

                {files.length > 0 && (
                    <div className="mt-6 text-left">
                        <p className="text-sm font-medium text-black mb-3">
                            Selected files ({files.length}/{maxFiles}):
                        </p>

                        {/* Image Preview Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 transition-colors"
                                >
                                    {/* Image Preview or Icon */}
                                    {previews[file.name] ? (
                                        <div className="aspect-square bg-gray-100 relative">
                                            <Image
                                                src={previews[file.name]}
                                                alt={file.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                            <ImageIcon size={32} className="text-gray-400" />
                                        </div>
                                    )}

                                    {/* File Info Overlay */}
                                    <div className="p-2 bg-white border-t border-gray-200">
                                        <p className="text-xs text-black truncate font-medium">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Remove file"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
