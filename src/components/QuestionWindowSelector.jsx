import { QUESTION_WINDOWS } from '../constants/questionWindows';

export default function QuestionWindowSelector({ value, onChange }) {
    return (
        <div>
            <label
                htmlFor="question-window"
                className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
            >
                Interview Recency
            </label>
            <select
                id="question-window"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
                {QUESTION_WINDOWS.map(window => (
                    <option key={window.id} value={window.id}>
                        {window.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
