-- Add feature flags and storefront content to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS ai_coaching_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS live_sessions_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS primary_emphasis text NOT NULL DEFAULT 'ai';
ALTER TABLE teachers ADD CONSTRAINT teachers_primary_emphasis_check
  CHECK (primary_emphasis IN ('ai', 'live', 'equal'));
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS storefront_content jsonb DEFAULT NULL;

-- Seed Sam's data
UPDATE teachers SET
  ai_coaching_enabled = true,
  live_sessions_enabled = true,
  primary_emphasis = 'ai',
  storefront_content = jsonb_build_object(
    'hero', jsonb_build_object(
      'headline', 'Your story is already there. Let me help you find it.',
      'subheadline', 'Yale ''25 · Magna Cum Laude · Phi Beta Kappa'
    ),
    'story', jsonb_build_object(
      'title', 'Hi, I''m Sam.',
      'body', 'By application season, I hadn''t won any national awards, nor had I founded an organization that made a huge social impact. I wasn''t mobilizing movements; I was nowhere to be found in online media or press.' || E'\n\n' ||
              'By the standards of high-achieving students aiming for top schools, I was not an "impressive" student. All I had done was get good grades and participate in school activities.' || E'\n\n' ||
              'And yet, come March my senior year, I got into Harvard, Yale, Stanford, and Princeton — the only schools I had applied to.' || E'\n\n' ||
              'I started StoryLab to teach students the philosophy that got me in.' || E'\n\n' ||
              'At Yale, I graduated magna cum laude and Phi Beta Kappa with a B.A. in Comparative Literature. In college, I wrote for some of the world''s biggest companies alongside former White House speechwriters, and evaluated high school seniors for the Yale admissions office.',
      'photo_url', '/StoryLab%20Sam%20talking.png'
    ),
    'philosophy', jsonb_build_object(
      'steps', jsonb_build_array(
        jsonb_build_object(
          'label', 'My Philosophy',
          'body', 'Admissions officers are humanists at heart and value humanities-oriented thinking in the application.' || E'\n\n' ||
                  'Achievements get you in the running. Writing that dares to be emotional and vulnerable gets you admitted.' || E'\n\n' ||
                  'Writing is an opaque and difficult process that takes months, if not years, to see results. AI tools only make you less distinguishable.' || E'\n\n' ||
                  'By 12th grade, many parts of the application are too late to change. Starting as early as possible to craft a unique narrative is a must.',
          'photo_url', '/in%20the%20crowd.png'
        ),
        jsonb_build_object(
          'label', 'How I''m Different',
          'body', 'I train students, even those with STEM backgrounds, to infuse humanistic thinking and reflection in their applications.' || E'\n\n' ||
                  'I push students beyond surface-level "I-learned-x" sentences to write radically vulnerable narratives admissions officers can''t forget.' || E'\n\n' ||
                  'I teach students the process of writing itself, which sets them up for success long after the admissions process is over.' || E'\n\n' ||
                  'Long before 12th grade, I push students away from cliché narratives and coach them to build strong relationships with teachers.',
          'photo_url', '/photo-1.png'
        )
      )
    ),
    'case_studies', jsonb_build_array(
      jsonb_build_object(
        'student_label', 'J, Senior',
        'outcome', 'Accepted — Dartmouth',
        'teaser', 'His first essay hit every note: leadership, service, resilience. By the second paragraph, you could predict every sentence coming. That was the problem.',
        'challenge', 'Jason''s first draft was technically impressive. He''d written about leading the debate team through a losing season — finding resilience, growing as a leader, turning things around. The structure was clean. The sentences were polished. Every adult who read it said it was good. That was the problem. Every sentence predicted the next. The essay moved exactly the way you expected it to: adversity → reflection → growth. There was no texture, no surprise, no moment where you felt you were actually inside his mind.',
        'what_changed', 'The essay that got Jason into Dartmouth was about twenty minutes he spent alone in a parking lot after a tournament loss — not strategizing for next time, not converting the experience into a lesson. Just standing there, replaying the round in his head, letting himself actually feel what it felt like to fail. Admissions officers don''t remember the essays about resilience. They remember the essays that show them what it actually feels like to be you.'
      ),
      jsonb_build_object(
        'student_label', 'S, Senior',
        'outcome', 'Accepted — Princeton',
        'teaser', 'Her essay was beautifully written — clean, controlled, and emotionally distant. After 600 words, you didn''t know her any better than at the top of the page.',
        'challenge', 'Sarah was a genuinely talented writer. Her essay about her grandmother was the most technically accomplished draft I''d seen that season. Every sentence was precise. Every image earned. Every adult in her life loved it. But after 600 words, you still didn''t know Sarah. The essay was controlled in a way that kept you at arm''s length — careful, measured, protected.',
        'what_changed', 'The essay that got Sarah into Princeton was about a specific Tuesday afternoon. Her grandmother had called her by the wrong name — then caught herself immediately, and they''d both pretended it hadn''t happened. That moment in the room. The silence afterward. The way Sarah realized she was trying to protect her grandmother from something her grandmother already knew.'
      ),
      jsonb_build_object(
        'student_label', 'M, Senior',
        'outcome', 'Accepted — Northwestern',
        'teaser', 'Her counselor told her not to write about filmmaking. So she wrote about everything else — and none of it was the thing that actually made her, her.',
        'challenge', 'Mia''s counselor told her not to write about filmmaking. Too niche. Wouldn''t resonate with most readers. So she wrote five other drafts. One about resilience after her parents'' divorce. One about community and a library volunteering program. Every essay was fine. None of them was Mia.',
        'what_changed', 'The essay that got Mia into Northwestern was about the gap between what she sees in her head and what she can actually make with a camera. Not a story of success or mastery. A story of a problem she hasn''t solved — and may never solve. Every admissions officer who read it immediately recognized someone with a real relationship to a craft.'
      )
    ),
    'testimonials', jsonb_build_array(
      jsonb_build_object(
        'quote', 'He didn''t just comment on my ideas broadly; he engaged with individual sentences, pushing me to sharpen my thinking and present myself as clearly and authentically as possible.',
        'attribution', 'Student attending University of Chicago'
      ),
      jsonb_build_object(
        'quote', 'Your activities list already speaks for itself — your essays should reveal who you actually are. Sam helped me figure out what made my story genuinely mine.',
        'attribution', 'Student attending Northwestern'
      ),
      jsonb_build_object(
        'quote', 'What I want to emphasize most is Sam''s genuine sense of care. He communicated consistently, gave thoughtful feedback, and made the whole process feel less like a grind and more like something I could actually be proud of.',
        'attribution', 'Student attending Vanderbilt'
      ),
      jsonb_build_object(
        'quote', 'Sam is a teacher who truly listens to what a student is wrestling with and draws out exactly what they need.',
        'attribution', 'Parent of a Washington University in St Louis student'
      )
    ),
    'acceptances', jsonb_build_array(
      'Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT', 'Columbia', 'UPenn',
      'Dartmouth', 'Brown', 'Cornell', 'Northwestern', 'Duke', 'Georgetown'
    )
  )
WHERE slug = 'sam-a';
