import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query';
import { checkAgreementSign, submitAgreementSign } from './services';
import { SubmitAgreementSignRequest } from './types';

export const useCheckAgreementSign = () => {
    return useQuery({
        queryKey: queryKeys.agreement.check(),
        queryFn: checkAgreementSign,
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
