export interface Topic {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  explanation_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
