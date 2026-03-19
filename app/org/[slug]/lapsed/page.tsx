import Link from "next/link";

interface Props { params: Promise<{ slug: string }> }

export default async function OrgLapsedPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-[#1A2E26]" style={{ fontFamily: "var(--font-cooper)" }}>
          Your StoryLab subscription has lapsed.
        </h1>
        <p className="text-[#1A2E26]/60" style={{ fontFamily: "var(--font-cooper)" }}>
          Renew to restore access for your school.
        </p>
        <Link
          href={`/org/${slug}/admin`}
          className="block w-full bg-[#2C4A3E] text-white py-3 px-6 rounded-[3px] font-medium hover:bg-[#3A6054] transition-colors"
          style={{ fontFamily: "var(--font-cooper)" }}
        >
          Renew subscription →
        </Link>
      </div>
    </div>
  );
}
