import type { Metadata } from "next";
import Image from "next/image";
import { tutors, founders, type TeamMember } from "../../lib/team";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the StoryLab team: trained humanities graduates using a shared pedagogy to help students build reading, writing, and thinking skills.",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex items-start gap-4">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            width={80}
            height={80}
            className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-700">
            {getInitials(member.name)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
            {member.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-600">{member.title}</p>
          {member.education && (
            <p className="mt-1 text-xs text-zinc-500">{member.education}</p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600">{member.bio}</p>
      {member.specialties && member.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {member.specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Our Team
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Our team
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            StoryLab tutors are trained humanities graduates admitted to multiple top universities.
            All tutors use the same StoryLab pedagogy—a consistent method for building reading,
            writing, and thinking skills. This shared approach ensures quality and continuity across
            the program.
          </p>
        </header>

        <section className="mt-14 border-t border-zinc-200/70 pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Founder</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            StoryLab was founded to help students build the reading, writing, and thinking skills
            elite universities still select for. The method has been refined and taught by a team
            of trained humanities graduates.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {founders.map((founder) => (
              <TeamCard key={founder.name} member={founder} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
