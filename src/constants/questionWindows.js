export const QUESTION_WINDOWS = [
    { id: 'all', label: 'All time' },
    { id: 'thirtyDays', label: 'Last 30 days' },
    { id: 'threeMonths', label: 'Last 3 months' },
    { id: 'sixMonths', label: 'Last 6 months' },
    { id: 'olderThanSixMonths', label: 'Older than 6 months' },
];

export const QUESTION_WINDOW_IDS = new Set(QUESTION_WINDOWS.map(window => window.id));

export function getQuestionWindowLabel(id) {
    return QUESTION_WINDOWS.find(window => window.id === id)?.label || QUESTION_WINDOWS[0].label;
}
