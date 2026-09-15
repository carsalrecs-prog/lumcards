import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, Trophy, Clock, RotateCcw } from 'lucide-react';

function shuffleArray(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

export default function MatchMode({ cards, onComplete, showToast }) {
    const MAX_PAIRS = 6;
    const [tiles, setTiles] = useState([]);
    const [selected, setSelected] = useState(null); // { id, pairId, type }
    const [matched, setMatched] = useState(new Set());
    const [wrongPair, setWrongPair] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [moves, setMoves] = useState(0);
    const [bestTime, setBestTime] = useState(() => {
        const saved = localStorage.getItem('flashcards_match_best');
        return saved ? parseInt(saved) : null;
    });
    const timerRef = useRef(null);

    // Initialize tiles
    useEffect(() => {
        const pool = shuffleArray(cards).slice(0, MAX_PAIRS);
        const fronts = pool.map(c => ({ id: `f-${c.id}`, pairId: c.id, type: 'front', text: c.front }));
        const backs = pool.map(c => ({ id: `b-${c.id}`, pairId: c.id, type: 'back', text: c.back }));
        setTiles(shuffleArray([...fronts, ...backs]));
        setMatched(new Set());
        setSelected(null);
        setWrongPair(null);
        setTimer(0);
        setIsRunning(true);
        setIsFinished(false);
        setMoves(0);
    }, [cards]);

    // Timer
    useEffect(() => {
        if (isRunning && !isFinished) {
            timerRef.current = setInterval(() => setTimer(t => t + 100), 100);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, isFinished]);

    // Check win condition
    useEffect(() => {
        const totalPairs = Math.min(cards.length, MAX_PAIRS);
        if (matched.size === totalPairs && totalPairs > 0 && isRunning) {
            setIsFinished(true);
            setIsRunning(false);
            clearInterval(timerRef.current);

            // Save best time
            if (!bestTime || timer < bestTime) {
                setBestTime(timer);
                localStorage.setItem('flashcards_match_best', timer.toString());
            }
        }
    }, [matched.size, cards.length, isRunning, timer, bestTime]);

    const handleTileClick = useCallback((tile) => {
        if (matched.has(tile.pairId) || wrongPair) return;

        if (!selected) {
            setSelected(tile);
            return;
        }

        // Already selected, check match
        if (selected.id === tile.id) {
            setSelected(null);
            return;
        }

        setMoves(m => m + 1);

        if (selected.pairId === tile.pairId && selected.type !== tile.type) {
            // Match!
            setMatched(prev => new Set([...prev, tile.pairId]));
            setSelected(null);
        } else {
            // Wrong
            setWrongPair({ a: selected.id, b: tile.id });
            setTimeout(() => {
                setWrongPair(null);
                setSelected(null);
            }, 600);
        }
    }, [selected, matched, wrongPair]);

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${seconds}.${tenths}s`;
    };

    const handleRestart = () => {
        const pool = shuffleArray(cards).slice(0, MAX_PAIRS);
        const fronts = pool.map(c => ({ id: `f-${c.id}`, pairId: c.id, type: 'front', text: c.front }));
        const backs = pool.map(c => ({ id: `b-${c.id}`, pairId: c.id, type: 'back', text: c.back }));
        setTiles(shuffleArray([...fronts, ...backs]));
        setMatched(new Set());
        setSelected(null);
        setWrongPair(null);
        setTimer(0);
        setIsRunning(true);
        setIsFinished(false);
        setMoves(0);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Puzzle size={22} className="text-orange-400" /> Match
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-400 flex items-center gap-1">
                        <Clock size={14} /> {formatTime(timer)}
                    </span>
                    <span className="text-xs text-gray-500">{moves} movimientos</span>
                </div>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full"
                    animate={{ width: `${(matched.size / Math.min(cards.length, MAX_PAIRS)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Tiles Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                <AnimatePresence>
                    {tiles.map((tile, idx) => {
                        const isMatched = matched.has(tile.pairId);
                        const isSelected = selected?.id === tile.id;
                        const isWrong = wrongPair && (wrongPair.a === tile.id || wrongPair.b === tile.id);

                        if (isMatched) {
                            return (
                                <motion.div
                                    key={tile.id}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                    className="aspect-[4/3] rounded-2xl"
                                />
                            );
                        }

                        return (
                            <motion.button
                                key={tile.id}
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{
                                    opacity: 1,
                                    scale: isWrong ? [1, 0.95, 1.05, 0.95, 1] : 1,
                                    y: 0,
                                    x: isWrong ? [0, -5, 5, -5, 0] : 0
                                }}
                                transition={{
                                    delay: idx * 0.03,
                                    scale: { duration: 0.4 },
                                    x: { duration: 0.4 }
                                }}
                                onClick={() => handleTileClick(tile)}
                                className={`aspect-[4/3] rounded-2xl p-3 flex items-center justify-center text-center transition-all relative overflow-hidden ${
                                    isSelected
                                        ? 'bg-violet-600/40 border-2 border-violet-400 shadow-lg shadow-violet-500/20 scale-[1.02]'
                                        : isWrong
                                            ? 'bg-red-900/30 border-2 border-red-500/50'
                                            : tile.type === 'front'
                                                ? 'glass-panel border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                                                : 'glass-panel border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                                }`}
                            >
                                <span className={`text-sm font-medium leading-tight ${
                                    isSelected ? 'text-white' : isWrong ? 'text-red-300' : 'text-gray-200'
                                }`}>
                                    {tile.text.length > 50 ? tile.text.slice(0, 47) + '...' : tile.text}
                                </span>
                                <span className={`absolute top-1.5 left-2 text-[8px] font-bold uppercase tracking-widest ${
                                    tile.type === 'front' ? 'text-violet-400/60' : 'text-emerald-400/60'
                                }`}>
                                    {tile.type === 'front' ? 'T' : 'D'}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Win Screen */}
            <AnimatePresence>
                {isFinished && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel rounded-3xl p-8 text-center border border-amber-500/20 space-y-4"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <Trophy size={48} className="text-amber-400 mx-auto" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">¡Completado!</h2>
                        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                            <div className="bg-white/5 p-3 rounded-xl">
                                <p className="text-2xl font-bold text-amber-400">{formatTime(timer)}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Tiempo</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <p className="text-2xl font-bold text-white">{moves}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Movimientos</p>
                            </div>
                        </div>
                        {bestTime && (
                            <p className="text-xs text-gray-400">
                                Mejor tiempo: <span className="text-amber-400 font-bold">{formatTime(bestTime)}</span>
                                {timer <= bestTime && timer > 0 && <span className="text-emerald-400 ml-2">🏆 ¡Nuevo récord!</span>}
                            </p>
                        )}
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={handleRestart}
                                className="px-6 py-3 rounded-2xl bg-white/5 text-gray-300 font-bold border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all"
                            >
                                <RotateCcw size={16} /> Otra vez
                            </button>
                            <button
                                onClick={onComplete}
                                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                            >
                                Continuar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
