import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Layers, Play, Brain, FileText, Puzzle, PenTool,
    Plus, Edit2, Trash2, Upload, BarChart3, Zap
} from 'lucide-react';

const STUDY_MODES = [
    { id: 'flash', icon: Layers, label: 'Flashcards', desc: 'Voltea y repasa', color: 'from-violet-600 to-purple-600', minCards: 1 },
    { id: 'learn', icon: Brain, label: 'Aprender', desc: 'Opción múltiple inteligente', color: 'from-blue-600 to-cyan-600', minCards: 4 },
    { id: 'write', icon: PenTool, label: 'Escribir', desc: 'Escribe la respuesta', color: 'from-emerald-600 to-teal-600', minCards: 1 },
    { id: 'match', icon: Puzzle, label: 'Match', desc: 'Empareja los términos', color: 'from-orange-600 to-amber-600', minCards: 4 },
    { id: 'test', icon: FileText, label: 'Test', desc: 'Examen completo', color: 'from-rose-600 to-pink-600', minCards: 4 },
];

export default function SetDetail({
    set, setId, getCards, onStartStudy, onEditCards, onImport, onUpdateSet, onDeleteSet, showToast
}) {
    const [cards, setCards] = useState([]);
    const [loadingCards, setLoadingCards] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');

    useEffect(() => {
        if (!setId) return;
        setLoadingCards(true);
        const unsub = getCards(setId, (loaded) => {
            setCards(loaded);
            setLoadingCards(false);
        });
        return () => unsub();
    }, [setId, getCards]);

    const handleSaveTitle = () => {
        if (titleDraft.trim() && titleDraft.trim() !== set?.title) {
            onUpdateSet({ title: titleDraft.trim() });
        }
        setEditingTitle(false);
    };

    if (!set) return null;

    const mastered = set.studyStats?.mastered || 0;
    const learning = set.studyStats?.learning || 0;
    const notStarted = set.studyStats?.notStarted || 0;
    const total = set.cardCount || 0;
    const progressPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Set Header */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden" style={{ borderTop: `3px solid ${set.color || '#8b5cf6'}` }}>
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-4xl mb-3">{set.icon || '📚'}</div>
                            {editingTitle ? (
                                <input
                                    autoFocus
                                    value={titleDraft}
                                    onChange={e => setTitleDraft(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                                    className="text-2xl md:text-3xl font-bold bg-transparent text-white outline-none border-b-2 border-violet-500 w-full"
                                />
                            ) : (
                                <h1
                                    className="text-2xl md:text-3xl font-bold text-white cursor-pointer hover:text-violet-200 transition-colors truncate"
                                    onClick={() => { setTitleDraft(set.title); setEditingTitle(true); }}
                                    title="Click para editar"
                                >
                                    {set.title}
                                </h1>
                            )}
                            {set.description && <p className="text-gray-400 text-sm mt-2">{set.description}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={onDeleteSet}
                                className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 transition-all"
                                title="Eliminar set"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <p className="text-2xl font-bold text-emerald-400">{mastered}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dominadas</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <p className="text-2xl font-bold text-amber-400">{learning}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Aprendiendo</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <p className="text-2xl font-bold text-gray-400">{notStarted}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nuevas</p>
                        </div>
                    </div>

                    {/* Progress */}
                    {total > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400 font-bold">Progreso</span>
                                <span className="font-bold" style={{ color: set.color || '#8b5cf6' }}>{progressPercent}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: set.color || '#8b5cf6' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Background glow */}
                <div
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10 blur-3xl"
                    style={{ backgroundColor: set.color || '#8b5cf6' }}
                />
            </div>

            {/* Study Modes Grid */}
            <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap size={14} /> Modos de Estudio
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {STUDY_MODES.map((mode, idx) => {
                        const Icon = mode.icon;
                        const disabled = cards.length < mode.minCards;
                        return (
                            <motion.button
                                key={mode.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={disabled ? {} : { scale: 1.05, y: -3 }}
                                whileTap={disabled ? {} : { scale: 0.95 }}
                                onClick={() => !disabled && onStartStudy(mode.id, cards)}
                                disabled={disabled}
                                className={`p-4 rounded-2xl text-center transition-all border border-white/10 relative overflow-hidden group ${
                                    disabled
                                        ? 'opacity-30 cursor-not-allowed bg-white/5'
                                        : `bg-gradient-to-br ${mode.color} cursor-pointer shadow-lg hover:shadow-xl`
                                }`}
                            >
                                <Icon size={24} className="mx-auto mb-2 text-white" />
                                <p className="text-sm font-bold text-white">{mode.label}</p>
                                <p className="text-[10px] text-white/60 mt-0.5">{mode.desc}</p>
                                {disabled && (
                                    <p className="text-[9px] text-gray-400 mt-1">Mín. {mode.minCards} tarjetas</p>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onEditCards}
                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                    <Edit2 size={18} /> Editar Tarjetas
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onImport}
                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                    <Upload size={18} /> Importar
                </motion.button>
            </div>

            {/* Cards Preview */}
            <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers size={14} /> Tarjetas ({cards.length})
                </h2>

                {loadingCards ? (
                    <div className="flex justify-center py-8">
                        <div className="spinner border-violet-500" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
                        <div className="text-4xl mb-3">✨</div>
                        <p className="text-gray-400 text-sm mb-4">Este set está vacío</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={onEditCards}
                                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg"
                            >
                                <Plus size={16} className="inline mr-1" /> Crear Tarjetas
                            </button>
                            <button
                                onClick={onImport}
                                className="bg-white/5 text-gray-300 px-6 py-2.5 rounded-xl font-bold text-sm border border-white/10"
                            >
                                <Upload size={16} className="inline mr-1" /> Importar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                        {cards.map((card, idx) => (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-xs text-gray-600 font-mono w-6 text-right shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                                    <p className="text-sm text-white truncate font-medium">{card.front}</p>
                                    <p className="text-sm text-gray-400 truncate">{card.back}</p>
                                </div>
                                <div className="shrink-0">
                                    {card.difficulty >= 3 && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                                    {card.difficulty === 1 && <span className="text-[10px] text-amber-400 font-bold">~</span>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
