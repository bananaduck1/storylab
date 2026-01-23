export type TeamMember = {
  name: string;
  title: string;
  bio: string;
  specialties?: string[];
  education?: string;
  image?: string;
  role: "tutor" | "founder";
};

export const teamMembers: TeamMember[] = [
  {
    name: "Sam",
    title: "Founder",
    bio: "Humanities graduate admitted to Yale, Harvard, Stanford, and Princeton. Studied creative writing, graduated magna cum laude and Phi Beta Kappa, and worked at the Yale Admissions Office as an interviewer.",
    specialties: ["College applications", "Personal statements", "Strategy"],
    education: "Yale University",
    image: "/sam-photo.JPG",
    role: "founder",
  },
  {
    name: "Alex Chen",
    title: "Tutor",
    bio: "Humanities graduate with expertise in analytical writing and critical thinking. Specializes in helping students develop intellectual voice through close reading and structured practice.",
    specialties: ["Humanities foundations", "Analytical writing", "Reading"],
    education: "Harvard University",
    role: "tutor",
  },
  {
    name: "Jordan Martinez",
    title: "Tutor",
    bio: "Trained in literature and philosophy, with a focus on helping students build writing skills that compound over time. Works with middle and high school students on foundational humanities skills.",
    specialties: ["Humanities foundations", "Writing workshops", "Early preparation"],
    education: "Princeton University",
    role: "tutor",
  },
  {
    name: "Taylor Kim",
    title: "Tutor",
    bio: "Humanities graduate specializing in college applications and essay development. Helps students apply their foundational skills to personal statements and supplements.",
    specialties: ["College applications", "Supplements", "Essay development"],
    education: "Stanford University",
    role: "tutor",
  },
];

export const tutors = teamMembers.filter((m) => m.role === "tutor");
export const founders = teamMembers.filter((m) => m.role === "founder");
