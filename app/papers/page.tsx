"use client";

import PaperList from "@/components/PaperList";
import ScreenHeader from "@/components/ScreenHeader";

export default function PapersPage() {
  return (
    <div className="px-5">
      <ScreenHeader title="Course quizzes" subtitle="Latest quiz for each unit · browse by level" back="/" />
      <div className="pt-2"><PaperList /></div>
    </div>
  );
}
