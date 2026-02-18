import { TicketType } from './types';

/**
 * Unified image upload function for both IT and Engineer tickets
 */
export async function uploadImages(
    ticketType: TicketType,
    ticketId: string,
    files: File[],
    isAdminUpload: boolean = false
): Promise<{ success: boolean; imageUrls: string[]; error?: string }> {
    try {
        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));
        formData.append('ticketId', ticketId);
        formData.append('isAdminUpload', String(isAdminUpload));
        if (ticketType === 'engineer') {
            formData.append('type', 'engineer');
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageUrls = (result.data?.images || []).map((img: any) => img.url);
        return { success: true, imageUrls };
    } catch (error) {
        console.error('Error uploading images:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return { success: false, imageUrls: [], error: errorMessage };
    }
}

/**
 * Unified function to get images for a ticket
 */
export async function getImages(ticketType: TicketType, ticketId: string) {
    try {
        const endpoint = ticketType === 'engineer'
            ? `/api/engineer-tickets/${ticketId}`
            : `/api/tickets/${ticketId}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error('Failed to fetch ticket images');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error('Invalid response format');
        }

        const ticket = result.data.ticket || result.data;
        const images = ticket?.images || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return images.map((img: any) => {
            const fileName =
                img.originalName ||
                img.imageUrl?.split('/')?.pop() ||
                'image.jpg';

            return {
                ...img,
                is_completion_image: img.isCompletion,
                is_admin_upload: img.isCompletion,
                ticket_id: img.ticketId,
                image_url: img.imageUrl,
                image_name: fileName,
                file_name: fileName,
                file_path: img.imageUrl,
                created_at: img.createdAt,
            };
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}

/**
 * Unified function to delete a ticket image
 */
export async function deleteImage(ticketType: TicketType, imageId: string, imageUrl: string) {
    try {
        const typeParam = ticketType === 'engineer' ? '&type=engineer' : '';
        const response = await fetch(`/api/upload?imageId=${imageId}&filePath=${encodeURIComponent(imageUrl)}${typeParam}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Delete failed');
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// Backward compatible aliases for IT tickets
// ============================================================================

export async function uploadTicketImages(
    ticketId: string,
    files: File[],
    isAdminUpload: boolean = false
): Promise<{ success: boolean; imageUrls: string[]; error?: string }> {
    return uploadImages('it', ticketId, files, isAdminUpload);
}

export async function getTicketImages(ticketId: string) {
    return getImages('it', ticketId);
}

export async function deleteTicketImage(imageId: string, imageUrl: string) {
    return deleteImage('it', imageId, imageUrl);
}

// ============================================================================
// Backward compatible aliases for Engineer tickets
// ============================================================================

export async function uploadEngineerTicketImages(
    ticketId: string,
    files: File[],
    isAdminUpload: boolean = false
): Promise<{ success: boolean; imageUrls: string[]; error?: string }> {
    return uploadImages('engineer', ticketId, files, isAdminUpload);
}

export async function getEngineerTicketImages(ticketId: string) {
    return getImages('engineer', ticketId);
}

export async function deleteEngineerTicketImage(imageId: string, imageUrl: string) {
    return deleteImage('engineer', imageId, imageUrl);
}
