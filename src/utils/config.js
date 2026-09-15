import { QUESTION_WINDOW_IDS } from '../constants/questionWindows';
import { matchesProblemTrack, normalizeProblemTrack } from './problemTracks';

export function normalizeConfigForProblems(config, problems) {
    const track = normalizeProblemTrack(config.track);
    const trackProblems = problems.filter(problem => matchesProblemTrack(problem, track));
    const availableCompanies = new Set(trackProblems.flatMap(problem => problem.companies || []));
    const availableTopics = new Set(
        trackProblems.flatMap(problem => (problem.relatedTopics || []).map(topic => topic.name || topic))
    );
    const availableDifficulties = new Set(trackProblems.map(problem => problem.difficulty));
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
        track,
    };
}
