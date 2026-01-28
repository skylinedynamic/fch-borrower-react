import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUnpaidInvoiceContext } from '../../contexts/UnpaidInvoiceContext';

interface UnpaidInvoiceGuardProps {
    children: React.ReactNode;
}

export const UnpaidInvoiceGuard: React.FC<UnpaidInvoiceGuardProps> = ({ children }) => {
    const { hasUnpaidInvoices, isLoading } = useUnpaidInvoiceContext();

    // Show nothing while loading
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Redirect to dashboard if user has unpaid invoices
    if (hasUnpaidInvoices) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
