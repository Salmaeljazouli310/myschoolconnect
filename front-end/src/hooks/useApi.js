import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function useApiQuery(key, fetcher, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetcher,
    staleTime: 30000,
    ...options,
  })
}

export function useApiMutation(mutationFn, {
  onSuccess,
  successMessage = 'Action completed.',
  invalidateKeys = [],
} = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (successMessage) toast.success(successMessage)
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] }))
      onSuccess?.(data)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Une erreur est survenue')
    },
  })
}