'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PlanChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
}

export function PlanChangeModal({ isOpen, onClose, url }: PlanChangeModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!mounted || !isOpen || !url) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Change Plan</h3>
                        <p className="text-xs text-slate-500">Secure checkout via Outseta</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 bg-slate-50 relative">
                    <iframe
                        src={url}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="payment"
                        title="Change Subscription Plan"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
