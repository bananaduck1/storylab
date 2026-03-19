import Link from "next/link";
import Image from "next/image";

interface TeacherCardProps {
  name: string;
  slug: string;
  subject: string | null;
  photoUrl: string | null;
  quote: string | null;
}

export function TeacherCard({ name, slug, subject, photoUrl, quote }: TeacherCardProps) {
  // Generate initials for avatar fallback
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/teachers/${slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40 rounded-[4px]"
      aria-label={`View ${name}'s profile`}
    >
    <article
      className="flex flex-col overflow-hidden rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] group-hover:border-[#2C4A3E]/40 transition-colors duration-150"
      aria-label={`${name}, ${subject ?? "Teacher"}`}
    >
      {/* Photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#C0D9CB]">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${name} photo`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="text-4xl font-semibold text-[#2C4A3E]"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
              aria-hidden="true"
            >
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Quote */}
        {quote && (
          <blockquote
            className="flex-1 text-base italic leading-relaxed text-[#1A2E26] mb-5"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
        )}

        {/* Name / subject */}
        <div className="mb-5">
          <p
            className="text-[0.85rem] font-medium text-[#1A2E26]"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {name}
            {subject && (
              <span className="text-[#1A2E26]/60"> · {subject}</span>
            )}
          </p>
        </div>

        {/* CTA */}
        <span
          className="inline-flex items-center justify-center rounded-[3px] bg-[#2C4A3E] px-4 py-2.5 text-sm font-medium text-white group-hover:bg-[#3A6054] transition-colors duration-150"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
          aria-hidden="true"
        >
          View profile →
        </span>
      </div>
    </article>
    </Link>
  );
}
