import { QUESTION_WINDOW_IDS } from '../constants/questionWindows';

export function normalizeConfigForProblems(config, problems) {
    const availableCompanies = new Set(problems.flatMap(problem => problem.companies || []));
    const availableTopics = new Set(
        problems.flatMap(problem => (problem.relatedTopics || []).map(topic => topic.name || topic))
    );
    const availableDifficulties = new Set(problems.map(problem => problem.difficulty));
    const selectedDifficulties = (config.selectedDifficulties || [])
        .filter(difficulty => availableDifficulties.has(difficulty));

    return {
        ...config,
        selectedCompanies: (config.selectedCompanies || [])
            .filter(company => availableCompanies.has(company)),
        selectedTopics: (config.selectedTopics || [])
            .filter(topic => availableTopics.has(topic)),
        selectedDifficulties: selectedDifficulties.length > 0
            ? selectedDifficulties
            : [...availableDifficulties],
        questionWindow: QUESTION_WINDOW_IDS.has(config.questionWindow)
            ? config.questionWindow
            : 'all',
    };
}
