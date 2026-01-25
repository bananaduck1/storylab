"use client";

import { useState } from "react";

type FormData = {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  preferredContact: string;
  studentName: string;
  grade: string;
  school: string;
  programInterest: string;
  goals: string;
  availability: string[];
  engagementPreference: string;
};

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    preferredContact: "",
    studentName: "",
    grade: "",
    school: "",
    programInterest: "",
    goals: "",
    availability: [],
    engagementPreference: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      availability: checked
        ? [...prev.availability, value]
        : prev.availability.filter((a) => a !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitStatus("success");
      setFormData({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        preferredContact: "",
        studentName: "",
        grade: "",
        school: "",
        programInterest: "",
        goals: "",
        availability: [],
        engagementPreference: "",
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <svg
              className="h-8 w-8 text-zinc-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950">
            Inquiry submitted
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            We'll reply within 24–48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Parent/Guardian Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
          Parent/Guardian
        </h3>
        <div>
          <label htmlFor="parentName" className="block text-sm font-medium text-zinc-700">
            Parent name <span className="text-zinc-500">*</span>
          </label>
          <input
            type="text"
            id="parentName"
            name="parentName"
            required
            value={formData.parentName}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
        <div>
          <label htmlFor="parentEmail" className="block text-sm font-medium text-zinc-700">
            Parent email <span className="text-zinc-500">*</span>
          </label>
          <input
            type="email"
            id="parentEmail"
            name="parentEmail"
            required
            value={formData.parentEmail}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
        <div>
          <label htmlFor="parentPhone" className="block text-sm font-medium text-zinc-700">
            Parent phone
          </label>
          <input
            type="tel"
            id="parentPhone"
            name="parentPhone"
            value={formData.parentPhone}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
        <div>
          <label htmlFor="preferredContact" className="block text-sm font-medium text-zinc-700">
            Preferred contact method <span className="text-zinc-500">*</span>
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            required
            value={formData.preferredContact}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <option value="">Select...</option>
            <option value="Email">Email</option>
            <option value="Text">Text</option>
            <option value="Call">Call</option>
          </select>
        </div>
      </div>

      {/* Student Section */}
      <div className="space-y-4 border-t border-zinc-200 pt-6">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Student</h3>
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-zinc-700">
            Student name <span className="text-zinc-500">*</span>
          </label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            required
            value={formData.studentName}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-zinc-700">
            Grade <span className="text-zinc-500">*</span>
          </label>
          <select
            id="grade"
            name="grade"
            required
            value={formData.grade}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <option value="">Select...</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="school" className="block text-sm font-medium text-zinc-700">
            School
          </label>
          <input
            type="text"
            id="school"
            name="school"
            value={formData.school}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
      </div>

      {/* Needs Section */}
      <div className="space-y-4 border-t border-zinc-200 pt-6">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Needs</h3>
        <div>
          <label htmlFor="programInterest" className="block text-sm font-medium text-zinc-700">
            Program interest <span className="text-zinc-500">*</span>
          </label>
          <select
            id="programInterest"
            name="programInterest"
            required
            value={formData.programInterest}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <option value="">Select...</option>
            <option value="Humanities foundations">Humanities foundations</option>
            <option value="College applications">College applications</option>
            <option value="Not sure">Not sure</option>
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            If you're not sure which program fits, select "Not sure"—we'll guide you.
          </p>
        </div>
        <div>
          <label htmlFor="goals" className="block text-sm font-medium text-zinc-700">
            Goals/context <span className="text-zinc-500">*</span>
          </label>
          <textarea
            id="goals"
            name="goals"
            required
            rows={4}
            value={formData.goals}
            onChange={handleChange}
            placeholder="What are you hoping to improve this semester/year?"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Weekly availability
          </label>
          <div className="space-y-2">
            {["Weekdays after school", "Evenings", "Weekends"].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={formData.availability.includes(option)}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
                />
                <span className="ml-2 text-sm text-zinc-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="engagementPreference" className="block text-sm font-medium text-zinc-700">
            Engagement preference
          </label>
          <select
            id="engagementPreference"
            name="engagementPreference"
            value={formData.engagementPreference}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <option value="">Select...</option>
            <option value="Prefer to discuss">Prefer to discuss</option>
            <option value="Semester-long program">Semester-long program</option>
            <option value="Year-long program">Year-long program</option>
            <option value="Short-term / intensive">Short-term / intensive</option>
          </select>
        </div>
      </div>

      {submitStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus:visible:ring-2 focus:visible:ring-zinc-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit inquiry"}
      </button>
    </form>
  );
}
