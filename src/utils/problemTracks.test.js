import { describe, expect, it } from 'vitest';
import { enrichProblemsWithSolutions, matchesProblemTrack, normalizeProblemTrack } from './problemTracks';

describe('problem tracks', () => {
    it('separates SQL questions and adds database metadata', () => {
        const enriched = enrichProblemsWithSolutions(
            [
                { id: '175', relatedTopics: [] },
                { id: '1', relatedTopics: [{ name: 'Array' }] },
            ],
            {
                '175': { languages: { sql: {} } },
                '1': { languages: { java: {}, python: {} } },
            }
        );
        const sqlProblem = enriched.find(problem => problem.id === '175');
        const algorithmProblem = enriched.find(problem => problem.id === '1');

        expect(sqlProblem).toMatchObject({
            track: 'sql',
            relatedTopics: [{ name: 'Database' }],
            solutionLanguages: ['sql'],
        });
        expect(algorithmProblem).toMatchObject({
            track: 'algorithms',
            relatedTopics: [{ name: 'Array' }],
            solutionLanguages: ['java', 'python'],
        });
    });

    it('adds SQL solution-only problems to the SQL track', () => {
        const problems = enrichProblemsWithSolutions([], {
            '2253': {
                title: 'Dynamic Unpivoting of a Table',
                languages: { sql: {} },
            },
            '9999': {
                title: 'Algorithm Only',
                languages: { java: {} },
            },
        });

        expect(problems).toEqual([
            expect.objectContaining({
                id: '2253',
                title: 'Dynamic Unpivoting of a Table',
                track: 'sql',
                difficulty: 'Unrated',
                relatedTopics: [{ name: 'Database' }],
                solutionLanguages: ['sql'],
            }),
        ]);
    });

    it('defaults unknown and missing tracks to algorithms', () => {
        expect(normalizeProblemTrack()).toBe('algorithms');
        expect(normalizeProblemTrack('other')).toBe('algorithms');
        expect(matchesProblemTrack({ track: 'algorithms' }, 'other')).toBe(true);
    });
});
