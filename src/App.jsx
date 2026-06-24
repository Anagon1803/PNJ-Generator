import React from "react";
import { Download, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import questionsData from "../questions.json";

const questions = questionsData.questions;

function dependenciesAreMet(answers, dependencies) {
  if (!dependencies) return true;

  if (dependencies.and) {
    return dependencies.and.every((dependency) =>
      dependency.allowed_values.includes(answers[dependency.question])
    );
  }

  if (dependencies.or) {
    return dependencies.or.some((dependency) =>
      dependency.allowed_values.includes(answers[dependency.question])
    );
  }

  if (Array.isArray(dependencies)) {
    return dependencies.every((dependency) =>
      dependency.allowed_values.includes(answers[dependency.question])
    );
  }

  return false;
}

function findNextQuestionIndex(startIndex, answers) {
  for (let index = startIndex; index < questions.length; index += 1) {
    if (dependenciesAreMet(answers, questions[index].depends_on)) {
      return index;
    }
  }

  return questions.length;
}

function formatAnswers(answers) {
  return questions
    .filter((question) => answers[question.id])
    .map((question) => `${question.question}\n${answers[question.id]}\n`)
    .join("\n");
}

function pickRandomOption(question) {
  if (!question?.options?.length) return "";
  return question.options[Math.floor(Math.random() * question.options.length)];
}

export default function App() {
  const firstQuestionIndex = findNextQuestionIndex(0, {});
  const [currentIndex, setCurrentIndex] = React.useState(firstQuestionIndex);
  const [answers, setAnswers] = React.useState({});
  const [draftAnswer, setDraftAnswer] = React.useState(() =>
    pickRandomOption(questions[firstQuestionIndex])
  );

  const isFinished = currentIndex >= questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((key) => !key.startsWith("_")).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const generatedText = formatAnswers(answers);

  function moveToQuestion(index, nextAnswers) {
    const nextIndex = findNextQuestionIndex(index, nextAnswers);
    setCurrentIndex(nextIndex);
    setDraftAnswer(pickRandomOption(questions[nextIndex]));
  }

  function validateAnswer(event) {
    event.preventDefault();
    if (!currentQuestion) return;

    const value = draftAnswer.trim();
    if (!value) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
      ...(currentQuestion.id === "nom" ? { _nom: value } : {}),
    };

    setAnswers(nextAnswers);
    moveToQuestion(currentIndex + 1, nextAnswers);
  }

  function downloadTxt() {
    if (!generatedText) return;

    const characterName = answers._nom || "PNJ";
    const blob = new Blob([generatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${characterName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetGenerator() {
    setAnswers({});
    setCurrentIndex(firstQuestionIndex);
    setDraftAnswer(pickRandomOption(questions[firstQuestionIndex]));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">JDR Sociaty EXtinction</p>
          <h1>Fiches de personnage</h1>
          <p className="intro">
            Crée une identité prête à entrer dans la ville en avançant question par
            question, puis exporte sa fiche en fichier texte.
          </p>
        </div>
      </section>

      <section className="workspace" aria-label="Générateur">
        <aside className="summary-panel">
          <div>
            <p className="panel-label">Progression</p>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track" aria-label={`Progression ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="muted">
            {answeredCount} réponse{answeredCount > 1 ? "s" : ""} enregistrée
            {answeredCount > 1 ? "s" : ""} sur {questions.length}
          </p>
        </aside>

        <section className="question-panel">
          {isFinished ? (
            <div className="result-view">
              <Sparkles aria-hidden="true" />
              <h2>Ta fiche est prête</h2>
              <pre>{generatedText}</pre>
              <div className="actions">
                <button type="button" className="primary-action" onClick={downloadTxt}>
                  <Download size={18} aria-hidden="true" />
                  Télécharger
                </button>
                <button type="button" className="secondary-action" onClick={resetGenerator}>
                  <RotateCcw size={18} aria-hidden="true" />
                  Recommencer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={validateAnswer}>
              <p className="question-index">
                Question {currentIndex + 1} / {questions.length}
              </p>
              <h2>{currentQuestion.question}</h2>

              {currentQuestion.ask === "oui" ? (
                <input
                  autoFocus
                  value={draftAnswer}
                  onChange={(event) => setDraftAnswer(event.target.value)}
                  placeholder="Écris ta réponse"
                />
              ) : (
                <select
                  value={draftAnswer}
                  onChange={(event) => setDraftAnswer(event.target.value)}
                >
                  {currentQuestion.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              <div className="actions">
                {currentQuestion.options?.length ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => setDraftAnswer(pickRandomOption(currentQuestion))}
                  >
                    <Wand2 size={18} aria-hidden="true" />
                    Aléatoire
                  </button>
                ) : null}
                <button type="submit" className="primary-action">
                  Valider
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
