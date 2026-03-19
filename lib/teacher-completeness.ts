import type { StorefrontContent } from './types/storefront';

export interface TeacherForCompleteness {
  photo_url: string | null;
  bio: string | null;
  quote: string | null;
  subject: string | null;
  pricing_config: Record<string, unknown> | null;
  storefront_content: StorefrontContent | null;
  ai_coaching_enabled: boolean;
  live_sessions_enabled: boolean;
}

export interface CompletenessResult {
  score: number;
  breakdown: Record<string, number>;
  canPublish: boolean;
  missingRequired: string[];
}

export function computeCompleteness(teacher: TeacherForCompleteness): CompletenessResult {
  const breakdown: Record<string, number> = {};
  let score = 0;

  if (teacher.photo_url) { breakdown.photo_url = 20; score += 20; }
  if (teacher.bio?.trim()) { breakdown.bio = 15; score += 15; }
  if (teacher.quote?.trim()) { breakdown.quote = 10; score += 10; }
  if (teacher.subject?.trim()) { breakdown.subject = 10; score += 10; }

  const sc = teacher.storefront_content;
  if (sc?.case_studies && sc.case_studies.length > 0) { breakdown.case_study = 15; score += 15; }
  if (sc?.testimonials && sc.testimonials.length > 0) { breakdown.testimonial = 10; score += 10; }

  if (teacher.ai_coaching_enabled || teacher.live_sessions_enabled) { breakdown.flags = 10; score += 10; }

  const pricing = teacher.pricing_config;
  if (pricing && Object.keys(pricing).length > 0) { breakdown.pricing = 10; score += 10; }

  const hasPhoto = !!teacher.photo_url;
  const hasBio = !!teacher.bio?.trim();
  const hasCaseStudy = (sc?.case_studies?.length ?? 0) > 0;

  const missingRequired: string[] = [];
  if (!hasPhoto) missingRequired.push('profile photo');
  if (!hasBio) missingRequired.push('bio');
  if (!hasCaseStudy) missingRequired.push('at least one student story');

  return {
    score,
    breakdown,
    canPublish: score >= 80 && hasPhoto && hasBio && hasCaseStudy,
    missingRequired,
  };
}
