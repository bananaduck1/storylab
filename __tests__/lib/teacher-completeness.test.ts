import { describe, it, expect } from 'vitest';
import { computeCompleteness, type TeacherForCompleteness } from '@/lib/teacher-completeness';
import type { StorefrontContent } from '@/lib/types/storefront';

function baseTeacher(overrides: Partial<TeacherForCompleteness> = {}): TeacherForCompleteness {
  return {
    photo_url: null,
    bio: null,
    quote: null,
    subject: null,
    pricing_config: null,
    storefront_content: null,
    ai_coaching_enabled: false,
    live_sessions_enabled: false,
    ...overrides,
  };
}

function fullStorefront(): StorefrontContent {
  return {
    hero: { headline: 'Test', subheadline: 'Test' },
    story: { title: 'Hi', body: 'Body', photo_url: null },
    philosophy: { steps: [] },
    case_studies: [
      { student_label: 'A', outcome: 'Yale', teaser: 'test', challenge: 'challenge', what_changed: 'changed' },
    ],
    testimonials: [
      { quote: 'Great!', attribution: 'A parent' },
    ],
    acceptances: ['Yale'],
  };
}

describe('computeCompleteness', () => {
  it('returns 0 for a completely empty teacher', () => {
    const result = computeCompleteness(baseTeacher());
    expect(result.score).toBe(0);
    expect(result.canPublish).toBe(false);
  });

  it('adds 20 points for photo_url', () => {
    const result = computeCompleteness(baseTeacher({ photo_url: 'https://example.com/photo.jpg' }));
    expect(result.breakdown.photo_url).toBe(20);
    expect(result.score).toBe(20);
  });

  it('adds 15 points for bio', () => {
    const result = computeCompleteness(baseTeacher({ bio: 'A bio' }));
    expect(result.breakdown.bio).toBe(15);
    expect(result.score).toBe(15);
  });

  it('adds 10 points for quote', () => {
    const result = computeCompleteness(baseTeacher({ quote: 'A quote' }));
    expect(result.breakdown.quote).toBe(10);
    expect(result.score).toBe(10);
  });

  it('adds 10 points for subject', () => {
    const result = computeCompleteness(baseTeacher({ subject: 'Essay Coach' }));
    expect(result.breakdown.subject).toBe(10);
    expect(result.score).toBe(10);
  });

  it('adds 15 points for at least one case study', () => {
    const sc = fullStorefront();
    const result = computeCompleteness(baseTeacher({ storefront_content: sc }));
    expect(result.breakdown.case_study).toBe(15);
  });

  it('adds 10 points for at least one testimonial', () => {
    const sc = fullStorefront();
    const result = computeCompleteness(baseTeacher({ storefront_content: sc }));
    expect(result.breakdown.testimonial).toBe(10);
  });

  it('adds 10 points if ai_coaching_enabled is true', () => {
    const result = computeCompleteness(baseTeacher({ ai_coaching_enabled: true }));
    expect(result.breakdown.flags).toBe(10);
  });

  it('adds 10 points if live_sessions_enabled is true', () => {
    const result = computeCompleteness(baseTeacher({ live_sessions_enabled: true }));
    expect(result.breakdown.flags).toBe(10);
  });

  it('adds 10 points for pricing_config with keys', () => {
    const result = computeCompleteness(baseTeacher({ pricing_config: { hourly: 100 } }));
    expect(result.breakdown.pricing).toBe(10);
  });

  it('does not add pricing points for empty pricing_config object', () => {
    const result = computeCompleteness(baseTeacher({ pricing_config: {} }));
    expect(result.breakdown.pricing).toBeUndefined();
  });

  it('does not add bio points for whitespace-only bio', () => {
    const result = computeCompleteness(baseTeacher({ bio: '   ' }));
    expect(result.breakdown.bio).toBeUndefined();
    expect(result.score).toBe(0);
  });

  it('canPublish requires score >= 80 AND photo AND bio AND case study', () => {
    const sc = fullStorefront();
    const teacher = baseTeacher({
      photo_url: 'https://example.com/photo.jpg', // +20
      bio: 'A bio', // +15
      quote: 'A quote', // +10
      subject: 'Coach', // +10
      storefront_content: sc, // +15 case_study +10 testimonial
      ai_coaching_enabled: true, // +10
      pricing_config: { hourly: 100 }, // +10
    });
    // score = 20+15+10+10+15+10+10+10 = 100
    const result = computeCompleteness(teacher);
    expect(result.score).toBe(100);
    expect(result.canPublish).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });

  it('canPublish is false when score >= 80 but missing photo', () => {
    const sc = fullStorefront();
    const teacher = baseTeacher({
      bio: 'A bio', // +15
      quote: 'A quote', // +10
      subject: 'Coach', // +10
      storefront_content: sc, // +15 +10
      ai_coaching_enabled: true, // +10
      pricing_config: { hourly: 100 }, // +10
      // no photo — score = 70, < 80 anyway
    });
    const result = computeCompleteness(teacher);
    expect(result.canPublish).toBe(false);
    expect(result.missingRequired).toContain('profile photo');
  });

  it('canPublish is false when score >= 80 but missing bio', () => {
    const sc = fullStorefront();
    const teacher = baseTeacher({
      photo_url: 'https://example.com/photo.jpg', // +20
      quote: 'A quote', // +10
      subject: 'Coach', // +10
      storefront_content: sc, // +15 +10
      ai_coaching_enabled: true, // +10
      pricing_config: { hourly: 100 }, // +10
      // no bio — score = 85
    });
    const result = computeCompleteness(teacher);
    expect(result.score).toBe(85);
    expect(result.canPublish).toBe(false);
    expect(result.missingRequired).toContain('bio');
  });

  it('canPublish is false when score >= 80 but no case study', () => {
    const sc: StorefrontContent = {
      hero: { headline: 'Test', subheadline: 'Test' },
      story: { title: 'Hi', body: 'Body', photo_url: null },
      philosophy: { steps: [] },
      case_studies: [], // empty
      testimonials: [{ quote: 'Great', attribution: 'Parent' }],
      acceptances: [],
    };
    const teacher = baseTeacher({
      photo_url: 'https://example.com/photo.jpg', // +20
      bio: 'A bio', // +15
      quote: 'A quote', // +10
      subject: 'Coach', // +10
      storefront_content: sc, // +10 testimonial, no case_study
      ai_coaching_enabled: true, // +10
      pricing_config: { hourly: 100 }, // +10
      // score = 85, but no case study
    });
    const result = computeCompleteness(teacher);
    expect(result.score).toBe(85);
    expect(result.canPublish).toBe(false);
    expect(result.missingRequired).toContain('at least one student story');
  });

  it('reports all three missing items when teacher is empty', () => {
    const result = computeCompleteness(baseTeacher());
    expect(result.missingRequired).toContain('profile photo');
    expect(result.missingRequired).toContain('bio');
    expect(result.missingRequired).toContain('at least one student story');
  });

  it('score does not exceed 100', () => {
    const sc = fullStorefront();
    const teacher = baseTeacher({
      photo_url: 'https://example.com/photo.jpg',
      bio: 'A bio',
      quote: 'A quote',
      subject: 'Coach',
      storefront_content: sc,
      ai_coaching_enabled: true,
      live_sessions_enabled: true, // same bucket as ai_coaching_enabled
      pricing_config: { hourly: 100 },
    });
    const result = computeCompleteness(teacher);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
