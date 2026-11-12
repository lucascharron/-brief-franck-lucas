// Application Fleurs Roussel : quiz « Quelle fleur êtes-vous ? »
// Questions fixes : data/question.json (hors prompt, cf. sujet).
// Portraits : data/donnees.json, produits par le prompt de contenu.
// Règles de code : voir AGENTS.md et les conventions d'intégration de l'agence.

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("quiz-form");
    const container = document.getElementById("questions-container");
    const errorMessage = document.getElementById("error-message");
    const result = document.getElementById("result-container");
    const resetBtn = document.getElementById("reset-btn");

    let questions;
    let portraits;

    try {
        const [qRes, pRes] = await Promise.all([
            fetch("data/question.json"),
            fetch("data/donnees.json")
        ]);
        if (!qRes.ok || !pRes.ok) {
            throw new Error(`HTTP ${qRes.status} / ${pRes.status}`);
        }
        ({ questions } = await qRes.json());
        portraits = await pRes.json();
        if (!Array.isArray(portraits) || portraits.length === 0) {
            throw new Error("data/donnees.json ne contient aucun portrait");
        }
    } catch (err) {
        console.error("Erreur critique :", err);
        errorMessage.textContent = "Impossible de charger le quiz.";
        return;
    }

    // Affichage des questions (textContent : aucune donnée interprétée comme HTML)
    questions.forEach((q, index) => {
        const fieldset = document.createElement("fieldset");

        const legend = document.createElement("legend");
        legend.className = "font-semibold mb-2";
        legend.textContent = `${index + 1}. ${q.texte}`;
        fieldset.appendChild(legend);

        q.options.forEach((opt) => {
            const label = document.createElement("label");
            label.className = "block p-3 border rounded-lg mb-2 cursor-pointer hover:bg-emerald-50";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = q.id;
            input.value = opt.fleur;
            input.className = "mr-2";

            label.append(input, opt.texte);
            fieldset.appendChild(label);
        });

        container.appendChild(fieldset);
    });

    // Calcul du résultat
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        errorMessage.textContent = "";

        // Réponses manquantes : on indique lesquelles, sans afficher de résultat
        const manquantes = questions
            .map((q, i) => ({ numero: i + 1, q }))
            .filter(({ q }) => !form.querySelector(`input[name="${q.id}"]:checked`));

        if (manquantes.length > 0) {
            const numeros = manquantes.map((m) => m.numero).join(", ");
            errorMessage.textContent = manquantes.length === 1
                ? `Il manque une réponse à la question ${numeros}.`
                : `Il manque une réponse aux questions ${numeros}.`;
            const premier = form.querySelector(`input[name="${manquantes[0].q.id}"]`);
            if (premier) premier.focus();
            return;
        }

        // Une réponse = une voix pour une fleur
        const counts = {};
        questions.forEach((q) => {
            const fleur = form.querySelector(`input[name="${q.id}"]:checked`).value;
            counts[fleur] = (counts[fleur] || 0) + 1;
        });

        // Égalité : la première fleur ex aequo dans l'ordre des données l'emporte
        // (comparaison stricte >, parcours dans l'ordre de donnees.json)
        let profile = null;
        portraits.forEach((p) => {
            const score = counts[p.id] || 0;
            if (score > 0 && (profile === null || score > (counts[profile.id] || 0))) {
                profile = p;
            }
        });

        if (!profile) {
            errorMessage.textContent = "Aucun portrait ne correspond à vos réponses.";
            return;
        }

        afficherPortrait(profile);
        form.classList.add("hidden");
        result.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
    });

    function afficherPortrait(profile) {
        result.replaceChildren();

        const nom = document.createElement("h2");
        nom.className = "text-xl font-bold text-emerald-800";
        nom.textContent = profile.nom;

        const titre = document.createElement("p");
        titre.className = "italic";
        titre.textContent = profile.titre;

        const description = document.createElement("p");
        description.textContent = profile.description;

        result.append(nom, titre, description);

        // Le conseil n'est affiché que s'il existe
        if (profile.conseil) {
            const conseil = document.createElement("p");
            conseil.className = "font-bold mt-2";
            conseil.textContent = `Conseil d'entretien : ${profile.conseil}`;
            result.appendChild(conseil);
        }
    }

    // Recommencer : réponses effacées, résultat masqué
    resetBtn.addEventListener("click", () => {
        form.reset();
        errorMessage.textContent = "";
        result.replaceChildren();
        result.classList.add("hidden");
        resetBtn.classList.add("hidden");
        form.classList.remove("hidden");
        window.scrollTo({ top: 0 });
    });
});
