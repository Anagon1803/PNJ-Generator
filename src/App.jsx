import React from "react";
import { BookOpen, Download, FilePenLine, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import questionsData from "../data/questions.json";
import rulesText from "../Regle.md?raw";

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

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function MarkdownDocument({ source }) {
  const lines = source.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) continue;

    if (line.startsWith("|")) {
      const tableLines = [];

      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }

      index -= 1;

      const rows = tableLines
        .filter((tableLine) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(tableLine))
        .map((tableLine) =>
          tableLine
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim())
        );

      if (rows.length) {
        const [headers, ...bodyRows] = rows;

        blocks.push(
          <div className="rules-table-wrap" key={`table-${index}`}>
            <table>
              <thead>
                <tr>
                  {headers.map((header, cellIndex) => (
                    <th key={`${header}-${cellIndex}`}>{renderInlineMarkdown(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIndex) => (
                  <tr key={`${row.join("-")}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`}>{renderInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      continue;
    }

    if (line.startsWith("- ")) {
      const items = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }

      index -= 1;

      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );

      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];

      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, ""));
        index += 1;
      }

      index -= 1;

      blocks.push(
        <ol key={`ordered-list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );

      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${index}`}>{line.slice(4)}</h3>);
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${index}`}>{line.slice(3)}</h2>);
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(<h1 key={`h1-${index}`}>{line.slice(2)}</h1>);
      continue;
    }

    blocks.push(<p key={`p-${index}`}>{renderInlineMarkdown(line)}</p>);
  }

  return <article className="rules-document">{blocks}</article>;
}

export default function App() {
  const firstQuestionIndex = findNextQuestionIndex(0, {});
  const [activeTab, setActiveTab] = React.useState("generator");
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
      <header className="top-nav">
        <a className="brand" href="#generation">
          Society EXtinction
        </a>
        <nav aria-label="Navigation principale">
          <button
            type="button"
            className={activeTab === "generator" ? "nav-tab active" : "nav-tab"}
            onClick={() => setActiveTab("generator")}
          >
            <FilePenLine size={18} aria-hidden="true" />
            Génération de fiche
          </button>
          <button
            type="button"
            className={activeTab === "rules" ? "nav-tab active" : "nav-tab"}
            onClick={() => setActiveTab("rules")}
          >
            <BookOpen size={18} aria-hidden="true" />
            Règle
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">JDR Sociaty EXtinction</p>
          <h1>{activeTab === "generator" ? "Fiches de personnage" : "Règle"}</h1>
          <p className="intro">
            {activeTab === "generator"
              ? "Crée une identité prête à entrer dans la ville en avançant question par question, puis exporte sa fiche en fichier texte."
              : "Consulte les caractéristiques, compétences, atouts et voies de Society EXtinction."}
          </p>
        </div>
      </section>

      {activeTab === "generator" ? (
        <section className="workspace" id="generation" aria-label="Générateur">
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
      ) : (
        <section className="rules-panel" aria-label="Règle">
          <MarkdownDocument source={rulesText} />
        </section>
      )}
    </main>
  );
}
