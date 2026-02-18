"use client";

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, AlertCircle, User, MapPin, Upload, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import NextImage from 'next/image';
import AdminActions from '../../../admin-actions';
import { AssigneeInput } from '@/components/AssigneeInput';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { toast } from 'sonner';
import { ImageLightbox } from '@/components/ImageLightbox';

interface Ticket {
    id: string;
    ticketNumber: string;
    title: string | null;
    description: string | null;
    department: string | null;
    location: string | null;
    typeOfDamage: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    adminNotes?: string | null;
    informationBy?: string | null;
    assignTo?: string | null;
    images?: TicketImage[];
    user?: {
        username?: string | null;
        position?: string | null;
        telephoneExtension?: string | null;
    };
}

interface TicketImage {
    id: string;
    ticket_id: string;
    image_url: string;
    image_name: string;
    is_completion_image: boolean;
    created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    IN_PROGRESS: 'On Process',
    ON_HOLD: 'On Hold',
    DONE: 'Done',
    CANCEL: 'Cancel',
};

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'NEW': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'ON_HOLD': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'DONE': return 'bg-green-100 text-green-700 border-green-200';
        case 'CANCELLED':
        case 'CANCEL': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getStatusLabel = (status: string) =>
    STATUS_LABELS[status?.toUpperCase()] || status || 'Unknown';

export default function TicketDetailsPage() {
    const params = useParams();
    const ticketId = params.id as string;
    return <TicketDetailsContent ticketId={ticketId} />;
}

