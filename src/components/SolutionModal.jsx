import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const LANGUAGES = [
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' },
    { id: 'cpp', label: 'C++' },
];

export default function SolutionModal({ problem, solution, onClose }) {
    const availableLanguages = LANGUAGES.filter(({ id }) => solution?.languages[id]);
    const [activeLanguage, setActiveLanguage] = useState(availableLanguages[0]?.id);
    const [copyStatus, setCopyStatus] = useState('idle');
    const closeButtonRef = useRef(null);

    useEffect(() => {
        setActiveLanguage(availableLanguages[0]?.id);
        setCopyStatus('idle');
    }, [solution]);

    useEffect(() => {
        const handleKeyDown = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!problem || !solution || availableLanguages.length === 0) return null;

    const activeSolution = solution.languages[activeLanguage];
    const copySolution = async () => {
        try {
            await navigator.clipboard.writeText(activeSolution.code);
            setCopyStatus('copied');
        } catch (error) {
            console.error('Failed to copy solution', error);
            setCopyStatus('error');
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={event => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="solution-modal-title"
                className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-800"
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700">
                    <div>
                        <h2 id="solution-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                            {problem.id}. {problem.title}
                        </h2>
                        <a
                            href="https://github.com/walkccc/LeetCode"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                            Solutions from walkccc/LeetCode (MIT)
                        </a>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Close solutions"
                    >
                        Close
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                    <div role="tablist" aria-label="Solution language" className="flex gap-2">
                        {availableLanguages.map(language => (
                            <button
                                key={language.id}
                                type="button"
                                role="tab"
                                aria-selected={activeLanguage === language.id}
                                aria-controls="solution-code-panel"
                                onClick={() => {
                                    setActiveLanguage(language.id);
                                    setCopyStatus('idle');
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeLanguage === language.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {language.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={copySolution}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy'}
                        </button>
                        <a
                            href={activeSolution.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            View source
                        </a>
                    </div>
                </div>

                <div
                    id="solution-code-panel"
                    role="tabpanel"
                    className="min-h-0 flex-1 overflow-auto bg-slate-950 p-5"
                >
                    <pre className="min-w-max whitespace-pre text-sm leading-6 text-slate-100">
                        <code>{activeSolution.code}</code>
                    </pre>
                </div>
            </div>
        </div>,
        document.body
    );
}
