import { useMutation } from '@tanstack/react-query';
import { resumeBorrowerSubscription } from './services';

/** Resume a cancelled subscription (BUG-069). */
export const useResumeSubscription = () =>
  useMutation({
    mutationFn: resumeBorrowerSubscription,
  });
