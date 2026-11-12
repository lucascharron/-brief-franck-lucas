// Application Fleurs Roussel.
// Les données viennent de data/donnees.json, produites par le prompt de contenu.
// Règles de code : voir AGENTS.md et les conventions d'intégration de l'agence.
// Logique de calcul du quiz de Madame Roussel
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("quiz-form");
    const container = document.getElementById("questions-container");

    try {
        const [qRes, pRes] = await Promise.all([
            fetch("data/question.json"),
            fetch("data/portraits.json")
        ]);

        const { questions } = await qRes.json();
        const portraits = await pRes.json();

        // Génération dynamique des questions
        questions.forEach((q, index) => {
            const div = document.createElement("div");
            div.innerHTML = `
                <p class="font-semibold mb-2">${index + 1}. ${q.texte}</p>
                ${q.options.map((opt, i) => `
                    <label class="block p-3 border rounded-lg mb-2 cursor-pointer hover:bg-emerald-50">
                        <input type="radio" name="${q.id}" value="${opt.fleur}" required class="mr-2">
                        ${opt.texte}
                    </label>
                `).join('')}
            `;
            container.appendChild(div);
        });

        // Gestion du submit
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const counts = {};

            for (let value of formData.values()) {
                counts[value] = (counts[value] || 0) + 1;
            }

            const winner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            const profile = portraits.find(p => p.id === winner);

            document.getElementById("result-container").innerHTML = `
                <h2 class="text-xl font-bold text-emerald-800">${profile.nom}</h2>
                <p class="italic">${profile.titre}</p>
                <p>${profile.description}</p>
                <p class="font-bold mt-2">Conseil : ${profile.conseil}</p>
            `;
            document.getElementById("result-container").classList.remove("hidden");
            form.classList.add("hidden");
            document.getElementById("reset-btn").classList.remove("hidden");
        });

        document.getElementById("reset-btn").addEventListener("click", () => location.reload());

    } catch (err) {
        console.error("Erreur critique :", err);
        document.getElementById("error-message").textContent = "Impossible de charger le quiz.";
    }
});