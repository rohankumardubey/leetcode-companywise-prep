import { describe, it, expect } from 'vitest';
import { generateSchedule } from './scheduler';

// Mock Problem Data
const mockProblems = [
    { title: "Two Sum", difficulty: "Easy", companies: ["Google", "Amazon"], companyData: { Google: { all: 100, thirtyDays: 90 }, Amazon: { all: 80 } }, relatedTopics: [{ name: "Array" }], duration: 20, company_count: 50 },
    { title: "3Sum", difficulty: "Medium", companies: ["Meta"], companyData: { Meta: { all: 75, threeMonths: 70 } }, relatedTopics: [{ name: "Array" }], duration: 30, company_count: 30 },
    { title: "Hard Graph", difficulty: "Hard", companies: ["Google"], companyData: { Google: { all: 50, sixMonths: 50 } }, relatedTopics: [{ name: "Graph" }], duration: 45, company_count: 10 },
    { title: "Easy String", difficulty: "Easy", companies: ["Microsoft"], companyData: { Microsoft: { all: 60 } }, relatedTopics: [{ name: "String" }], duration: 15, company_count: 20 },
];

describe('Scheduler Logic', () => {

    it('should generate a schedule for 4 weeks', () => {
        const config = {
            weeks: 4,
            hoursPerWeek: 5,
            selectedDifficulties: ["Easy", "Medium", "Hard"],
            selectedCompanies: [],
            selectedTopics: [],
            experienceLevel: "Intermediate"
        };

        const schedule = generateSchedule(mockProblems, config);
        expect(schedule).toHaveLength(4);
    });

    it('should filter by company correctly', () => {
        const config = {
            weeks: 2,
            hoursPerWeek: 5,
            selectedDifficulties: ["Easy", "Medium", "Hard"],
            selectedCompanies: ["Google"], // Only Google
            selectedTopics: [],
            experienceLevel: "Intermediate"
        };

        const schedule = generateSchedule(mockProblems, config);
        const allScheduledProblems = schedule.flatMap(w => w.problems);

        // Should only have "Two Sum" and "Hard Graph"
        expect(allScheduledProblems.length).toBeGreaterThan(0);
        allScheduledProblems.forEach(p => {
            expect(p.companies).toContain("Google");
        });
    });

    it('should filter by difficulty', () => {
        const config = {
            weeks: 2,
            hoursPerWeek: 5,
            selectedDifficulties: ["Hard"], // Only Hard
            selectedCompanies: [],
            selectedTopics: [],
            experienceLevel: "Expert"
        };

        const schedule = generateSchedule(mockProblems, config);
        const allScheduledProblems = schedule.flatMap(w => w.problems);

        expect(allScheduledProblems.length).toBe(1);
        expect(allScheduledProblems[0].title).toBe("Hard Graph");
    });

    it('should respect topic constraints', () => {
        const config = {
            weeks: 1,
            hoursPerWeek: 5,
            selectedDifficulties: ["Easy", "Medium"],
            selectedCompanies: [],
            selectedTopics: ["String"], // Only String
            experienceLevel: "Beginner"
        };

        const schedule = generateSchedule(mockProblems, config);
        const allScheduledProblems = schedule.flatMap(w => w.problems);

        expect(allScheduledProblems.length).toBe(1);
        expect(allScheduledProblems[0].title).toBe("Easy String");
    });

    it('should filter company questions by interview recency', () => {
        const schedule = generateSchedule(mockProblems, {
            weeks: 1,
            hoursPerWeek: 5,
            selectedDifficulties: ["Easy", "Medium", "Hard"],
            selectedCompanies: ["Google"],
            selectedTopics: [],
            experienceLevel: "Intermediate",
            questionWindow: "thirtyDays"
        });

        expect(schedule.flatMap(week => week.problems).map(problem => problem.title)).toEqual(["Two Sum"]);
    });
});
