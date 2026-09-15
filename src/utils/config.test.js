import { describe, expect, it } from 'vitest';
import { normalizeConfigForProblems } from './config';

const problems = [
    {
        difficulty: 'Easy',
        companies: [],
        relatedTopics: [{ name: 'Array' }],
    },
    {
        difficulty: 'Medium',
        companies: [],
        relatedTopics: [{ name: 'Graph' }],
    },
];

describe('normalizeConfigForProblems', () => {
    it('removes filters that are unavailable in the current dataset', () => {
        const config = normalizeConfigForProblems({
            selectedCompanies: ['Google', 'Meta'],
            selectedTopics: ['Array', 'Database'],
            selectedDifficulties: ['Easy', 'Hard'],
        }, problems);

        expect(config.selectedCompanies).toEqual([]);
        expect(config.selectedTopics).toEqual(['Array']);
        expect(config.selectedDifficulties).toEqual(['Easy']);
        expect(config.questionWindow).toBe('all');
        expect(config.track).toBe('algorithms');
    });

    it('normalizes filters within the selected question track', () => {
        const config = normalizeConfigForProblems({
            track: 'sql',
            selectedCompanies: [],
            selectedTopics: ['Array', 'Database'],
            selectedDifficulties: ['Easy', 'Hard'],
        }, [
            ...problems.map(problem => ({ ...problem, track: 'algorithms' })),
            {
                track: 'sql',
                difficulty: 'Easy',
                companies: [],
                relatedTopics: [{ name: 'Database' }],
            },
        ]);

        expect(config.track).toBe('sql');
        expect(config.selectedTopics).toEqual(['Database']);
        expect(config.selectedDifficulties).toEqual(['Easy']);
    });

    it('restores all available difficulties when none of the saved values exist', () => {
        const config = normalizeConfigForProblems({
            selectedCompanies: [],
            selectedTopics: [],
            selectedDifficulties: ['Hard'],
        }, problems);

        expect(config.selectedDifficulties).toEqual(['Easy', 'Medium']);
    });

    it('preserves supported interview windows and resets unknown values', () => {
        expect(normalizeConfigForProblems({
            selectedCompanies: [],
            selectedTopics: [],
            selectedDifficulties: ['Easy'],
            questionWindow: 'threeMonths',
        }, problems).questionWindow).toBe('threeMonths');

        expect(normalizeConfigForProblems({
            selectedCompanies: [],
            selectedTopics: [],
            selectedDifficulties: ['Easy'],
            questionWindow: 'lastQuarter',
        }, problems).questionWindow).toBe('all');
    });
});
