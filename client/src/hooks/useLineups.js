import { useQuery } from '@tanstack/react-query';
import { fetchLineups, fetchLineup } from '../api/lineups';

export function useLineups() {
  return useQuery({ queryKey: ['lineups'], queryFn: fetchLineups });
}

export function useLineup(id) {
  return useQuery({ queryKey: ['lineup', id], queryFn: () => fetchLineup(id), enabled: !!id });
}
