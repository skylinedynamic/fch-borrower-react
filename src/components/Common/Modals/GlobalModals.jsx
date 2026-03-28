import React from 'react';
import AgreementSignModal from '../../AgreementSignModal/AgreementSignModal';
import ProfileCompleteCheckModal from '../../ProfileCompleteCheckModal/ProfileCompleteCheckModal';
import { useAuthStore } from '../../../store/auth/authStore';
import './GlobalModals.css';

/**
 * GlobalModals - Container for all global modals used across the application
 */
export default function GlobalModals() {
    const { user } = useAuthStore();

    return (
        <>
            {/* Agreement Signature Modal (Borrower specific) */}
            {!user?.is_agreement_signed && <AgreementSignModal />}
            
            {/* Profile Completion Check Modal */}
            <ProfileCompleteCheckModal />
        </>
    );
}
