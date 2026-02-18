"use client";

import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    loading = false,
}: ConfirmDialogProps) {
    const icons = {
        danger: <AlertCircle className="text-red-600" size={48} />,
        warning: <AlertTriangle className="text-orange-600" size={48} />,
        info: <Info className="text-blue-600" size={48} />,
    };

    const buttonVariants = {
        danger: 'danger' as const,
        warning: 'danger' as const,
        info: 'primary' as const,
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={buttonVariants[variant]}
                        onClick={onConfirm}
                        loading={loading}
                        disabled={loading}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center gap-4">
                {icons[variant]}
                <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
        </Modal>
    );
}
