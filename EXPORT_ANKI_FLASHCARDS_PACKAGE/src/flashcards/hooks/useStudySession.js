import { useState, useCallback, useRef } from 'react';

/**
 * Simplified SM-2 Spaced Repetition Algorithm
 * 
 * Difficulty levels:
 *   0 = new (never studied)
 *   1 = learning (failed recently)
 *   2 = reviewing (passed at least once)
 *   3 = mastered (passed multiple times in a row)
 * 
 * Quality ratings:
 *   0 = wrong
 *   1 = hard (correct but struggled)
 *   2 = good
 *   3 = easy (instant recall)
 */

const INTERVALS = {
    0: 0,           // New → immediate
    1: 1 * 60000,   // Learning → 1 minute
    2: 10 * 60000,  // Reviewing → 10 minutes
    3: 24 * 3600000 // Mastered → 1 day
};

function calculateNextReview(currentDifficulty, quality) {
    let newDifficulty = currentDifficulty;

    if (quality === 0) {
        // Wrong → drop to learning
        newDifficulty = Math.max(0, currentDifficulty - 1);
    } else if (quality >= 2) {
        // Good or Easy → promote
        newDifficulty = Math.min(3, currentDifficulty + 1);
    }
    // quality === 1 (hard) → stay at same level

    const interval = INTERVALS[newDifficulty] || 0;
    return {
        newDifficulty,
        nextReview: Date.now() + interval
    };
}

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Fuzzy string comparison for Write mode.
 * Tolerant to: case, accents, extra spaces, common punctuation.
 */
export function fuzzyMatch(userAnswer, correctAnswer) {
    const normalize = (s) =>
        s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
            .replace(/[^\w\s]/g, '') // strip punctuation
            .replace(/\s+/g, ' ')    // collapse whitespace
            .trim();

    const a = normalize(userAnswer);
    const b = normalize(correctAnswer);

    if (a === b) return { match: 'exact', score: 1 };

    // Check if it's "close enough" (Levenshtein distance ≤ 20% of length)
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return { match: 'exact', score: 1 };

    const dist = levenshtein(a, b);
    const similarity = 1 - (dist / maxLen);

    if (similarity >= 0.85) return { match: 'close', score: similarity };
    return { match: 'wrong', score: similarity };
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

export default function useStudySession() {
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState([]); // { cardId, correct, quality, newDifficulty, nextReview }
    const [isComplete, setIsComplete] = useState(false);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const startTimeRef = useRef(null);

    const startSession = useCallback((cards, { shuffle = true, onlyDifficult = false } = {}) => {
        let pool = [...cards];

        if (onlyDifficult) {
            pool = pool.filter(c => c.difficulty < 3);
        }

        if (shuffle) {
            pool = shuffleArray(pool);
        }

        setQueue(pool);
        setCurrentIndex(0);
        setResults([]);
        setIsComplete(false);
        setStreak(0);
        setBestStreak(0);
        startTimeRef.current = Date.now();
    }, []);

    const currentCard = queue[currentIndex] || null;

    const submitAnswer = useCallback((cardId, quality) => {
        // quality: 0 = wrong, 1 = hard, 2 = good, 3 = easy
        const card = queue.find(c => c.id === cardId);
        if (!card) return;

        const correct = quality >= 1;
        const { newDifficulty, nextReview } = calculateNextReview(card.difficulty || 0, quality);

        const result = { cardId, correct, quality, newDifficulty, nextReview };

        setResults(prev => [...prev, result]);

        // Update streak
        if (correct) {
            setStreak(prev => {
                const newStreak = prev + 1;
                setBestStreak(best => Math.max(best, newStreak));
                return newStreak;
            });
        } else {
            setStreak(0);
        }

        // Move to next card or complete
        if (currentIndex + 1 >= queue.length) {
            setIsComplete(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    }, [queue, currentIndex]);

    const getProgress = useCallback(() => {
        const total = queue.length;
        const answered = results.length;
        const correct = results.filter(r => r.correct).length;
        const incorrect = answered - correct;
        const remaining = total - answered;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

        return { total, answered, correct, incorrect, remaining, percentage, elapsed, streak, bestStreak };
    }, [queue, results, streak, bestStreak]);

    const getResults = useCallback(() => {
        const total = queue.length;
        const correct = results.filter(r => r.correct).length;
        const incorrect = total - correct;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

        return {
            total,
            correct,
            incorrect,
            score,
            elapsed,
            bestStreak,
            results, // detailed per-card results
            incorrectCards: results
                .filter(r => !r.correct)
                .map(r => queue.find(c => c.id === r.cardId))
                .filter(Boolean)
        };
    }, [queue, results, bestStreak]);

    const restartWithIncorrect = useCallback(() => {
        const incorrectCards = results
            .filter(r => !r.correct)
            .map(r => queue.find(c => c.id === r.cardId))
            .filter(Boolean);

        if (incorrectCards.length === 0) return;

        setQueue(shuffleArray(incorrectCards));
        setCurrentIndex(0);
        setResults([]);
        setIsComplete(false);
        setStreak(0);
        setBestStreak(0);
        startTimeRef.current = Date.now();
    }, [results, queue]);

    const restart = useCallback(() => {
        setQueue(prev => shuffleArray([...prev]));
        setCurrentIndex(0);
        setResults([]);
        setIsComplete(false);
        setStreak(0);
        setBestStreak(0);
        startTimeRef.current = Date.now();
    }, []);

    // Generate distractors for Learn mode (multiple choice)
    const getDistractors = useCallback((correctCard, count = 3) => {
        const others = queue.filter(c => c.id !== correctCard.id);
        const shuffled = shuffleArray(others);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }, [queue]);

    return {
        queue,
        currentCard,
        currentIndex,
        isComplete,
        streak,
        bestStreak,
        startSession,
        submitAnswer,
        getProgress,
        getResults,
        getDistractors,
        restartWithIncorrect,
        restart
    };
}
