import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, ArrowLeft, Target, Clock, Zap, AlertCircle } from 'lucide-react';

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

export default function StudyComplete({ results, mode, onRestart, onRestartIncorrect, onBack }) {
    if (!results) return null;

    const { total, correct, incorrect, score, elapsed, bestStreak, incorrectCards } = results;

    const modeLabels = {
        flash: 'Flashcards',
        learn: 'Aprender',
        write: 'Escribir',
        match: 'Match',
        test: 'Test'
    };

    const getGrade = () => {
        if (score >= 95) return { emoji: '🌟', label: '¡Perfecto!', color: 'text-amber-400' };
        if (score >= 80) return { emoji: '🎉', label: '¡Excelente!', color: 'text-emerald-400' };
        if (score >= 60) return { emoji: '👏', label: '¡Bien hecho!', color: 'text-blue-400' };
        if (score >= 40) return { emoji: '💪', label: 'Puedes mejorar', color: 'text-orange-400' };
        return { emoji: '📚', label: 'Sigue practicando', color: 'text-red-400' };
    };

    const grade = getGrade();

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Main Score Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="glass-panel rounded-3xl p-8 md:p-10 text-center border border-white/10 relative overflow-hidden"
            >
                {/* Background glow */}
                <div className={`absolute inset-0 opacity-5 ${
                    score >= 80 ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : score >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-red-500 to-pink-500'
                }`} />

                <div className="relative z-10">
                    {/* Emoji */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="text-6xl mb-4"
                    >
                        {grade.emoji}
                    </motion.div>

                    {/* Score Circle */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <motion.circle
                                cx="60" cy="60" r="52"
                                fill="none"
                                stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 52}
                                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - score / 100) }}
                                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className={`text-3xl font-bold ${grade.color}`}
                            >
                                {score}%
                            </motion.span>
                        </div>
                    </div>

                    <h2 className={`text-2xl font-bold ${grade.color} mb-1`}>{grade.label}</h2>
                    <p className="text-gray-400 text-sm">
                        Modo: {modeLabels[mode] || mode}
                    </p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: Target, label: 'Correctas', value: correct, color: 'text-emerald-400' },
                    { icon: AlertCircle, label: 'Incorrectas', value: incorrect, color: 'text-red-400' },
                    { icon: Clock, label: 'Tiempo', value: formatTime(elapsed), color: 'text-blue-400' },
                    { icon: Zap, label: 'Racha Máx', value: bestStreak, color: 'text-amber-400' }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        className="glass-panel p-4 rounded-2xl text-center border border-white/5"
                    >
                        <stat.icon size={18} className={`${stat.color} mx-auto mb-2`} />
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="space-y-3"
            >
                {incorrectCards && incorrectCards.length > 0 && (
                    <button
                        onClick={onRestartIncorrect}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <RotateCcw size={18} /> Repasar {incorrectCards.length} incorrectas
                    </button>
                )}
                <button
                    onClick={onRestart}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                    <RotateCcw size={18} /> Estudiar de nuevo
                </button>
                <button
                    onClick={onBack}
                    className="w-full py-3 rounded-2xl text-gray-400 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft size={18} /> Volver al set
                </button>
            </motion.div>
        </div>
    );
}
