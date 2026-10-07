"use client";

import { useState } from "react";
import type { Paper } from "@/lib/papers";
import { savePaperAttempt } from "@/lib/paper-attempts";
import ScreenHeader from "@/components/ScreenHeader";
import ProgressRing from "@/components/ProgressRing";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function PaperPlayer({ paper }: { paper: Paper }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const [structuredAnswers, setStructuredAnswers] = useState<string[]>(() => paper.structured.map(() => ""));
  const [structuredSubmitted, setStructuredSubmitted] = useState(false);

  const score = paper.objective.reduce((total, question) => total + (answers[question.id] === question.answerIndex ? 1 : 0), 0);
  const passed = score >= Math.ceil(paper.objective.length * 0.6);
  const scorePercent = paper.objective.length > 0
    ? Math.round((score / paper.objective.length) * 100)
    : 0;

  return (
    <div className="px-5">
      <ScreenHeader title={paper.title} subtitle={`${paper.courseUnit} · ${paper.durationMinutes} minutes`} back="/categories" />
      <div className="space-y-5 pt-1">
        <div className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <ProgressRing percent={submitted ? scorePercent : 0} size={58} />
            <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">Level {paper.level} paper</p><p className="text-[12px] text-dim">{paper.objective.length} objective questions + {paper.structured.length} structured questions</p></div>
          </div>
          <a href={paper.textbookReference.url} target="_blank" rel="noreferrer" className="inline-flex text-[12px] font-semibold text-lumen">Open {paper.textbookReference.label}</a>
        </div>

        <section className="space-y-3">
          <div><h2 className="text-[16px] font-semibold text-white">Section A: Objective</h2><p className="text-[11px] text-faint">Choose one answer for each question.</p></div>
          {paper.objective.map((question, index) => {
            const chosen = answers[question.id];
            const correct = submitted && chosen === question.answerIndex;
            const failed = submitted && chosen !== question.answerIndex;
            return <article key={question.id} className="glass space-y-3 rounded-2xl p-4">
              <p className="text-[14px] font-semibold leading-relaxed text-white">{index + 1}. {question.question}</p>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const selectedOption = chosen === optionIndex;
                  const correctOption = submitted && optionIndex === question.answerIndex;
                  const incorrectSelection = submitted && failed && selectedOption;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                      data-state={correctOption ? "correct" : incorrectSelection ? "wrong" : selectedOption ? "selected" : undefined}
                      className="quiz-option glass-nested flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px]"
                    >
                      <span className={cn("quiz-option-label flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold", correctOption || incorrectSelection ? "border-current text-[#F8FAFC]" : "border-[#334155] text-[#94A3B8]")}>{LETTERS[optionIndex]}</span>
                      <span className="text-[#F8FAFC]">{option}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && <div className="space-y-1.5 rounded-xl border-white/10 bg-white/[0.03] p-3"><p className={cn("text-[12px] font-semibold", correct ? "text-lumen" : "text-[#FF9A9A]")}>{correct ? "Correct" : "Not quite"}</p>{!correct && <p className="text-[12px] leading-relaxed text-dim"><span className="font-semibold text-white">Correct answer: {LETTERS[question.answerIndex]}. {question.options[question.answerIndex]}.</span>{question.explanation ? ` ${question.explanation}` : ""}</p>}{correct && question.explanation && <p className="text-[12px] leading-relaxed text-dim">{question.explanation}</p>}</div>}
            </article>;
          })}
          {!submitted && <button type="button" disabled={Object.keys(answers).length !== paper.objective.length} onClick={() => { savePaperAttempt(paper.id, score); setSubmitted(true); }} className="quiz-action w-full rounded-xl bg-[#3B82F6] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]">Submit objective paper</button>}
          {submitted && <div className="glass space-y-3 rounded-2xl p-4"><p className="text-[16px] font-bold text-white">Objective mark: {score}/{paper.objective.length}</p>{passed ? <button type="button" onClick={() => setShowCorrections(true)} className="rounded-lg border border-lumen/30 px-3 py-2 text-[12px] font-semibold text-lumen">Ask for correction</button> : <><p className="text-[12px] text-dim">Score at least 60% to unlock corrections and Section B.</p><button type="button" onClick={() => { setAnswers({}); setSubmitted(false); setShowCorrections(false); }} className="rounded-lg border border-white/15 px-3 py-2 text-[12px] font-semibold text-white">Take retake</button></>}</div>}
        </section>

        {submitted && passed && <section className="space-y-3"><div><h2 className="text-[16px] font-semibold text-white">Section B: Structured</h2><p className="text-[11px] text-faint">Answer briefly and clearly.</p></div>{paper.structured.map((question, index) => <label key={question.id} className="glass block space-y-2 rounded-2xl p-4"><span className="block text-[14px] font-semibold leading-relaxed text-white">{index + 1}. {question.question}</span><textarea value={structuredAnswers[index]} disabled={structuredSubmitted} onChange={(event) => setStructuredAnswers((current) => current.map((value, item) => item === index ? event.target.value : value))} rows={5} className="glass-input w-full rounded-xl border border-white/10 p-3 text-[13px] leading-relaxed text-white focus:border-lumen/40 focus:outline-none" /></label>)}{!structuredSubmitted ? <button type="button" disabled={structuredAnswers.some((answer) => !answer.trim())} onClick={() => setStructuredSubmitted(true)} className="w-full rounded-xl bg-lumen py-3 text-[13px] font-semibold text-canvas disabled:bg-white/10 disabled:text-faint">Submit structured answers</button> : <div className="glass space-y-2 rounded-2xl p-4"><p className="text-[14px] font-semibold text-lumen">Structured answers submitted</p>{paper.structured.map((question) => <p key={question.id} className="text-[12px] leading-relaxed text-dim">Marking guide: {question.markingGuide.join(" ")}</p>)}</div>}</section>}
      </div>
    </div>
  );
}
