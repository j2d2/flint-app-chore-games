export interface HaikuEntry {
  id: string;
  haiku_text: string;   // newline-separated 3 lines (5-7-5)
  source_doc?: string;  // vault relative path
  session_date?: string;
  vote_count: number;
  created_at?: number;
}

export interface HaikuPair {
  a: HaikuEntry;
  b: HaikuEntry;
}
