export const calculateStats = (solves) => {
    if (!solves || solves.length === 0) return { bestSingle: Infinity, todayCount: 0 };

    // 1. Calculate Best Single (PB)
    // Filter out DNFs (assuming null or 'DNS' are invalid, but valid times are numbers)
    const validSolves = solves.filter(s => typeof s.time === 'number' && s.penalty !== 'DNF' && s.penalty !== 'DNS');
    
    let bestSingle = Infinity;
    if (validSolves.length > 0) {
        bestSingle = Math.min(...validSolves.map(s => s.time));
    }

    // 2. Calculate Solves Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = solves.filter(s => {
        const solveDate = new Date(s.date);
        return solveDate >= startOfToday;
    }).length;

    return {
        bestSingle,
        todayCount
    };
};