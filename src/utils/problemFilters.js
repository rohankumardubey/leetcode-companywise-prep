export function hasCompanyInWindow(problem, company, questionWindow = 'all') {
    if (questionWindow === 'all' && !problem.companyData) {
        return (problem.companies || []).includes(company);
    }

    return problem.companyData?.[company]?.[questionWindow] !== undefined;
}

export function getCompaniesForWindow(problem, questionWindow = 'all') {
    if (questionWindow === 'all' && !problem.companyData) {
        return problem.companies || [];
    }

    return Object.entries(problem.companyData || {})
        .filter(([, periods]) => periods[questionWindow] !== undefined)
        .map(([company]) => company);
}

export function matchesCompanyAndWindow(problem, selectedCompanies, questionWindow = 'all') {
    const companies = selectedCompanies || [];
    if (companies.length > 0) {
        return companies.some(company => hasCompanyInWindow(problem, company, questionWindow));
    }

    return questionWindow === 'all' || getCompaniesForWindow(problem, questionWindow).length > 0;
}

export function getCompanySignal(problem, selectedCompanies, questionWindow = 'all') {
    const companies = selectedCompanies || [];
    if (companies.length > 0) {
        return Math.max(
            ...companies.map(company => problem.companyData?.[company]?.[questionWindow] || 0),
            0
        );
    }

    return getCompaniesForWindow(problem, questionWindow).length;
}
