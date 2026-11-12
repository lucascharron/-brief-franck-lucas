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
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const submitBtn = document.getElementById("submit-btn");
    const progress = document.getElementById("progress");
    const progressLabel = document.getElementById("progress-label");
    const progressBar = document.getElementById("progress-bar");
    const progressFill = document.getElementById("progress-fill");

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

    // ---------- Affichage des questions (une seule visible à la fois) ----------

    const fieldsets = questions.map((q, index) => {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "hidden";
        fieldset.tabIndex = -1;

        const legend = document.createElement("legend");
        legend.className = "font-semibold mb-2";
        legend.textContent = `${index + 1}. ${q.texte}`;
        fieldset.appendChild(legend);

        q.options.forEach((opt) => {
            const label = document.createElement("label");
            label.className = "block p-3 border rounded-lg mb-2 cursor-pointer hover:bg-emerald-50 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = q.id;
            input.value = opt.fleur;
            input.className = "mr-2";

            label.append(input, opt.texte);
            fieldset.appendChild(label);
        });

        container.appendChild(fieldset);
        return fieldset;
    });

    let current = 0;

    function reponse(q) {
        const checked = form.querySelector(`input[name="${q.id}"]:checked`);
        return checked ? checked.value : null;
    }

    function afficherQuestion(index, focus = false) {
        current = index;
        errorMessage.textContent = "";

        fieldsets.forEach((fs, i) => fs.classList.toggle("hidden", i !== index));

        const total = questions.length;
        progressLabel.textContent = `Question ${index + 1} sur ${total}`;
        progressFill.style.width = `${((index + 1) / total) * 100}%`;
        progressBar.setAttribute("aria-valuemax", String(total));
        progressBar.setAttribute("aria-valuenow", String(index + 1));

        prevBtn.classList.toggle("hidden", index === 0);
        nextBtn.classList.toggle("hidden", index === total - 1);
        submitBtn.classList.toggle("hidden", index !== total - 1);

        if (focus) fieldsets[index].focus();
    }

    function suivant() {
        if (!reponse(questions[current])) {
            errorMessage.textContent = `Choisissez une réponse à la question ${current + 1} pour continuer.`;
            return;
        }
        afficherQuestion(current + 1, true);
    }

    prevBtn.addEventListener("click", () => afficherQuestion(current - 1, true));
    nextBtn.addEventListener("click", suivant);

    progress.classList.remove("hidden");
    afficherQuestion(0);

    // ---------- Calcul du résultat ----------

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Touche Entrée avant la dernière question : on avance simplement
        if (current < questions.length - 1) {
            suivant();
            return;
        }

        // Réponses manquantes : on indique lesquelles, sans afficher de résultat
        const manquantes = questions
            .map((q, i) => ({ numero: i + 1, index: i, q }))
            .filter(({ q }) => !reponse(q));

        if (manquantes.length > 0) {
            const numeros = manquantes.map((m) => m.numero).join(", ");
            afficherQuestion(manquantes[0].index, true);
            errorMessage.textContent = manquantes.length === 1
                ? `Il manque une réponse à la question ${numeros}.`
                : `Il manque une réponse aux questions ${numeros}.`;
            return;
        }

        // Une réponse = une voix pour une fleur
        const counts = {};
        questions.forEach((q) => {
            const fleur = reponse(q);
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

        afficherResultat(profile, counts);
        form.classList.add("hidden");
        result.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        result.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function afficherResultat(profile, counts) {
        result.replaceChildren();

        // Portrait
        const nom = document.createElement("h2");
        nom.className = "text-xl font-bold text-emerald-800";
        nom.textContent = profile.nom;

        const titre = document.createElement("p");
        titre.className = "italic";
        titre.textContent = profile.titre;

        const description = document.createElement("p");
        description.textContent = profile.description;

        // Illustration : img/fleurs/<id>.svg (le schéma interdit d'ajouter une clé
        // dans donnees.json, le chemin est donc déduit de l'id). Masquée si absente.
        const entete = document.createElement("div");
        entete.className = "flex items-center gap-4";

        const image = document.createElement("img");
        image.src = `img/fleurs/${encodeURIComponent(profile.id)}.svg`;
        image.alt = "";
        image.width = 96;
        image.height = 96;
        image.className = "h-24 w-24 shrink-0";
        image.addEventListener("error", () => image.remove());

        const textes = document.createElement("div");
        textes.append(nom, titre);
        entete.append(image, textes);

        result.append(entete, description);

        // Le conseil n'est affiché que s'il existe
        if (profile.conseil) {
            const conseil = document.createElement("p");
            conseil.className = "font-bold mt-2";
            conseil.textContent = `Conseil d'entretien : ${profile.conseil}`;
            result.appendChild(conseil);
        }

        // Lien vers les bouquets de la fleur
        const lien = document.createElement("a");
        lien.href = `bouquets.html?fleur=${encodeURIComponent(profile.id)}`;
        lien.className = "inline-block mt-2 rounded-lg bg-roussel-vert px-4 py-2 font-medium text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roussel-vert";
        lien.textContent = `Voir nos bouquets ${deFleur(profile.nom)}`;
        result.appendChild(lien);

        // Nombre de réponses obtenues par chaque fleur (ordre des données)
        const sousTitre = document.createElement("h3");
        sousTitre.className = "mt-4 font-semibold text-zinc-800";
        sousTitre.textContent = "Vos réponses par fleur";

        const liste = document.createElement("ul");
        liste.className = "space-y-1";
        portraits.forEach((p) => {
            const n = counts[p.id] || 0;
            const item = document.createElement("li");
            item.className = p.id === profile.id ? "font-bold text-emerald-800" : "";
            item.textContent = `${p.nom} : ${n} réponse${n > 1 ? "s" : ""}`;
            liste.appendChild(item);
        });

        result.append(sousTitre, liste);
    }

    // « de pivoine », « d'orchidée »
    function deFleur(nomFleur) {
        const nom = nomFleur.toLowerCase();
        return /^[aeiouyàâéèêëîïôöùûüœh]/.test(nom) ? `d'${nom}` : `de ${nom}`;
    }

    // ---------- Recommencer : réponses effacées, résultat masqué ----------

    resetBtn.addEventListener("click", () => {
        form.reset();
        result.replaceChildren();
        result.classList.add("hidden");
        resetBtn.classList.add("hidden");
        form.classList.remove("hidden");
        afficherQuestion(0);
        window.scrollTo({ top: 0 });
    });
});
