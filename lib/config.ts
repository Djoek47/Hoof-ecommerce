export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://us-central1-my-project-test-450122.cloudfunctions.net/api';

export function getApiUrl(path: string): string {
  return `${API_URL}${path}`;
} 