function TicketDetailsContent({ ticketId }: { ticketId: string }) {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatorName, setCreatorName] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminImages, setAdminImages] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [userImages, setUserImages] = useState<TicketImage[]>([]);
    const [adminCompletionImages, setAdminCompletionImages] = useState<TicketImage[]>([]);
    const [adminNotes, setAdminNotes] = useState('');
    const [informationBy, setInformationBy] = useState('');
    const [assignTo, setAssignTo] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<Array<{ url: string; name: string }>>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const fetchTicket = useCallback(async () => {
        try {
            setLoading(true);

            // Check user role using API
            const sessionResult = await apiClient.auth.getUser();
            if (sessionResult.success && sessionResult.data?.user) {
                const userRole = sessionResult.data.user.role;
                setIsAdmin(userRole === 'ADMIN' || userRole === 'ENGINEER_ADMIN');
            }

            // Fetch ticket using API
            const result = await apiClient.engineerTickets.get(ticketId);

            if (!result.success || !result.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const errorMsg = (result as any).error;
                throw new Error(errorMsg || 'Failed to fetch ticket');
            }

            setTicket(result.data);
            setAdminNotes(result.data.adminNotes || '');
            setInformationBy(result.data.informationBy || '');
            setAssignTo(result.data.assignTo || '');

            // Set creator name from ticket data
            if (result.data.user?.username) {
                setCreatorName(result.data.user.username);
            } else {
                setCreatorName('Unknown User');
            }

            // Fetch images (already included in ticket data from API)
            const images = result.data.images || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const typedImages = images.map((img: any) => {
                const fileName =
                    img.originalName ||
                    img.imageUrl?.split('/')?.pop() ||
                    'image.jpg';

                return {
                    id: img.id,
                    ticket_id: img.ticketId,
                    image_url: img.imageUrl,
                    image_name: fileName,
                    is_completion_image: img.isCompletion,
                    is_admin_upload: img.isCompletion,
                    created_at: img.createdAt,
                };
            }) as unknown as TicketImage[];

            setUserImages(typedImages.filter(img => !img.is_completion_image));
            setAdminCompletionImages(typedImages.filter(img => img.is_completion_image));
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    const handleAdminImageUpload = async () => {
        if (adminImages.length === 0) return;

        setUploadingImages(true);
        try {
            const { uploadEngineerTicketImages } = await import('@/lib/imageUpload');
            const result = await uploadEngineerTicketImages(ticketId, adminImages, true);

            if (result.success) {
                toast.success('Images uploaded successfully!');
                setAdminImages([]);
                // Reset file input
                const fileInput = document.getElementById('adminImageUpload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                // Refresh ticket data to show new images
                await fetchTicket();
            } else {
                toast.error(`Failed to upload images: ${result.error}`);
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleDeleteImage = (imageId: string) => {
        setImageToDelete(imageId);
        setSelectedImages([imageId]);
        setDeleteReason('');
        setShowDeleteDialog(true);
    };

    const handleBulkDelete = () => {
        if (selectedImages.length === 0) {
            toast.error('Please select at least one image to delete');
            return;
        }
        setImageToDelete(null);
        setDeleteReason('');
        setShowDeleteDialog(true);
    };

    const toggleImageSelection = (imageId: string) => {
        setSelectedImages(prev =>
            prev.includes(imageId)
                ? prev.filter(id => id !== imageId)
                : [...prev, imageId]
        );
    };

    const confirmDeleteImage = async () => {
        const imagesToDelete = imageToDelete ? [imageToDelete] : selectedImages;

        if (imagesToDelete.length === 0) return;
        if (!deleteReason.trim()) {
            toast.error('Please provide a reason for deletion');
            return;
        }

        setDeletingImageId('bulk');
        setShowDeleteDialog(false);

        try {
            // Delete all selected images
            const deletePromises = imagesToDelete.map(async (imageId) => {
                try {
                    const response = await fetch(`/api/engineer-tickets/${ticketId}/images/${imageId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ reason: deleteReason }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error(`Failed to delete image ${imageId}:`, error);
                        return { success: false, imageId, error: error.error || 'Unknown error' };
                    }

                    return { success: true, imageId };
                } catch (error) {
                    console.error(`Error deleting image ${imageId}:`, error);
                    return { success: false, imageId, error: String(error) };
                }
            });

            const results = await Promise.all(deletePromises);
            const successCount = results.filter(r => r.success).length;
            const failedResults = results.filter(r => !r.success);

            if (failedResults.length === 0) {
                toast.success(`${successCount} image(s) deleted successfully!`);
                await fetchTicket();
                setSelectedImages([]);
            } else {
                console.error('Failed deletions:', failedResults);
                toast.error(`${failedResults.length} image(s) failed to delete. Check console for details.`);
                // Refresh to show current state
                await fetchTicket();
                // Remove successfully deleted images from selection
                const failedIds = failedResults.map(r => r.imageId);
                setSelectedImages(prev => prev.filter(id => failedIds.includes(id)));
            }
        } catch (error) {
            console.error('Error deleting images:', error);
            toast.error('Failed to delete images');
        } finally {
            setDeletingImageId(null);
            setImageToDelete(null);
            setDeleteReason('');
        }
    };

    const removeSelectedImage = (index: number) => {
        setAdminImages(prev => prev.filter((_, i) => i !== index));
    };

    // Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (!isAdmin) return;

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
            setAdminImages(prev => [...prev, ...imageFiles]);
            toast.success(`${imageFiles.length} image(s) pasted from clipboard`);
        }
    }, [isAdmin]);

    // Add paste event listener
    useEffect(() => {
        if (isAdmin) {
            document.addEventListener('paste', handlePaste);
            return () => {
                document.removeEventListener('paste', handlePaste);
            };
        }
    }, [isAdmin, handlePaste]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-black">Loading ticket details...</div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-white p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/engineer" className="inline-flex items-center text-sm text-black hover:text-green-600 mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Engineer Dashboard
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-green-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-green-100 bg-green-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-black bg-white px-2 py-1 rounded border border-green-200">
                                    {ticket.ticketNumber || `#${ticket.id.slice(0, 8)}`}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                    {getStatusLabel(ticket.status)}
                                </span>
                            </div>
                            <div className="text-sm text-black flex items-center">
                                <Calendar size={14} className="mr-1.5" />
                                {new Date(ticket.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">{ticket.title}</h1>
                    </div>

                    {/* Content */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">Description</h3>
                                <div className="prose max-w-none text-black bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <p className="whitespace-pre-wrap">{ticket.description || 'No description provided'}</p>
                                </div>
                            </div>

                            {/* User Attached Images Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">Attached Images</h3>
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    {userImages.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {userImages.map((img) => (
                                                <div key={img.id} className="group">
                                                    <div className="relative aspect-square w-full mb-1">
                                                        <NextImage
                                                            src={img.image_url}
                                                            alt={img.image_name}
                                                            fill
                                                            className="object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => {
                                                                const images = userImages.map(i => ({ url: i.image_url, name: i.image_name }));
                                                                setLightboxImages(images);
                                                                setLightboxIndex(userImages.findIndex(i => i.id === img.id));
                                                                setLightboxOpen(true);
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-black truncate" title={img.image_name}>{img.image_name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-2 text-black">
                                                <ImageIcon size={20} className="text-green-600" />
                                                <p className="text-sm">No images attached</p>
                                            </div>
                                            <p className="text-xs text-black mt-2 opacity-70">User did not upload any images</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Admin Image Upload Section */}
                            {isAdmin && (
                                <div>
                                    <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">Admin - Upload Completion Images</h3>
                                    <div className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm">
                                        {/* Upload Area */}
                                        <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:bg-green-50 hover:border-green-400 transition-all">
                                            <input
                                                type="file"
                                                id="adminImageUpload"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        setAdminImages(prev => [...prev, ...Array.from(e.target.files!)]);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <label htmlFor="adminImageUpload" className="cursor-pointer block">
                                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                    <Upload size={28} />
                                                </div>
                                                <p className="text-sm text-black font-semibold mb-1">Click to upload or Ctrl+V to paste</p>
                                                <p className="text-xs text-gray-600">PNG, JPG, JPEG, GIF, WebP (Max 10MB each)</p>
                                            </label>
                                        </div>

                                        {/* Selected Images Preview */}
                                        {adminImages.length > 0 && (
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-semibold text-black">Selected images ({adminImages.length})</p>
                                                    <button
                                                        onClick={() => setAdminImages([])}
                                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                                    {adminImages.map((file, index) => (
                                                        <div key={index} className="relative group">
                                                            <div className="aspect-square w-full bg-gray-100 rounded-lg border-2 border-green-200 overflow-hidden">
                                                                <NextImage
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={file.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => removeSelectedImage(index)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove image"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                            <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={handleAdminImageUpload}
                                                    disabled={uploadingImages}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                >
                                                    {uploadingImages ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Uploading...
                                                        </span>
                                                    ) : (
                                                        `Upload ${adminImages.length} ${adminImages.length === 1 ? 'Image' : 'Images'}`
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Display Admin Completion Images */}
                                        {adminCompletionImages.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-green-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                                                        <ImageIcon size={16} className="text-green-600" />
                                                        Completion Images ({adminCompletionImages.length})
                                                    </h4>
                                                    {selectedImages.length > 0 && (
                                                        <button
                                                            onClick={handleBulkDelete}
                                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete {selectedImages.length} Selected
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {adminCompletionImages.map((img) => (
                                                        <div key={img.id} className="group relative">
                                                            {/* Checkbox */}
                                                            <div className="absolute top-2 left-2 z-10">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedImages.includes(img.id)}
                                                                    onChange={() => toggleImageSelection(img.id)}
                                                                    className="w-5 h-5 rounded border-2 border-white shadow-lg cursor-pointer accent-green-600"
                                                                />
                                                            </div>
                                                            <div className="relative aspect-square w-full mb-1 overflow-hidden rounded-lg border-2 border-green-200">
                                                                <NextImage
                                                                    src={img.image_url}
                                                                    alt={img.image_name}
                                                                    fill
                                                                    className="object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                    onClick={() => {
                                                                        const images = adminCompletionImages.map(i => ({ url: i.image_url, name: i.image_name }));
                                                                        setLightboxImages(images);
                                                                        setLightboxIndex(adminCompletionImages.findIndex(i => i.id === img.id));
                                                                        setLightboxOpen(true);
                                                                    }}
                                                                />
                                                                {/* Delete Button */}
                                                                <button
                                                                    onClick={() => handleDeleteImage(img.id)}
                                                                    disabled={deletingImageId === img.id}
                                                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                                                    title="Delete image"
                                                                >
                                                                    {deletingImageId === img.id ? (
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <Trash2 size={16} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-gray-600 truncate" title={img.image_name}>{img.image_name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Details</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-black block mb-1">Area</label>
                                        <div className="flex items-center font-medium text-black">
                                            <MapPin size={16} className="mr-2 text-green-600" />
                                            {ticket.location || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Location</label>
                                        <div className="flex items-center font-medium text-black">
                                            <MapPin size={16} className="mr-2 text-green-600" />
                                            {ticket.title || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Department</label>
                                        <div className="flex items-center font-medium text-black">
                                            <User size={16} className="mr-2 text-green-600" />
                                            {ticket.department || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Requested By</label>
                                        <div className="flex items-center font-medium text-black">
                                            <User size={16} className="mr-2 text-green-600" />
                                            {creatorName || 'Loading...'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Position</label>
                                        <div className="flex items-center font-medium text-black">
                                            <User size={16} className="mr-2 text-green-600" />
                                            {ticket.user?.position || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Telephone Extension</label>
                                        <div className="flex items-center font-medium text-black">
                                            <User size={16} className="mr-2 text-green-600" />
                                            {ticket.user?.telephoneExtension || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-black block mb-1">Type of Damage</label>
                                        <div className="flex items-center font-medium text-black">
                                            <AlertCircle size={16} className="mr-2 text-green-600" />
                                            {ticket.typeOfDamage || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin/User Info Section */}
                            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
                                <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
                                    {isAdmin ? 'Admin Actions' : 'Ticket Status'}
                                </h3>

                                {/* Current Status */}
                                <div className="mb-4">
                                    <label className="text-sm text-black block mb-2">Current Status:</label>
                                    {isAdmin ? (
                                        <AdminActions
                                            ticketId={ticket.id}
                                            currentStatus={ticket.status?.toUpperCase() || 'NEW'}
                                            onUpdate={fetchTicket}
                                            tableName="engineer_tickets"
                                            assignTo={assignTo}
                                            adminNotes={adminNotes}
                                            savedAssignTo={ticket.assignTo}
                                            savedAdminNotes={ticket.adminNotes}
                                        />
                                    ) : (
                                        <div className={`px-4 py-2 rounded-xl border-2 font-medium text-sm text-center ${getStatusColor(ticket.status)}`}>
                                            {getStatusLabel(ticket.status)}
                                        </div>
                                    )}
                                </div>

                                {/* Assign To */}
                                <div className="mb-4">
                                    <label className="text-sm text-black block mb-2">
                                        Assign To:
                                    </label>
                                    {isAdmin ? (
                                        <AssigneeInput
                                            value={assignTo}
                                            onChange={setAssignTo}
                                            placeholder="Type assignee name..."
                                            className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                                            type="Engineer"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-black">
                                            {ticket.assignTo || 'Not assigned yet'}
                                        </div>
                                    )}
                                </div>

                                {/* Admin Notes - Visible to all, editable only by admin */}
                                {(isAdmin || ticket.adminNotes) && (
                                    <div>
                                        <label className="text-sm text-black block mb-2">
                                            {isAdmin ? 'Admin Notes:' : 'Notes from Admin:'}
                                        </label>
                                        {isAdmin ? (
                                            <>
                                                <textarea
                                                    value={adminNotes}
                                                    onChange={(e) => setAdminNotes(e.target.value)}
                                                    placeholder="Add internal notes here..."
                                                    rows={4}
                                                    className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all resize-none"
                                                />

                                                <label className="text-sm text-black block mt-4 mb-2">
                                                    Information by:
                                                </label>
                                                <select
                                                    value={informationBy}
                                                    onChange={(e) => setInformationBy(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                                                >
                                                    <option value="">Select information source</option>
                                                    <option value="By Walk">By Walk</option>
                                                    <option value="By Phone">By Phone</option>
                                                    <option value="By Line">By Line</option>
                                                    <option value="By E.Work Order/ Paper">By E.Work Order/ Paper</option>
                                                    <option value="By 60 Points">By 60 Points</option>
                                                    <option value="By Other">By Other</option>
                                                </select>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div>
                                                        {savingNotes && (
                                                            <p className="text-xs text-green-600">Saving...</p>
                                                        )}
                                                        {!savingNotes && ticket.updatedAt && (
                                                            <p className="text-xs text-black">
                                                                Last updated: {new Date(ticket.updatedAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={async () => {

                                                            // Check if anything has changed
                                                            const assignToChanged = assignTo !== (ticket.assignTo || '');
                                                            const notesChanged = adminNotes !== (ticket.adminNotes || '');
                                                            const informationByChanged = informationBy !== (ticket.informationBy || '');

                                                            if (!assignToChanged && !notesChanged && !informationByChanged) {
                                                                return;
                                                            }

                                                            setSavingNotes(true);
                                                            try {
                                                                const result = await apiClient.engineerTickets.update(ticket.id, {
                                                                    assignTo: assignTo,
                                                                    adminNotes: adminNotes,
                                                                    informationBy: informationBy,
                                                                });

                                                                if (!result.success) {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    throw new Error((result as any).error || 'Failed to save');
                                                                }
                                                                await fetchTicket();
                                                                toast.success('Saved successfully!');
                                                            } catch (error) {
                                                                console.error('Error saving:', error);
                                                                toast.error('Failed to save');
                                                            } finally {
                                                                setSavingNotes(false);
                                                            }
                                                        }}
                                                        disabled={savingNotes}
                                                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {savingNotes ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-black whitespace-pre-wrap">
                                                    {ticket.adminNotes || 'No notes from admin yet.'}
                                                </div>

                                                {ticket.informationBy && (
                                                    <div className="mt-4">
                                                        <label className="text-sm text-black block mb-2">
                                                            Information by:
                                                        </label>
                                                        <div className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-black">
                                                            {ticket.informationBy}
                                                        </div>
                                                    </div>
                                                )}
                                                {ticket.updatedAt && (
                                                    <p className="text-xs text-black mt-2">
                                                        Last updated: {new Date(ticket.updatedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Admin Completion Images - Visible to users only (admin sees it in main section) */}
                                {!isAdmin && adminCompletionImages.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-green-100">
                                        <h4 className="text-sm font-medium text-black mb-3">
                                            Completion Photos from Admin
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {adminCompletionImages.map((img) => (
                                                <div key={img.id} className="group">
                                                    <div className="relative aspect-square w-full mb-1">
                                                        <NextImage
                                                            src={img.image_url}
                                                            alt={img.image_name}
                                                            fill
                                                            className="object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => {
                                                                const images = adminCompletionImages.map(i => ({ url: i.image_url, name: i.image_name }));
                                                                setLightboxImages(images);
                                                                setLightboxIndex(adminCompletionImages.findIndex(i => i.id === img.id));
                                                                setLightboxOpen(true);
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-black truncate" title={img.image_name}>{img.image_name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                {ticket && <ActivityTimeline ticketId={ticket.id} ticketType="engineer" />}

                {/* Image Lightbox */}
                {lightboxOpen && (
                    <ImageLightbox
                        images={lightboxImages}
                        currentIndex={lightboxIndex}
                        onClose={() => setLightboxOpen(false)}
                        onNext={() => setLightboxIndex(prev => Math.min(prev + 1, lightboxImages.length - 1))}
                        onPrevious={() => setLightboxIndex(prev => Math.max(prev - 1, 0))}
                    />
                )}

                {/* Delete Reason Dialog */}
                {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteDialog(false)}>
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold text-black mb-4">
                                Delete {imageToDelete ? '1' : selectedImages.length} Image{selectedImages.length > 1 ? 's' : ''} - Reason Required
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">Please provide a reason for deleting {imageToDelete ? 'this' : 'these'} completion image{selectedImages.length > 1 ? 's' : ''}:</p>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="e.g., Wrong image uploaded, Duplicate, Poor quality, etc."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-black"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowDeleteDialog(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteImage}
                                    disabled={!deleteReason.trim() || deletingImageId === 'bulk'}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deletingImageId === 'bulk' ? 'Deleting...' : `Delete Image${selectedImages.length > 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
