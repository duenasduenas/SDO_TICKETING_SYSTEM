const useProduction = true;

export const API_BASE_URL = useProduction
  ? "https://ticketing.sdocabuyao.com"
  : "http://localhost:8080";
