import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUnpaidInvoiceContext } from '../../contexts/UnpaidInvoiceContext';

interface UnpaidInvoiceGuardProps {
    children: React.ReactNode;
}

export const UnpaidInvoiceGuard: React.FC<UnpaidInvoiceGuardProps> = ({ children }) => {
    const { hasUnpaidInvoices } = useUnpaidInvoiceContext();

    // Redirect to dashboard if user has unpaid invoices
    if (hasUnpaidInvoices) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
