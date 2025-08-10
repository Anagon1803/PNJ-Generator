let questions = [];
let reponses = {};
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  questions = (await fetch("questions.json").then(res => res.json())).questions;
  afficherQuestion();
});

function verifierDependances(reponses, dependances) {
  if (!dependances) return true;

  if (dependances.and) {
    return dependances.and.every(dep => dep.allowed_values.includes(reponses[dep.question]));
  }
  if (dependances.or) {
    return dependances.or.some(dep => dep.allowed_values.includes(reponses[dep.question]));
  }
  if (Array.isArray(dependances)) {
    return dependances.every(dep => dep.allowed_values.includes(reponses[dep.question]));
  }

  return false;
}

function afficherQuestion() {
  const q = questions[currentIndex];
  const questionText = document.getElementById("question-text");
  const inputZone = document.getElementById("input-zone");

  // Skip si dépendances non remplies
  if (q.depends_on && !verifierDependances(reponses, q.depends_on)) {
    currentIndex++;
    afficherQuestion();
    return;
  }

  questionText.textContent = q.question;
  inputZone.innerHTML = "";

  if (q.ask === "oui") {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "user-input";
    inputZone.appendChild(input);
  } else if (q.options) {
    const select = document.createElement("select");
    select.id = "user-input";
    q.options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.text = opt;
      select.appendChild(option);
    });

    // Choix aléatoire par défaut
    select.value = q.options[Math.floor(Math.random() * q.options.length)];
    inputZone.appendChild(select);
  }

  mettreAJourProgression();

  document.getElementById("valider-btn").onclick = () => {
    const val = document.getElementById("user-input").value;
    reponses[q.id] = val;

    // Si c'est le nom, on le stocke
    if (q.id === "nom") {
      reponses["_nom"] = val;
    }

    currentIndex++;
    if (currentIndex < questions.length) {
      afficherQuestion();
    } else {
      afficherResultat();
    }
  };
}

function mettreAJourProgression() {
  const total = questions.length;
  const progress = Math.round((currentIndex / total) * 100);
  document.getElementById("progress-bar").style.width = progress + "%";
}

function afficherResultat() {
  const output = questions
    .filter(q => reponses[q.id])
    .map(q => `${q.question}\n${reponses[q.id]}\n`)
    .join("\n");

  const nom = reponses["_nom"] || "PNJ";

  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const telecharger = document.createElement("a");
  telecharger.href = url;
  telecharger.download = `${nom}.txt`;
  telecharger.click();
}

function telechargerTXT() {
  if (Object.keys(reponses).length === 0) {
    alert("Veuillez d'abord générer un PNJ.");
    return;
  }
  afficherResultat();
}
