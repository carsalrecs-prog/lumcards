import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import useFlashcardSets from './hooks/useFlashcardSets';
import useStudySession from './hooks/useStudySession';
import SetList from './components/SetList';
import SetDetail from './components/SetDetail';
import CardEditor from './components/CardEditor';
import ImportModal from './components/ImportModal';
import StudyComplete from './components/StudyComplete';
import FlashcardMode from './modes/FlashcardMode';
import LearnMode from './modes/LearnMode';
import TestMode from './modes/TestMode';
import MatchMode from './modes/MatchMode';
import WriteMode from './modes/WriteMode';

/**
 * FlashcardsApp — Main controller for the flashcards module.
 * 
 * Internal views:
 *   'list'           → SetList
 *   'detail'         → SetDetail (viewing a single set)
 *   'edit-cards'     → CardEditor
 *   'import'         → ImportModal
 *   'study-flash'    → FlashcardMode
 *   'study-learn'    → LearnMode
 *   'study-test'     → TestMode
 *   'study-match'    → MatchMode
 *   'study-write'    → WriteMode
 *   'complete'       → StudyComplete
 */
export default function FlashcardsApp({ showToast }) {
    const [view, setView] = useState('list');
    const [activeSetId, setActiveSetId] = useState(null);
    const [activeCards, setActiveCards] = useState([]);
    const [studyMode, setStudyMode] = useState(null);

    const flashcardSets = useFlashcardSets();
    const studySession = useStudySession();

    // ── Navigation helpers ──────────────────────────────────────

    const navigateToList = () => {
        setView('list');
        setActiveSetId(null);
        setActiveCards([]);
        setStudyMode(null);
    };

    const navigateToDetail = (setId) => {
        setActiveSetId(setId);
        setView('detail');
    };

    const navigateToEditCards = (setId) => {
        setActiveSetId(setId);
        setView('edit-cards');
    };

    const navigateToImport = (setId) => {
        setActiveSetId(setId);
        setView('import');
    };

    const startStudy = (mode, cards) => {
        if (!cards || cards.length === 0) {
            showToast?.('Añade tarjetas primero', 'error');
            return;
        }
        setActiveCards(cards);
        setStudyMode(mode);
        studySession.startSession(cards);
        setView(`study-${mode}`);
    };

    const handleStudyComplete = async () => {
        // Persist study results to Firebase
        if (activeSetId && studySession.getResults().results.length > 0) {
            try {
                await flashcardSets.updateStudyStats(activeSetId, studySession.getResults().results);
            } catch (e) {
                console.error('Error saving study stats:', e);
            }
        }
        setView('complete');
    };

    const activeSet = flashcardSets.sets.find(s => s.id === activeSetId);

    // ── Back button logic ───────────────────────────────────────

    const handleBack = () => {
        if (view === 'complete') navigateToDetail(activeSetId);
        else if (view.startsWith('study-')) navigateToDetail(activeSetId);
        else if (view === 'edit-cards' || view === 'import') navigateToDetail(activeSetId);
        else if (view === 'detail') navigateToList();
        else navigateToList();
    };

    const showBackButton = view !== 'list';

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            {showBackButton && (
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white font-bold mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">
                        {view === 'complete' || view.startsWith('study-') ? 'Volver al set' :
                         view === 'edit-cards' || view === 'import' ? 'Volver al set' :
                         'Mis Sets'}
                    </span>
                </motion.button>
            )}

            {/* View Router */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                    transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {view === 'list' && (
                        <SetList
                            sets={flashcardSets.sets}
                            loading={flashcardSets.loading}
                            onSelectSet={navigateToDetail}
                            onCreateSet={async (data) => {
                                const id = await flashcardSets.createSet(data);
                                showToast?.('Set creado ✨');
                                navigateToDetail(id);
                            }}
                            onDeleteSet={async (id) => {
                                await flashcardSets.deleteSet(id);
                                showToast?.('Set eliminado');
                            }}
                        />
                    )}

                    {view === 'detail' && activeSetId && (
                        <SetDetail
                            set={activeSet}
                            setId={activeSetId}
                            getCards={flashcardSets.getCards}
                            onStartStudy={startStudy}
                            onEditCards={() => navigateToEditCards(activeSetId)}
                            onImport={() => navigateToImport(activeSetId)}
                            onUpdateSet={(data) => {
                                flashcardSets.updateSet(activeSetId, data);
                                showToast?.('Set actualizado');
                            }}
                            onDeleteSet={async () => {
                                await flashcardSets.deleteSet(activeSetId);
                                showToast?.('Set eliminado');
                                navigateToList();
                            }}
                            showToast={showToast}
                        />
                    )}

                    {view === 'edit-cards' && activeSetId && (
                        <CardEditor
                            setId={activeSetId}
                            set={activeSet}
                            getCards={flashcardSets.getCards}
                            addCard={flashcardSets.addCard}
                            updateCard={flashcardSets.updateCard}
                            deleteCard={flashcardSets.deleteCard}
                            showToast={showToast}
                        />
                    )}

                    {view === 'import' && activeSetId && (
                        <ImportModal
                            setId={activeSetId}
                            set={activeSet}
                            importCards={flashcardSets.importCards}
                            showToast={showToast}
                            onClose={() => navigateToDetail(activeSetId)}
                        />
                    )}

                    {view === 'study-flash' && (
                        <FlashcardMode
                            session={studySession}
                            onComplete={handleStudyComplete}
                        />
                    )}

                    {view === 'study-learn' && (
                        <LearnMode
                            session={studySession}
                            onComplete={handleStudyComplete}
                        />
                    )}

                    {view === 'study-test' && (
                        <TestMode
                            cards={activeCards}
                            onComplete={handleStudyComplete}
                            session={studySession}
                        />
                    )}

                    {view === 'study-match' && (
                        <MatchMode
                            cards={activeCards}
                            onComplete={handleStudyComplete}
                            showToast={showToast}
                        />
                    )}

                    {view === 'study-write' && (
                        <WriteMode
                            session={studySession}
                            onComplete={handleStudyComplete}
                        />
                    )}

                    {view === 'complete' && (
                        <StudyComplete
                            results={studySession.getResults()}
                            mode={studyMode}
                            onRestart={() => {
                                studySession.restart();
                                setView(`study-${studyMode}`);
                            }}
                            onRestartIncorrect={() => {
                                studySession.restartWithIncorrect();
                                setView(`study-${studyMode}`);
                            }}
                            onBack={() => navigateToDetail(activeSetId)}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
