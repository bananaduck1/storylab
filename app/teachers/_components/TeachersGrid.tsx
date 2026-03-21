"use client";

import { useState } from "react";
import { TeacherCard } from "@/components/TeacherCard";
import { SUBJECT_VALUES, type Subject } from "@/types/teacher";

interface Teacher {
  id: string;
  name: string;
  slug: string;
  subject: string | null;
  photo_url: string | null;
  quote: string | null;
}

export function TeachersGrid({ teachers }: { teachers: Teacher[] }) {
  const [activeSubject, setActiveSubject] = useState<Subject | "All">("All");

  const filtered =
    activeSubject === "All"
      ? teachers
      : teachers.filter((t) => t.subject === activeSubject);

  return (
    <>
      {/* Subject filter pills */}
      {teachers.length > 0 && (
        <div
          role="group"
          aria-label="Filter by subject"
          className="overflow-x-auto flex gap-2 pb-1 -mb-1 scrollbar-hide mb-8"
        >
          {(["All", ...SUBJECT_VALUES] as const).map((subject) => (
            <button
              key={subject}
              aria-pressed={activeSubject === subject}
              onClick={() => setActiveSubject(subject)}
              className={
                activeSubject === subject
                  ? "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium bg-[#2C4A3E] text-white"
                  : "shrink-0 rounded-full border border-[#C0D9CB] px-4 py-2.5 text-sm text-[#1A2E26]/70 hover:border-[#2C4A3E] transition-colors"
              }
            >
              {subject}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {teachers.length === 0 ? (
        <div className="rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] p-12 text-center">
          <p
            className="text-base text-[#1A2E26]/60"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            Teachers coming soon.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#1A2E26]/50 py-8 text-center">
          No {activeSubject} teachers yet. More coming soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              name={teacher.name}
              slug={teacher.slug}
              subject={teacher.subject}
              photoUrl={teacher.photo_url}
              quote={teacher.quote}
            />
          ))}
        </div>
      )}
    </>
  );
}
