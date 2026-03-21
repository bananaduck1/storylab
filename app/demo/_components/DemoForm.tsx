"use client";

import { useState } from "react";

type FormData = {
  name: string;
  role: string;
  school: string;
  message: string;
  website: string; // honeypot — must stay empty
};

export function DemoForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    role: "",
    school: "",
    message: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] px-8 py-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#2C4A3E]">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1A2E26]">
          Request received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1A2E26]/70">
          We&rsquo;ll be in touch within 1 business day to schedule your 30-minute call.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot — hidden from real users, filled by bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#1A2E26]">
          Your name <span className="text-[#2C4A3E]/60">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1.5 w-full rounded-[3px] border border-[#C0D9CB] bg-white px-4 py-2.5 text-sm text-[#1A2E26] placeholder-[#1A2E26]/40 focus:border-[#2C4A3E] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/20"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-[#1A2E26]">
          Your role <span className="text-[#2C4A3E]/60">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          value={formData.role}
          onChange={handleChange}
          className="mt-1.5 w-full rounded-[3px] border border-[#C0D9CB] bg-white px-4 py-2.5 text-sm text-[#1A2E26] focus:border-[#2C4A3E] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/20"
        >
          <option value="">Select your role…</option>
          <option value="Principal">Principal</option>
          <option value="Department Head">Department Head</option>
          <option value="District Administrator">District Administrator</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium text-[#1A2E26]">
          School or district <span className="text-[#2C4A3E]/60">*</span>
        </label>
        <input
          type="text"
          id="school"
          name="school"
          required
          value={formData.school}
          onChange={handleChange}
          className="mt-1.5 w-full rounded-[3px] border border-[#C0D9CB] bg-white px-4 py-2.5 text-sm text-[#1A2E26] placeholder-[#1A2E26]/40 focus:border-[#2C4A3E] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/20"
          placeholder="Lincoln High School"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#1A2E26]">
          What are you hoping to solve? <span className="text-[#2C4A3E]/60">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="mt-1.5 w-full rounded-[3px] border border-[#C0D9CB] bg-white px-4 py-2.5 text-sm text-[#1A2E26] placeholder-[#1A2E26]/40 focus:border-[#2C4A3E] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/20 resize-none"
          placeholder="Tell us about your students, your goals, or what prompted you to reach out."
        />
      </div>

      {status === "error" && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending…" : "Request a 30-minute demo →"}
      </button>

      <p className="text-center text-xs text-[#1A2E26]/50">
        We&rsquo;ll respond within 1 business day.
      </p>
    </form>
  );
}
