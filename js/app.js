// Application Fleurs Roussel.
// Les données viennent de data/donnees.json, produites par le prompt de contenu.
// Règles de code : voir AGENTS.md et les conventions d'intégration de l'agence.
// Logique de calcul du quiz de Madame Roussel

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("quiz-form");
    const questionsContainer = document.getElementById("questions-container");
    const errorMessage = document.getElementById("error-message");
    const resultContainer = document.getElementById("result-container");
    const resetBtn = document.getElementById("reset-btn");

    let questions = [];
    let portraits = {};

    try {
        const [qRes, pRes] = await Promise.all([
            fetch("data/questions.json"),
            fetch("data/portraits.json")
        ]);

        if (!qRes.ok || !pRes.ok) throw new Error("Erreur de chargement des données.");

        const qData = await qRes.json();