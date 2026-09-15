import { matchesProblemTrack, PROBLEM_TRACKS } from '../utils/problemTracks';

export default function ProblemTrackSelector({ value, onChange, problems = [], large = false }) {
    return (
        <fieldset>
            <legend className={`font-semibold text-gray-600 dark:text-gray-400 ${large ? 'mb-4 text-sm uppercase tracking-wider' : 'mb-2 text-sm'}`}>
                Question Track
            </legend>
            <div className={`grid gap-3 ${large ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'}`}>
                {PROBLEM_TRACKS.map(track => {
                    const trackProblems = problems.filter(problem => matchesProblemTrack(problem, track.id));
                    const companyTaggedCount = trackProblems.filter(problem =>
                        (problem.companies || []).length > 0
                    ).length;

                    return (
                    <button
                        key={track.id}
                        type="button"
                        onClick={() => onChange(track.id)}
                        aria-pressed={value === track.id}
                        className={`rounded-xl border-2 text-left transition-all ${
                            large ? 'p-5' : 'p-3'
                        } ${
                            value === track.id
                                ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:text-blue-200'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300'
                        }`}
                    >
                        <span className="block text-sm font-bold">{track.label}</span>
                        <span className="mt-1 block text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
                            {trackProblems.length.toLocaleString()} questions
                            {track.id === 'sql' && companyTaggedCount < trackProblems.length
                                ? ` · ${companyTaggedCount} company-tagged`
                                : ''}
                        </span>
                        {large && (
                            <span className="mt-2 block text-sm font-normal text-gray-500 dark:text-gray-400">
                                {track.description}
                            </span>
                        )}
                    </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
