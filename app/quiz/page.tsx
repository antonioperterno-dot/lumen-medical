import Link from "next/link";
import DailyQuiz from "@/components/DailyQuiz";
import ScreenHeader from "@/components/ScreenHeader";
import { cn } from "@/lib/utils";
import PaperList from "@/components/PaperList";

/**
 * ===========================================================================
 * /quiz — the Daily Quiz
 * ===========================================================================
 * Same five questions for every student, everywhere, all day. The subject chips
 * narrow the pool (e.g. /quiz?category=cardiology) using the same seeded
 * selection, so a "Cardiology only" quiz is also identical for the whole class.
 */

const SUBJECTS = [
  { slug: "", label: "Mixed" },
  { slug: "pharmacology", label: "Pharmacology" },
  { slug: "psychology", label: "Psychology" },
  { slug: "physiology", label: "Physiology" },
  { slug: "anatomy", label: "Anatomy" },
  { slug: "first-aid", label: "First Aid" },
  { slug: "nursing", label: "Nursing" },
  { slug: "microbiology", label: "Microbiology" },
  { slug: "medical-journals", label: "Medical Journals" },
];

export const metadata = {
  title: "Course Quizzes | LUMEN",
  description: "Latest course-unit quizzes plus daily practice.",
};

export default function QuizPage({
  searchParams,
}: {
  searchParams: { category?: string; mode?: string };
}) {
  const category = searchParams.category?.trim() || undefined;
  const quick = searchParams.mode === "quick";

  return (
    <div className="px-5">
      <ScreenHeader
        title={quick ? "Quick Quiz" : "Course Quizzes"}
        subtitle={quick ? "Five mixed questions · 8-minute timer" : "Latest quiz for each unit · daily practice below"}
        back="/"
      />

      <nav className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-4 pt-1">
        {SUBJECTS.map((subject) => {
          const active = (subject.slug || undefined) === category;
          return (
            <Link
              key={subject.slug || "mixed"}
              href={subject.slug ? `/quiz?category=${subject.slug}` : "/quiz"}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                active
                  ? "border-lumen/50 bg-lumen/15 text-lumen"
                  : "border-white/10 bg-white/5 text-white/70",
              )}
            >
              {subject.label}
            </Link>
          );
        })}
      </nav>

      {!quick && (
        <div className="mb-6">
          {category ? <PaperList courseUnit={category} compact /> : <PaperList />}
        </div>
      )}
      {!quick && <h2 className="mb-3 text-[15px] font-semibold text-white">Daily practice</h2>}
      <DailyQuiz category={category} count={quick ? 5 : 20} timerMinutes={quick ? 8 : 30} />
    </div>
  );
}
