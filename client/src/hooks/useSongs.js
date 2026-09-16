import { useQuery } from '@tanstack/react-query';
import { fetchSongs, fetchSong } from '../api/songs';

export function useSongs(params) {
  return useQuery({ queryKey: ['songs', params], queryFn: () => fetchSongs(params) });
}

export function useSong(id) {
  return useQuery({ queryKey: ['song', id], queryFn: () => fetchSong(id), enabled: !!id });
}
