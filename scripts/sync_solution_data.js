import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LANGUAGE_FILES = {
    java: 'java',
    python: 'py',
    cpp: 'cpp',
};

const SOURCE_REPOSITORY = 'https://github.com/walkccc/LeetCode';

export const parseSolutionDirectory = (directoryName) => {
    const match = /^(\d+)\.\s+(.+)$/.exec(directoryName);
    return match ? { id: match[1], title: match[2] } : null;
};

export const collectSolutions = (repositoryDir, revision) => {
    const solutionsDir = path.join(repositoryDir, 'solutions');
    if (!fs.existsSync(solutionsDir)) {
        throw new Error(`Solution directory not found: ${solutionsDir}`);
    }

    const solutions = {};
    const languageCounts = { java: 0, python: 0, cpp: 0 };

    fs.readdirSync(solutionsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .forEach(entry => {
            const parsed = parseSolutionDirectory(entry.name);
            if (!parsed) return;

            const languages = {};
            Object.entries(LANGUAGE_FILES).forEach(([language, extension]) => {
                const fileName = `${parsed.id}.${extension}`;
                const filePath = path.join(solutionsDir, entry.name, fileName);
                if (!fs.existsSync(filePath)) return;

                const encodedPath = ['solutions', entry.name, fileName]
                    .map(segment => encodeURIComponent(segment))
                    .join('/');
                languages[language] = {
                    code: fs.readFileSync(filePath, 'utf8'),
                    sourceUrl: `${SOURCE_REPOSITORY}/blob/${revision}/${encodedPath}`,
                };
                languageCounts[language] += 1;
            });

            if (Object.keys(languages).length > 0) {
                solutions[parsed.id] = {
                    title: parsed.title,
                    languages,
                };
            }
        });

    return {
        available: true,
        source: {
            name: 'walkccc/LeetCode',
            repository: SOURCE_REPOSITORY,
            license: 'MIT',
            revision,
        },
        problemCount: Object.keys(solutions).length,
        languageCounts,
        solutions,
    };
};

export const writeSolutionCatalog = (repositoryDir, outputFile, revision) => {
    const catalog = collectSolutions(repositoryDir, revision);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(catalog)}\n`);
    return catalog;
};

const isCli = process.argv[1] &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
    const repositoryDir = process.argv[2];
    const outputFile = process.argv[3]
        ? path.resolve(process.argv[3])
        : path.resolve('.cache/solutions.json');
    const revision = process.argv[4];

    if (!repositoryDir || !revision || !fs.existsSync(repositoryDir)) {
        console.error('Error: Pass the walkccc/LeetCode checkout and its revision.');
        process.exit(1);
    }

    const catalog = writeSolutionCatalog(repositoryDir, outputFile, revision);
    console.log(
        `Created ${outputFile} with ${catalog.problemCount} problems ` +
        `(${catalog.languageCounts.java} Java, ${catalog.languageCounts.python} Python, ` +
        `${catalog.languageCounts.cpp} C++ solutions).`
    );
}
