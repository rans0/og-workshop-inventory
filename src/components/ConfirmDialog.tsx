'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Hapus',
    cancelText = 'Batal',
    variant = 'danger',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    if (!open) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            button: 'bg-red-600 text-white active:bg-red-700'
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600',
            button: 'bg-amber-600 text-white active:bg-amber-700'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${styles.icon}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                        <p className="text-slate-500 mt-1">{message}</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full -mt-2 -mr-2">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 p-4 bg-slate-100 rounded-2xl font-bold text-slate-600 active:bg-slate-200 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 p-4 rounded-2xl font-bold transition-all ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
