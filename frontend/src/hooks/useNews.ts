
import { useQuery } from '@tanstack/react-query';
import { fetchTopHeadlines, NewsResponse } from '@/services/newsService';

export const useNews = (country: string = 'us', pageSize: number = 60) => {
  return useQuery({
    queryKey: ['news', country, pageSize],
    queryFn: () => fetchTopHeadlines(country, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};
