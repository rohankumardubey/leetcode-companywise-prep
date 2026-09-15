export const PROBLEM_TRACKS = [
    {
        id: 'algorithms',
        label: 'LeetCode Algorithms',
        description: 'Data structures and algorithms with Java, Python, and C++ solutions.',
    },
    {
        id: 'sql',
        label: 'SQL',
        description: 'Database interview questions with executable SQL solutions.',
    },
];

export const normalizeProblemTrack = track =>
    PROBLEM_TRACKS.some(option => option.id === track) ? track : 'algorithms';

export const matchesProblemTrack = (problem, track) =>
    (problem.track || 'algorithms') === normalizeProblemTrack(track);

const leetCodeSlug = title => title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const enrichProblemsWithSolutions = (problems, solutions = {}) => {
    const problemIds = new Set(problems.map(problem => problem.id));
    const enrichedProblems = problems.map(problem => {
        const solutionLanguages = Object.keys(solutions[problem.id]?.languages || {});
        const track = solutionLanguages.includes('sql') ? 'sql' : 'algorithms';
        const relatedTopics = [...(problem.relatedTopics || [])];

        if (track === 'sql' && !relatedTopics.some(topic => (topic.name || topic) === 'Database')) {
            relatedTopics.push({ name: 'Database' });
        }

        return {
            ...problem,
            track,
            relatedTopics,
            solutionLanguages,
        };
    });

    const solutionOnlySqlProblems = Object.entries(solutions)
        .filter(([id, solution]) =>
            !problemIds.has(id) && Boolean(solution.languages?.sql)
        )
        .map(([id, solution]) => ({
            id,
            title: solution.title,
            url: `https://leetcode.com/problems/${leetCodeSlug(solution.title)}`,
            difficulty: 'Unrated',
            duration: 30,
            companyData: {},
            companies: [],
            company_count: 0,
            acceptance: 0,
            likes: 0,
            relatedTopics: [{ name: 'Database' }],
            track: 'sql',
            solutionLanguages: Object.keys(solution.languages),
        }));

    return [...enrichedProblems, ...solutionOnlySqlProblems]
        .sort((a, b) => Number(a.id) - Number(b.id));
};
