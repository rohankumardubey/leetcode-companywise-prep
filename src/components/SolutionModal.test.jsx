import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SolutionModal from './SolutionModal';

const problem = { id: '1', title: 'Two Sum' };
const solution = {
    languages: {
        java: { code: 'class Solution {}', sourceUrl: 'https://example.com/1.java' },
        python: { code: 'class Solution:\n    pass', sourceUrl: 'https://example.com/1.py' },
    },
};

describe('SolutionModal', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
    });

    it('switches among available languages and omits missing ones', () => {
        render(<SolutionModal problem={problem} solution={solution} onClose={() => {}} />);

        expect(screen.getByText('class Solution {}')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: 'Python' }));
        expect(screen.getByText(/class Solution:/)).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'C++' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://example.com/1.py');
    });

    it('copies the active solution and closes with Escape', async () => {
        const onClose = vi.fn();
        render(<SolutionModal problem={problem} solution={solution} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('class Solution {}'));
        expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
