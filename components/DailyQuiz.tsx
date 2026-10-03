"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import ProgressRing from "@/components/ProgressRing";
import { CheckIcon, CloseIcon, QuizPaperIcon, RefreshIcon } from "@/components/icons";
import { QuizSkeleton, SkeletonBlock } from "@/components/Skeleton";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { apiUrl, type QuizPayload } from "@/lib/api";
import { cn, todayKey } from "@/lib/utils";

/**
 * ===========================================================================
 * DailyQuiz — twenty objective questions for a course unit. The home card
 * deliberately remains a short five-question daily check-in.
 * ===========================================================================
 * Two components live here:
 *
 *  - <DailyQuizCard />   the home-screen teaser ("5 questions · 2 min")
 *  - <DailyQuiz />       the full flow used by /quiz
 *
 * Grading happens on the device (the answer ships with the question), so this
 * works with no signal. Each answer is written to the local progress mirror and
 * queued for Firestore — the student sees instant feedback, and the sync
 * happens quietly in the background.
 */

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function DailyQuizCard() {
  const today = useMemo(() => todayKey(), []);
  const url = apiUrl("/api/quiz", { count: 5, date: today });
  const { data, loading } = useApiResource<QuizPayload>(url, {
    cacheKey: `quiz:${today}:5`,
  });
  const { summary } = useProgress();

  const answeredToday = summary.quizAnswered > 0;

  if (loading) {
    return (
      <GlassCard className="space-y-3" accent>
        <SkeletonBlock className="h-4 w-28" rounded="rounded-full" />
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </GlassCard>
    );
  }

  const questionCount = data?.data.length ?? 0;

  return (
    <GlassCard href="/quiz?mode=quick" accent className="animate-fade-in-up">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lumen/30 bg-lumen/10 text-lumen">
          <QuizPaperIcon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-white">Quick Quiz</h2>
            <span className="pill-trending">Today</span>
          </div>
          <p className="mt-0.5 text-[12px] text-dim">
            {questionCount > 0
              ? `${questionCount} questions · 8 minutes`
              : "Questions refresh every morning"}
          </p>
          {answeredToday && (
            <p className="mt-1 text-[11px] text-faint">
              Accuracy so far {summary.quizAccuracy}% · {summary.quizAnswered} answered
            </p>
          )}
        </div>

        <ProgressRing
          percent={answeredToday ? summary.quizAccuracy : 0}
          size={44}
          showValue={answeredToday}
        />
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------------- */
/* The full quiz flow used by /quiz                                          */
/* ------------------------------------------------------------------------- */

export default function DailyQuiz({
  category,
  count = 20,
  timerMinutes,
}: {
  /** Narrow the pool to one category ("Cardiology only"). */
  category?: string;
  count?: number;
  timerMinutes?: number;
}) {
  const today = useMemo(() => todayKey(), []);
  const url = apiUrl("/api/quiz", { count, date: today, category });
  const { data, loading, error, refresh, fromCache } = useApiResource<QuizPayload>(
    url,
    { cacheKey: `quiz:${today}:${count}:${category ?? "all"}` },
  );

  const { recordQuiz } = useProgress();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const questions = data?.data ?? [];
  const question = questions[index];

  const choose = (optionIndex: number) => {
    if (selected !== null || !question) return;
    setSelected(optionIndex);

    const correct = optionIndex === question.answerIndex;
    setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
    if (correct) setCorrectCount((value) => value + 1);

    // Local first: instant, and it survives a dead network. The provider
    // queues the same answer for Firestore.
    recordQuiz({ questionId: question.id, chosenIndex: optionIndex, correct });
  };

  const next = () => {
    setSelected(null);
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
    setAnswers({});
    setElapsedSeconds(0);
    setStartedAt(Date.now());
  };

  useEffect(() => {
    if (finished || !timerMinutes) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, startedAt, timerMinutes]);

  if (loading) return <QuizSkeleton />;

  if (error && questions.length === 0) {
    return (
      <GlassCard className="text-center" padded={false}>
        <div className="flex flex-col items-center gap-3 px-6 py-10">
          <h2 className="text-base font-semibold text-white">No quiz yet</h2>
          <p className="max-w-[280px] text-[13px] text-dim">
            We couldn&apos;t load today&apos;s questions. Check your connection and try
            again. Anything you already answered is saved on this device.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-lumen/40 bg-lumen/10 px-4 py-2 text-[13px] font-semibold text-lumen"
          >
            <RefreshIcon className="h-4 w-4" />
            Retry
          </button>
        </div>
      </GlassCard>
    );
  }

  if (questions.length === 0) return null;

  if (finished) {
    const percent = Math.round((correctCount / questions.length) * 100);
    const timePenalty = timerMinutes === 30 ? Math.max(0, Math.floor((elapsedSeconds - 1800) / 60)) : 0;
    const points = Math.max(0, correctCount - timePenalty);
    const passed = percent >= 60;
    return (
      <GlassCard className="animate-fade-in-up text-center" padded={false}>
        <div className="flex flex-col items-center gap-4 px-6 py-8">
          <ProgressRing percent={percent} size={96} stroke={6} label="score" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              {percent >= 80
                ? "Excellent! That's consultant level."
                : percent >= 60
                  ? "Solid. A review would lock it in"
                  : "Good start. Read the explanations."}
            </h2>
            <p className="mt-1 text-[13px] text-dim">
              You answered {correctCount} of {questions.length} correctly.
            </p>
          </div>

          <div className="w-full space-y-3 text-left">
            {questions.map((item, itemIndex) => (
              <div key={item.id} className="rounded-xl bg-white/5 p-3">
                <p className="text-[13px] font-medium text-white">
                  {itemIndex + 1}. {item.prompt}
                </p>
                {answers[item.id] !== item.answerIndex && (
                  <>
                    <p className="mt-1 text-[12px] text-lumen">
                      Answer: {OPTION_LETTERS[item.answerIndex]}. {item.options[item.answerIndex]}
                    </p>
                    {item.explanation && (
                      <p className="mt-1 text-[12px] leading-relaxed text-dim">
                        {item.explanation}
                      </p>
                    )}
                  </>
                )}
                {answers[item.id] === item.answerIndex && (
                  <p className="mt-1 text-[12px] text-lumen">Passed</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-[12px] text-dim">
            Objective mark: <span className="font-semibold text-white">{points}/20</span>
            {timePenalty > 0 && ` · ${timePenalty} point${timePenalty === 1 ? "" : "s"} deducted for time`}
          </p>

          {passed ? (
            <StructuredAnswerSection category={category} />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <p className="text-[13px] font-semibold text-white">Retake available</p>
              <p className="mt-1 text-[12px] leading-relaxed text-dim">Pass at least 60% to unlock structured marking and corrections.</p>
            </div>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={restart}
              className="glass glass-pressable flex-1 rounded-xl py-3 text-[13px] font-semibold text-white"
            >
              Retake
            </button>
            <Link
              href={category ? `/categories/${category}` : "/categories"}
              className="glass-pressable flex-1 rounded-xl border border-lumen/40 bg-lumen/10 py-3 text-center text-[13px] font-semibold text-lumen"
            >
              Read the topic
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  const answered = selected !== null;
  const isCorrect = answered && selected === question.answerIndex;

  return (
    <div className="space-y-4">
      <GlassCard className="animate-fade-in-up" padded={false}>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              Question {index + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              {fromCache && <span className="pill-muted">offline copy</span>}
              <span className="pill-trending">{question.difficulty}</span>
            </div>
          </div>

          {timerMinutes && (
            <p className={cn("text-[11px]", elapsedSeconds > timerMinutes * 60 ? "text-[#FFB86B]" : "text-faint")}>
              Time {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")} · continues after {timerMinutes}:00
            </p>
          )}

          <h2 className="text-[16px] font-semibold leading-snug text-white">
            {question.prompt}
          </h2>

          <ul className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const chosen = selected === optionIndex;
              const right = optionIndex === question.answerIndex;
              const revealRight = answered && right;
              const revealWrong = answered && chosen && !right;

              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => choose(optionIndex)}
                    disabled={answered}
                    className={cn(
                      "glass-pressable flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left",
                      !answered && "border-white/10 bg-white/5 active:bg-white/10",
                      revealRight && "border-lumen/60 bg-lumen/10",
                      revealWrong && "border-[#FF6B6B]/50 bg-[#FF6B6B]/10",
                      answered &&
                        !revealRight &&
                        !revealWrong &&
                        "border-white/5 bg-white/5 opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                        revealRight
                          ? "border-lumen bg-lumen text-canvas"
                          : revealWrong
                            ? "border-[#FF6B6B] text-[#FF6B6B]"
                            : "border-white/20 text-faint",
                      )}
                    >
                      {revealRight ? (
                        <CheckIcon className="h-3.5 w-3.5" />
                      ) : revealWrong ? (
                        <CloseIcon className="h-3.5 w-3.5" />
                      ) : (
                        OPTION_LETTERS[optionIndex]
                      )}
                    </span>
                    <span className="text-[14px] leading-snug text-white">
                      {option}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {answered && (
            <div className="animate-fade-in-up rounded-xl border border-white/10 bg-white/5 p-3.5">
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  isCorrect ? "text-lumen" : "text-[#FF8A8A]",
                )}
              >
                {isCorrect ? "Correct" : "Not quite"}
              </p>
              {question.explanation && (
                <p className="mt-1 text-[13px] leading-relaxed text-dim">
                  {question.explanation}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={next}
            disabled={!answered}
            className={cn(
              "w-full rounded-xl py-3 text-[14px] font-semibold transition-opacity",
              answered
                ? "bg-lumen text-canvas active:scale-[0.99]"
                : "cursor-not-allowed bg-white/10 text-faint",
            )}
          >
            {index + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        </div>
      </GlassCard>

      <p className="px-1 text-center text-[11px] text-faint">
        Answered offline? Your score syncs the moment you have signal.
      </p>
    </div>
  );
}

function StructuredAnswerSection({ category }: { category?: string }) {
  const [answers, setAnswers] = useState(["", ""]);
  const [submitted, setSubmitted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const submit = async () => {
    setSubmitted(true);
    setThinking(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/api/essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers }),
        signal: controller.signal,
      });
      if (response.ok) {
        setResult((await response.json()) as { score: number; feedback: string });
      } else {
        setResult({ score: 0, feedback: "Marking is unavailable right now. Your answers remain on this device for retry when you reconnect." });
      }
    } catch {
      setResult({ score: 0, feedback: "Marking is unavailable offline. Your answers remain on this device for retry when you reconnect." });
    } finally {
      window.clearTimeout(timeout);
      setThinking(false);
    }
  };

  return (
    <section className="w-full space-y-3 text-left rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div>
        <h3 className="text-[14px] font-semibold text-white">Section B · 2 structured questions</h3>
        <p className="mt-1 text-[12px] text-dim">Write in your own words, then submit for marking.</p>
      </div>
      {["Explain the key principles of this course unit.", "Describe how you would apply them in a clinical situation."].map((prompt, index) => (
        <label key={prompt} className="block space-y-1.5">
          <span className="text-[12px] font-medium text-white">{index + 1}. {prompt}</span>
          <textarea
            value={answers[index]}
            onChange={(event) => setAnswers((current) => current.map((value, item) => item === index ? event.target.value : value))}
            disabled={submitted}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
            placeholder="Type your answer"
          />
        </label>
      ))}
      {!submitted && <button type="button" onClick={() => void submit()} disabled={answers.some((answer) => !answer.trim())} className="w-full rounded-xl bg-lumen py-2.5 text-[13px] font-semibold text-canvas disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-faint">Submit structured answers</button>}
      {thinking && <div className="flex items-center justify-center gap-2 py-2 text-[12px] text-lumen"><span className="h-4 w-4 animate-spin rounded-full border-2 border-lumen/30 border-t-lumen" />Thinking</div>}
      {result && <div className="rounded-xl border border-lumen/30 bg-lumen/10 p-3 text-[12px] leading-relaxed text-white"><p className="font-semibold text-lumen">Structured mark: {result.score}/20</p><p className="mt-1">{result.feedback}</p></div>}
    </section>
  );
}



