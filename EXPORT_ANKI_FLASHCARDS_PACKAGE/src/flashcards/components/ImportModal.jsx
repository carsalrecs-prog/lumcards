import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertTriangle, Check, X } from 'lucide-react';

/**
 * Parse CSV/TSV/custom-separated text into cards array.
 */
function parseTextFile(text, separator = '\t') {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => {
        const parts = line.split(separator);
        if (parts.length >= 2) {
            return { front: parts[0].trim(), back: parts.slice(1).join(separator).trim() };
        }
        return null;
    }).filter(Boolean);
}

/**
 * Parse APKG (Anki) file in the browser using JSZip + SQL.js
 * Falls back gracefully if libraries aren't available.
 */
async function parseApkg(file) {
    try {
        // Dynamically import sql.js from CDN
        const SQL = await initSqlJs();
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;

        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        // Find the collection database
        const dbFile = zip.file('collection.anki2') || zip.file('collection.anki21');
        if (!dbFile) throw new Error('No se encontró la base de datos en el archivo .apkg');

        const dbBuffer = await dbFile.async('arraybuffer');
        const db = new SQL.Database(new Uint8Array(dbBuffer));

        // Extract notes
        const results = db.exec('SELECT flds FROM notes');
        if (!results.length) return [];

        const cards = results[0].values.map(row => {
            const fields = row[0].split('\x1f');
            if (fields.length >= 2) {
                // Strip HTML tags from Anki fields
                const stripHtml = (html) => html.replace(/<[^>]*>/g, '').trim();
                return { front: stripHtml(fields[0]), back: stripHtml(fields[1]) };
            }
            return null;
        }).filter(Boolean);

        db.close();
        return cards;
    } catch (e) {
        console.error('APKG parse error:', e);
        throw new Error(`Error al leer el archivo Anki: ${e.message}`);
    }
}

/**
 * Load sql.js from CDN
 */
async function initSqlJs() {
    if (window.initSqlJs) return window.initSqlJs();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        script.onload = async () => {
            try {
                const SQL = await window.initSqlJs({
                    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                });
                resolve(SQL);
            } catch (e) { reject(e); }
        };
        script.onerror = () => reject(new Error('No se pudo cargar SQL.js'));
        document.head.appendChild(script);
    });
}

export default function ImportModal({ setId, set, importCards, showToast, onClose }) {
    const [preview, setPreview] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState(null);
    const [separator, setSeparator] = useState('tab');
    const [pasteMode, setPasteMode] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const fileInputRef = useRef(null);

    const separatorChar = separator === 'tab' ? '\t' : separator === 'comma' ? ',' : ';';

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsLoading(true);
        setError(null);
        setPreview([]);

        try {
            if (file.name.endsWith('.apkg')) {
                const cards = await parseApkg(file);
                setPreview(cards);
            } else {
                // CSV / TSV / TXT
                const text = await file.text();
                const cards = parseTextFile(text, separatorChar);
                setPreview(cards);
            }
        } catch (err) {
            setError(err.message);
        }

        setIsLoading(false);
    };

    const handlePasteImport = () => {
        if (!pasteText.trim()) return;
        const cards = parseTextFile(pasteText, separatorChar);
        setPreview(cards);
        setFileName('Texto pegado');
    };

    const handleImport = async () => {
        if (preview.length === 0) return;
        setIsImporting(true);
        try {
            const count = await importCards(setId, preview);
            showToast?.(`${preview.length} tarjetas importadas ✨`);
            onClose();
        } catch (err) {
            showToast?.('Error al importar', 'error');
        }
        setIsImporting(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Upload className="text-violet-400" size={24} /> Importar a: {set?.title}
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setPasteMode(false); setPreview([]); setError(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        !pasteMode ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                    📁 Subir Archivo
                </button>
                <button
                    onClick={() => { setPasteMode(true); setPreview([]); setError(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        pasteMode ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                    📋 Pegar Texto
                </button>
            </div>

            {/* Separator selector */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Separador</label>
                <div className="flex gap-2">
                    {[
                        { id: 'tab', label: 'Tab ↹' },
                        { id: 'comma', label: 'Coma ,' },
                        { id: 'semicolon', label: 'Punto y coma ;' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setSeparator(opt.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                separator === opt.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* File Upload Zone */}
            {!pasteMode ? (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.tsv,.txt,.apkg"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/30 text-gray-400 hover:text-white transition-all flex flex-col items-center gap-3 cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="spinner border-violet-500" />
                        ) : (
                            <>
                                <Upload size={32} className="text-violet-400" />
                                <span className="font-bold">Arrastra o selecciona un archivo</span>
                                <span className="text-xs text-gray-500">.csv, .tsv, .txt, .apkg (Anki)</span>
                            </>
                        )}
                    </button>
                    {fileName && !isLoading && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <FileText size={12} /> {fileName}
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    <textarea
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={`Pega tus tarjetas aquí. Una por línea:\nTérmino${separatorChar === '\t' ? '⇥' : separatorChar}Definición`}
                        className="w-full h-40 p-4 rounded-2xl bg-black/30 border border-white/10 text-white text-sm outline-none resize-none font-mono"
                    />
                    <button
                        onClick={handlePasteImport}
                        disabled={!pasteText.trim()}
                        className="mt-2 px-6 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm disabled:opacity-30"
                    >
                        Previsualizar
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Check size={16} className="text-emerald-400" />
                            {preview.length} tarjetas encontradas
                        </h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5">
                        {preview.slice(0, 20).map((card, idx) => (
                            <div key={idx} className="p-3 flex gap-4 text-sm">
                                <span className="text-xs text-gray-600 font-mono w-5 shrink-0">{idx + 1}</span>
                                <span className="flex-1 text-white truncate">{card.front}</span>
                                <span className="flex-1 text-gray-400 truncate">{card.back}</span>
                            </div>
                        ))}
                        {preview.length > 20 && (
                            <div className="p-3 text-center text-xs text-gray-500">
                                ...y {preview.length - 20} más
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setPreview([]); setFileName(''); setPasteText(''); }}
                            className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white bg-white/5 font-bold text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isImporting ? <div className="spinner border-white w-4 h-4" /> : <Upload size={16} />}
                            Importar {preview.length} Tarjetas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
