import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, X, ArrowUpDown } from 'lucide-react';

export default function CardEditor({ setId, set, getCards, addCard, updateCard, deleteCard, showToast }) {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    const [editingCard, setEditingCard] = useState(null);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkSeparator, setBulkSeparator] = useState('tab');
    const frontRef = useRef(null);

    useEffect(() => {
        if (!setId) return;
        const unsub = getCards(setId, (loaded) => {
            setCards(loaded);
            setLoading(false);
        });
        return () => unsub();
    }, [setId, getCards]);

    const handleAddCard = async () => {
        if (!newFront.trim() || !newBack.trim()) return;
        await addCard(setId, { front: newFront.trim(), back: newBack.trim() });
        setNewFront('');
        setNewBack('');
        frontRef.current?.focus();
        showToast?.('Tarjeta añadida ✨');
    };

    const handleUpdateCard = async () => {
        if (!editingCard || !editFront.trim() || !editBack.trim()) return;
        await updateCard(setId, editingCard, { front: editFront.trim(), back: editBack.trim() });
        setEditingCard(null);
        showToast?.('Tarjeta actualizada');
    };

    const handleDeleteCard = async (cardId) => {
        await deleteCard(setId, cardId);
        if (editingCard === cardId) setEditingCard(null);
        showToast?.('Tarjeta eliminada');
    };

    const handleBulkImport = async () => {
        const sep = bulkSeparator === 'tab' ? '\t' : bulkSeparator === 'comma' ? ',' : ';';
        const lines = bulkText.split('\n').filter(l => l.trim());
        let count = 0;

        for (const line of lines) {
            const parts = line.split(sep);
            if (parts.length >= 2) {
                await addCard(setId, { front: parts[0].trim(), back: parts.slice(1).join(sep).trim() });
                count++;
            }
        }

        if (count > 0) {
            showToast?.(`${count} tarjetas añadidas ✨`);
            setBulkText('');
            setBulkMode(false);
        } else {
            showToast?.('No se encontraron tarjetas válidas', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        ✏️ Editar: {set?.title}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">{cards.length} tarjetas</p>
                </div>
                <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        bulkMode
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                >
                    <ArrowUpDown size={14} className="inline mr-1" />
                    {bulkMode ? 'Modo Individual' : 'Modo Masivo'}
                </button>
            </div>

            {/* Bulk Import Mode */}
            <AnimatePresence>
                {bulkMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-panel p-6 rounded-2xl border border-violet-500/20 space-y-4">
                            <h3 className="font-bold text-white text-sm">Pegar tarjetas en bloque</h3>
                            <p className="text-[11px] text-gray-400">
                                Una tarjeta por línea. El frente y reverso separados por el delimitador elegido.
                            </p>
                            <div className="flex gap-2">
                                {[
                                    { id: 'tab', label: 'Tab ↹' },
                                    { id: 'comma', label: 'Coma ,' },
                                    { id: 'semicolon', label: 'Punto y coma ;' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setBulkSeparator(opt.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            bulkSeparator === opt.id
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                placeholder={`Ejemplo:\nHello${bulkSeparator === 'tab' ? '\t' : bulkSeparator === 'comma' ? ',' : ';'}Hola\nGoodbye${bulkSeparator === 'tab' ? '\t' : bulkSeparator === 'comma' ? ',' : ';'}Adiós`}
                                className="w-full h-40 p-4 rounded-xl bg-black/30 border border-white/10 text-white text-sm outline-none resize-none font-mono"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBulkMode(false)}
                                    className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white font-bold text-sm bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkImport}
                                    disabled={!bulkText.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg disabled:opacity-40 active:scale-95 transition-all"
                                >
                                    Importar {bulkText.split('\n').filter(l => l.trim()).length} líneas
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Single Card Add */}
            {!bulkMode && (
                <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Frente</label>
                            <input
                                ref={frontRef}
                                value={newFront}
                                onChange={e => setNewFront(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddCard(); }}
                                placeholder="Término o pregunta"
                                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reverso</label>
                            <input
                                value={newBack}
                                onChange={e => setNewBack(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCard(); }}
                                placeholder="Definición o respuesta"
                                className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddCard}
                        disabled={!newFront.trim() || !newBack.trim()}
                        className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Añadir Tarjeta
                    </button>
                </div>
            )}

            {/* Card List */}
            {loading ? (
                <div className="flex justify-center py-8"><div className="spinner border-violet-500" /></div>
            ) : cards.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-black/20 rounded-2xl border border-white/5">
                    Aún no hay tarjetas. ¡Empieza a crear!
                </div>
            ) : (
                <div className="space-y-2">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                            className="glass-panel rounded-xl overflow-hidden"
                        >
                            {editingCard === card.id ? (
                                /* Edit mode */
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            autoFocus
                                            value={editFront}
                                            onChange={e => setEditFront(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-black/30 border border-violet-500/30 text-white outline-none"
                                        />
                                        <input
                                            value={editBack}
                                            onChange={e => setEditBack(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateCard(); }}
                                            className="w-full p-3 rounded-xl bg-black/30 border border-violet-500/30 text-white outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingCard(null)} className="p-2 text-gray-400 hover:text-white rounded-lg">
                                            <X size={16} />
                                        </button>
                                        <button onClick={handleUpdateCard} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold flex items-center gap-1">
                                            <Save size={14} /> Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div className="p-4 flex items-center gap-4 group hover:bg-white/5 transition-colors">
                                    <span className="text-xs text-gray-600 font-mono w-6 text-right shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                                        <p className="text-sm text-white truncate">{card.front}</p>
                                        <p className="text-sm text-gray-400 truncate">{card.back}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => { setEditingCard(card.id); setEditFront(card.front); setEditBack(card.back); }}
                                            className="p-2 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg"
                                        >
                                            <Save size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
