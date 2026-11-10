import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query';
import { checkAgreementSign, submitAgreementSign } from './services';
import { SubmitAgreementSignRequest } from './types';

/** Whether the borrower must sign. `enabled: false` once they have signed - nothing to ask. */
export const useCheckAgreementSign = (enabled = true) => {
    return useQuery({
        queryKey: queryKeys.agreement.check(),
        queryFn: checkAgreementSign,
        enabled,
    });
};

export const useSubmitAgreementSign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubmitAgreementSignRequest) => submitAgreementSign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.agreement.check() });
        },
    });
};
