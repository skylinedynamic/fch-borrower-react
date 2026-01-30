import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUnpaidInvoices } from '../modules/invoice';
import { UnpaidInvoice } from '../modules/invoice/types';
import { isAuthenticated } from '../lib/auth/auth';

interface UnpaidInvoiceContextType {
    hasUnpaidInvoices: boolean;
    unpaidInvoices: UnpaidInvoice[];
    isLoading: boolean;
    isFetched: boolean;
    refetch: () => void;
}

const UnpaidInvoiceContext = createContext<UnpaidInvoiceContextType | undefined>(undefined);

export const UnpaidInvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // Only enable query if user is authenticated
        setEnabled(isAuthenticated());
    }, []);

    const { data, isLoading, isFetched, refetch } = useUnpaidInvoices(enabled);

    const hasUnpaidInvoices = (data?.status && data?.data && data.data.length > 0) || false;
    const unpaidInvoices = data?.data || [];

    return (
        <UnpaidInvoiceContext.Provider
            value={{
                hasUnpaidInvoices,
                unpaidInvoices,
                isLoading,
                isFetched,
                refetch,
            }}
        >
            {children}
        </UnpaidInvoiceContext.Provider>
    );
};

export const useUnpaidInvoiceContext = () => {
    const context = useContext(UnpaidInvoiceContext);
    if (context === undefined) {
        throw new Error('useUnpaidInvoiceContext must be used within UnpaidInvoiceProvider');
    }
    return context;
};

