import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const rootDir = process.cwd();
const companyDataDir = process.argv[2];
const outputFile = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(rootDir, '.cache/companyProblems.json');

if (!companyDataDir || !fs.existsSync(companyDataDir)) {
    console.error('Error: Pass the cloned company-data repository as the first argument.');
    process.exit(1);
}

const normalizeUrl = (value) => {
    try {
        return new URL(value).pathname
            .replace(/\/description\/?$/, '')
            .replace(/\/$/, '');
    } catch {
        return '';
    }
};

const formatCompanyName = (slug) => {
    const names = {
        airbnb: 'Airbnb',
        amazon: 'Amazon',
        amd: 'AMD',
        apple: 'Apple',
        google: 'Google',
        ibm: 'IBM',
        meta: 'Meta',
        microsoft: 'Microsoft',
        netflix: 'Netflix',
        nvidia: 'NVIDIA',
        sap: 'SAP',
        uber: 'Uber',
    };

    return names[slug] || slug
        .split('-')
        .map(word => word ? word[0].toUpperCase() + word.slice(1) : word)
        .join(' ');
};

const estimateDuration = (difficulty) => {
    if (difficulty === 'Easy') return 25;
    if (difficulty === 'Hard') return 60;
    return 40;
};

const parsePercent = (value) => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : 0;
};

const questionWindows = [
    { id: 'all', file: 'all.csv' },
    { id: 'thirtyDays', file: 'thirty-days.csv' },
    { id: 'threeMonths', file: 'three-months.csv' },
    { id: 'sixMonths', file: 'six-months.csv' },
    { id: 'olderThanSixMonths', file: 'more-than-six-months.csv' },
];

const problemsByUrl = new Map();
const companyDirectories = fs.readdirSync(companyDataDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(companyDataDir, entry.name, 'all.csv')));

companyDirectories.forEach(({ name }) => {
    const company = formatCompanyName(name);
    questionWindows.forEach(({ id, file }) => {
        const csvFile = path.join(companyDataDir, name, file);
        if (!fs.existsSync(csvFile)) return;

        const rows = parse(fs.readFileSync(csvFile, 'utf8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });

        rows.forEach(row => {
            const normalizedUrl = normalizeUrl(row.URL);
            if (!normalizedUrl) return;

            if (!problemsByUrl.has(normalizedUrl)) {
                problemsByUrl.set(normalizedUrl, {
                    id: String(row.ID || normalizedUrl),
                    title: row.Title,
                    url: `https://leetcode.com${normalizedUrl}`,
                    difficulty: row.Difficulty || 'Medium',
                    duration: estimateDuration(row.Difficulty),
                    companyData: {},
                    acceptance: parsePercent(row['Acceptance %']),
                    company_count: 0,
                    relatedTopics: [],
                    likes: 0,
                });
            }

            const problem = problemsByUrl.get(normalizedUrl);
            if (!problem.companyData[company]) {
                problem.companyData[company] = {};
            }
            problem.companyData[company][id] = parsePercent(row['Frequency %']);
        });
    });
});

const problems = [...problemsByUrl.values()]
    .map(problem => ({
        ...problem,
        companies: Object.keys(problem.companyData).sort(),
        company_count: Object.keys(problem.companyData).length,
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));

if (problems.length === 0) {
    console.error(`Error: No company questions were found in ${companyDataDir}`);
    process.exit(1);
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(problems, null, 2)}\n`);
console.log(
    `Created ${outputFile} with ${problems.length} questions from ` +
    `${companyDirectories.length} companies.`
);
