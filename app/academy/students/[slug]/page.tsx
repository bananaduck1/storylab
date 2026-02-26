import { redirect } from "next/navigation";

export default async function StudentSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Map old full-name slugs to first-name slugs, then redirect to the unified page
  const firstNameMap: Record<string, string> = {
    "jason-lim": "jason",
    "sarah-oh": "sarah",
    "mia-kang": "mia",
    jason: "jason",
    sarah: "sarah",
    mia: "mia",
  };
  const student = firstNameMap[slug] ?? "jason";
  redirect(`/academy/students?student=${student}`);
}
