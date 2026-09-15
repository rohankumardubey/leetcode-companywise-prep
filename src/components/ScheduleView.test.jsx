import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScheduleView from './ScheduleView';

// Mock canvas-confetti to avoid errors in JSDOM
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

// Mock scrollIntoView since it's not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockSchedule = [
    {
        weekNum: 1,
        time: 60,
        problems: [
            {
                id: '1',
                title: 'Two Sum',
                difficulty: 'Easy',
                duration: 15,
                url: 'https://leetcode.com/problems/two-sum',
                likes: 50000,
                company_count: 100,
                track: 'algorithms',
                relatedTopics: [{ name: 'Array' }],
                solutionLanguages: ['java', 'python', 'cpp'],
                // Case 1: Video present
                videoUrl: 'https://www.youtube.com/watch?v=7jDS9KQEDbI',
                videoThumbnail: 'https://i.ytimg.com/vi/7jDS9KQEDbI/default.jpg'
            },
            {
                id: '2',
                title: 'Add Two Numbers',
                difficulty: 'Medium',
                duration: 20,
                url: 'https://leetcode.com/problems/add-two-numbers',
                likes: 20000,
                company_count: 50
                // Case 2: No video
            }
        ]
    }
];

describe('ScheduleView Component', () => {
    it('renders problem list correctly', () => {
        render(<ScheduleView schedule={mockSchedule} completed={new Set()} setCompleted={() => { }} />);

        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
        expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    it('renders a compact video explanation link when videoUrl is present', () => {
        render(<ScheduleView schedule={mockSchedule} completed={new Set()} setCompleted={() => { }} />);

        const videoLink = screen.getByRole('link', { name: 'Watch video explanation for Two Sum' });
        expect(videoLink).toBeInTheDocument();
        expect(videoLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=7jDS9KQEDbI');
    });

    it('does not render a video action when videoUrl is missing', () => {
        render(<ScheduleView schedule={mockSchedule} completed={new Set()} setCompleted={() => { }} />);

        const missingLink = screen.queryByRole('link', { name: 'Watch video explanation for Add Two Numbers' });
        expect(missingLink).toBeNull();
    });

    it('toggles completion status on click', () => {
        const setCompletedMock = vi.fn();
        render(<ScheduleView schedule={mockSchedule} completed={new Set()} setCompleted={setCompletedMock} />);

        const checkbox = screen.getAllByRole('checkbox')[0]; // Two Sum checkbox
        fireEvent.click(checkbox);

        expect(setCompletedMock).toHaveBeenCalled();
    });

    it('shows the Solutions action only for mapped problem IDs', () => {
        const solutions = {
            '1': {
                languages: {
                    java: { code: 'class Solution {}', sourceUrl: 'https://example.com/1.java' },
                },
            },
        };
        render(
            <ScheduleView
                schedule={mockSchedule}
                completed={new Set()}
                setCompleted={() => {}}
                solutions={solutions}
            />
        );

        expect(screen.getAllByRole('button', { name: 'Solutions' })).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Solutions' }));
        expect(screen.getByRole('dialog', { name: '1. Two Sum' })).toBeInTheDocument();
    });

    it('renders problem, track, topic, and solution-language tags', () => {
        render(<ScheduleView schedule={mockSchedule} completed={new Set()} setCompleted={() => {}} />);

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getAllByText('Algorithms')).not.toHaveLength(0);
        expect(screen.getAllByText('Array')).not.toHaveLength(0);
        expect(screen.getByText('C++')).toBeInTheDocument();
    });
});
