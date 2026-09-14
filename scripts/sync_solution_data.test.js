import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectSolutions, parseSolutionDirectory } from './sync_solution_data';

const tempDirectories = [];

const createRepository = () => {
    const repositoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solution-importer-'));
    tempDirectories.push(repositoryDir);
    fs.mkdirSync(path.join(repositoryDir, 'solutions'), { recursive: true });
    return repositoryDir;
};

afterEach(() => {
    tempDirectories.splice(0).forEach(directory => {
        fs.rmSync(directory, { recursive: true, force: true });
    });
});

describe('solution importer', () => {
    it('parses only numeric problem directories', () => {
        expect(parseSolutionDirectory('1. Two Sum')).toEqual({ id: '1', title: 'Two Sum' });
        expect(parseSolutionDirectory('LCCI 01.01. Is Unique')).toBeNull();
    });

    it('maps exact numeric IDs and emits only available languages', () => {
        const repositoryDir = createRepository();
        const problemDir = path.join(repositoryDir, 'solutions', '1. Two Sum');
        fs.mkdirSync(problemDir);
        fs.writeFileSync(path.join(problemDir, '1.java'), 'class Solution {}');
        fs.writeFileSync(path.join(problemDir, '1.py'), 'class Solution:\n  pass\n');
        fs.writeFileSync(path.join(problemDir, '2.cpp'), '// wrong problem ID');

        const catalog = collectSolutions(repositoryDir, 'abc123');

        expect(catalog).toMatchObject({
            available: true,
            problemCount: 1,
            languageCounts: { java: 1, python: 1, cpp: 0 },
            source: { name: 'walkccc/LeetCode', license: 'MIT', revision: 'abc123' },
        });
        expect(catalog.solutions['1'].languages).toEqual({
            java: {
                code: 'class Solution {}',
                sourceUrl: expect.stringContaining('/1.%20Two%20Sum/1.java'),
            },
            python: {
                code: 'class Solution:\n  pass\n',
                sourceUrl: expect.stringContaining('/1.%20Two%20Sum/1.py'),
            },
        });
        expect(catalog.solutions['2']).toBeUndefined();
    });
});
