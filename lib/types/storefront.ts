export interface PhilosophyStep {
  label: string;
  body: string;
  photo_url: string | null;
}

export interface CaseStudy {
  student_label: string;
  outcome: string;
  teaser: string;
  challenge: string;
  what_changed: string;
}

export interface Testimonial {
  quote: string;
  attribution: string;
}

export interface StorefrontContent {
  hero: {
    headline: string;
    subheadline: string;
  };
  story: {
    title: string;
    body: string;
    photo_url: string | null;
  };
  philosophy: {
    steps: PhilosophyStep[];
  };
  case_studies: CaseStudy[];
  testimonials: Testimonial[];
  acceptances: string[];
}

export interface TeacherFeatureFlags {
  ai_coaching_enabled: boolean;
  live_sessions_enabled: boolean;
  primary_emphasis: 'ai' | 'live' | 'equal';
}
