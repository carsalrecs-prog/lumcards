import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, Trash2, BarChart3, Sparkles } from 'lucide-react';

const SET_COLORS = [
    '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981',
    '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#a855f7'
];

const SET_ICONS = ['📚', '🧠', '🌍', '💻', '🔬', '🎵', '🏛️', '✍️', '🧮', '💡', '❤️', '🎯'];

export default function SetList({ sets, loading, onSelectSet, onCreateSet, onDeleteSet }) {
    const [showCreate, setShowCreate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newColor, setNewColor] = useState(SET_COLORS[0]);
    const [newIcon, setNewIcon] = useState('📚');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const filtered = sets.filter(s =>
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        await onCreateSet({ title: newTitle.trim(), description: newDesc.trim(), color: newColor, icon: newIcon });
        setNewTitle(''); setNewDesc(''); setShowCreate(false);
        setNewColor(SET_COLORS[Math.floor(Math.random() * SET_COLORS.length)]);
    };

    const totalCards = sets.reduce((sum, s) => sum + (s.cardCount || 0), 0);
    const totalMastered = sets.reduce((sum, s) => sum + (s.studyStats?.mastered || 0), 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="spinner border-violet-500 w-10 h-10 mb-4" />
                <p className="text-gray-400 text-sm font-bold">Cargando sets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-violet-400" size={32} />
                        Mis Flashcards
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {sets.length} sets · {totalCards} tarjetas · {totalMastered} dominadas
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreate(true)}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-violet-500/20 flex items-center gap-2 border border-white/10 hover:shadow-violet-500/40 transition-shadow"
                >
                    <Plus size={20} /> Nuevo Set
                </motion.button>
            </div>

            {/* Search */}
            {sets.length > 0 && (
                <div className="flex items-center gap-3">
                    <div className="p-3.5 rounded-2xl glass-panel text-violet-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en mis sets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 p-3.5 px-5 rounded-2xl glass-panel text-white focus:ring-1 focus:ring-violet-500/30 outline-none"
                    />
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-panel p-6 rounded-3xl border border-violet-500/20 space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles size={18} className="text-violet-400" /> Crear Nuevo Set
                            </h3>
                            <input
                                autoFocus
                                placeholder="Título del set (ej: Vocabulario Inglés B2)"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none"
                            />
                            <input
                                placeholder="Descripción (opcional)"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none text-sm"
                            />
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Icono</label>
                                <div className="flex gap-2 flex-wrap">
                                    {SET_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setNewIcon(icon)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${newIcon === icon ? 'bg-white/20 scale-110 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {SET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewColor(color)}
                                            className={`w-8 h-8 rounded-full transition-all ${newColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white bg-white/5 font-bold text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg disabled:opacity-40 transition-all active:scale-95"
                                >
                                    Crear Set
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sets Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map((set, idx) => {
                            const progress = set.cardCount > 0
                                ? Math.round(((set.studyStats?.mastered || 0) / set.cardCount) * 100)
                                : 0;

                            return (
                                <motion.div
                                    key={set.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => onSelectSet(set.id)}
                                    className="glass-panel p-5 rounded-2xl cursor-pointer group relative overflow-hidden hover:bg-white/5 transition-all"
                                    style={{ borderTop: `3px solid ${set.color || '#8b5cf6'}` }}
                                >
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (deleteConfirm === set.id) {
                                                onDeleteSet(set.id);
                                                setDeleteConfirm(null);
                                            } else {
                                                setDeleteConfirm(set.id);
                                                setTimeout(() => setDeleteConfirm(null), 3000);
                                            }
                                        }}
                                        className="absolute top-3 right-3 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg bg-white/5 hover:bg-red-500/10 z-10"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    {deleteConfirm === set.id && (
                                        <span className="absolute top-3 right-12 text-[10px] text-red-400 font-bold animate-pulse z-10">
                                            Click otra vez
                                        </span>
                                    )}

                                    {/* Icon */}
                                    <div className="text-3xl mb-3">{set.icon || '📚'}</div>

                                    {/* Title & Description */}
                                    <h3 className="font-bold text-white text-lg truncate pr-8">{set.title}</h3>
                                    {set.description && (
                                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{set.description}</p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-gray-500 font-bold">
                                            {set.cardCount || 0} tarjetas
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <BarChart3 size={12} className="text-gray-500" />
                                            <span className="text-xs font-bold" style={{ color: set.color || '#8b5cf6' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ delay: idx * 0.05 + 0.3, duration: 0.6 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: set.color || '#8b5cf6' }}
                                        />
                                    </div>

                                    {/* Glow effect */}
                                    <div
                                        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"
                                        style={{ backgroundColor: set.color || '#8b5cf6' }}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : sets.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-bold text-white mb-2">Empieza a estudiar</h3>
                    <p className="text-gray-400 text-sm mb-6">Crea tu primer set de flashcards</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
                    >
                        <Plus size={18} className="inline mr-2" />
                        Crear Set
                    </button>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-black/20 rounded-2xl border border-white/5">
                    No se encontraron sets con "{searchTerm}"
                </div>
            )}
        </div>
    );
}
