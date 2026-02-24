"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Select, Input, Textarea, FileUpload, Button } from '@/components/ui';
import { IT_AREAS, IT_DAMAGE_TYPES, DEPARTMENTS } from '@/lib/constants';
import { itTicketSchema } from '@/lib/validation';
import { BASE_PATH } from '@/lib/constants';

async function fetchOptions(category: string, fallback: readonly string[]): Promise<string[]> {
    try {
        const res = await fetch(`${BASE_PATH}/api/admin/settings/options/public?category=${category}`, {
            credentials: 'include',
        });
        if (!res.ok) return [...fallback];
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
            return data.data.map((o: { label: string }) => o.label);
        }
    } catch {
        // fall through
    }
    return [...fallback];
}

export default function CreateTicketPage() {
    // Set page title
    useEffect(() => {
        document.title = 'EGPB Ticket - Create IT Ticket';
    }, []);

    const [department, setDepartment] = useState('');
    const [area, setArea] = useState('');
    const [typeOfDamage, setTypeOfDamage] = useState('');
    const [locationDetail, setLocationDetail] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const router = useRouter();

    const [areaOptions, setAreaOptions] = useState<string[]>([...IT_AREAS]);
    const [damageTypeOptions, setDamageTypeOptions] = useState<string[]>([...IT_DAMAGE_TYPES]);
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([...DEPARTMENTS]);

    useEffect(() => {
        const init = async () => {
            const result = await apiClient.auth.getUser();
            if (result.success && result.data?.user) {
                setUsername(result.data.user.username);
            } else {
                router.push('/login');
            }
        };
        init();
    }, [router]);

    useEffect(() => {
        Promise.all([
            fetchOptions('IT_AREA', IT_AREAS),
            fetchOptions('IT_DAMAGE_TYPE', IT_DAMAGE_TYPES),
            fetchOptions('DEPARTMENT', DEPARTMENTS),
        ]).then(([areas, damages, depts]) => {
            setAreaOptions(areas);
            setDamageTypeOptions(damages);
            setDepartmentOptions(depts);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate form data with Zod
            const formData = {
                area,
                typeOfDamage,
                department,
                locationDetail,
                description,
                attachments,
            };

            const validation = itTicketSchema.safeParse(formData);

            if (!validation.success) {
                // Show validation errors
                validation.error.issues.forEach((err) => {
                    toast.error(err.message);
                });
                setLoading(false);
                return;
            }

            // Create ticket using API
            const response = await apiClient.tickets.create({
                title: locationDetail || '',
                description: description || '',
                department: department || '',
                location: area,
                typeOfDamage: typeOfDamage,
                status: 'NEW'
            });

            // Add type assertion here to handle the error property access
            if (!response.success || !response.data) {
                const errorMsg = (response as { error?: string }).error;
                console.error('❌ Failed to create ticket:', errorMsg);
                throw new Error(errorMsg || 'Failed to create ticket');
            }

            const ticketData = response.data;

            // Upload images if any
            if (attachments.length > 0 && ticketData.id) {
                const { uploadTicketImages } = await import('@/lib/imageUpload');
                const result = await uploadTicketImages(ticketData.id, attachments, false);

                if (!result.success) {
                    console.error('Image upload failed:', result.error);
                    toast.warning('Ticket created but some images failed to upload');
                }
            }

            toast.success('Ticket created successfully!');
            router.push('/dashboard?refresh=true');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error('Error creating ticket: ' + message);
        } finally {
            setLoading(false);
        }
    };

    if (!username) return null;

    return (
        <div className="min-h-screen bg-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-black hover:text-green-600 mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Dashboard
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-green-100 p-8">
                    <h1 className="text-2xl font-bold text-black mb-2">Create New Ticket</h1>
                    <p className="text-black mb-8">Please provide details about the issue you are facing.</p>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Area"
                                value={area}
                                onChange={setArea}
                                options={areaOptions}
                                placeholder="Select Area"
                                required
                            />

                            <Select
                                label="Type of Damage"
                                value={typeOfDamage}
                                onChange={setTypeOfDamage}
                                options={damageTypeOptions}
                                placeholder="Select Type"
                                required
                            />
                        </div>

                        <Select
                            label="Department (Request By)"
                            value={department}
                            onChange={setDepartment}
                            options={departmentOptions}
                            placeholder="Select Department"
                            required
                        />

                        <Input
                            label="Location"
                            value={locationDetail}
                            onChange={setLocationDetail}
                            placeholder="Specific location or room number"
                        />

                        <Textarea
                            label="Description"
                            value={description}
                            onChange={setDescription}
                            placeholder="Please describe the issue in detail..."
                            rows={5}
                        />

                        <FileUpload
                            label="Attachments"
                            files={attachments}
                            onChange={setAttachments}
                            accept="image/*"
                        />

                        <div className="pt-4 flex justify-end gap-4">
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 text-black font-medium hover:bg-green-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </Link>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={loading}
                            >
                                Create Ticket
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
