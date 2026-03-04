export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

export interface FullPost extends Post {
  content: string;
  published: boolean;
}
