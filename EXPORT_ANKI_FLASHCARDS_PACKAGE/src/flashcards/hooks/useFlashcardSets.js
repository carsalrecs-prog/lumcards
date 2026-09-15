import { useState, useEffect, useCallback } from 'react';
import { getBaseRef } from '../../firebase';

/**
 * useFlashcardSets — Full CRUD hook for flashcard sets + cards in Firebase.
 * 
 * Collections:
 *   flashcard_sets/ → set documents
 *   flashcard_sets/{setId}/cards/ → card documents (subcollection)
 */
export default function useFlashcardSets() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Listen to all sets ──────────────────────────────────────
    useEffect(() => {
        const ref = getBaseRef().collection('flashcard_sets').orderBy('updatedAt', 'desc');
        const unsub = ref.onSnapshot((snap) => {
            const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSets(loaded);
            setLoading(false);
        }, (err) => {
            console.error('useFlashcardSets snapshot error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── SET CRUD ────────────────────────────────────────────────

    const createSet = useCallback(async ({ title, description = '', color = '#8b5cf6', icon = '📚' }) => {
        const now = Date.now();
        const docRef = await getBaseRef().collection('flashcard_sets').add({
            title,
            description,
            color,
            icon,
            cardCount: 0,
            createdAt: now,
            updatedAt: now,
            lastStudied: null,
            studyStats: { totalSessions: 0, mastered: 0, learning: 0, notStarted: 0 }
        });
        return docRef.id;
    }, []);

    const updateSet = useCallback(async (setId, data) => {
        await getBaseRef().collection('flashcard_sets').doc(setId).update({
            ...data,
            updatedAt: Date.now()
        });
    }, []);

    const deleteSet = useCallback(async (setId) => {
        // Delete all cards in the subcollection first
        const cardsSnap = await getBaseRef()
            .collection('flashcard_sets').doc(setId)
            .collection('cards').get();
        const batch = getBaseRef().batch ? getBaseRef().batch() : null;
        if (batch && cardsSnap.docs.length > 0) {
            cardsSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } else {
            for (const doc of cardsSnap.docs) {
                await doc.ref.delete();
            }
        }
        // Then delete the set itself
        await getBaseRef().collection('flashcard_sets').doc(setId).delete();
    }, []);

    // ── CARD CRUD ───────────────────────────────────────────────

    const getCardsRef = useCallback((setId) => {
        return getBaseRef().collection('flashcard_sets').doc(setId).collection('cards');
    }, []);

    const addCard = useCallback(async (setId, { front, back, imageUrl = null }) => {
        const setRef = getBaseRef().collection('flashcard_sets').doc(setId);
        const cardsRef = setRef.collection('cards');

        // Get current count for ordering
        const snap = await cardsRef.get();
        const order = snap.size;

        await cardsRef.add({
            front,
            back,
            imageUrl,
            order,
            difficulty: 0,       // 0 = new, 1 = learning, 2 = reviewing, 3 = mastered
            lastReviewed: null,
            nextReview: null,
            correctCount: 0,
            incorrectCount: 0
        });

        // Update card count on the set
        await setRef.update({
            cardCount: order + 1,
            updatedAt: Date.now()
        });
    }, []);

    const updateCard = useCallback(async (setId, cardId, data) => {
        await getBaseRef()
            .collection('flashcard_sets').doc(setId)
            .collection('cards').doc(cardId)
            .update(data);
    }, []);

    const deleteCard = useCallback(async (setId, cardId) => {
        await getBaseRef()
            .collection('flashcard_sets').doc(setId)
            .collection('cards').doc(cardId)
            .delete();

        // Update card count
        const snap = await getBaseRef()
            .collection('flashcard_sets').doc(setId)
            .collection('cards').get();
        await getBaseRef().collection('flashcard_sets').doc(setId).update({
            cardCount: snap.size,
            updatedAt: Date.now()
        });
    }, []);

    const getCards = useCallback((setId, onCards) => {
        const ref = getBaseRef()
            .collection('flashcard_sets').doc(setId)
            .collection('cards').orderBy('order', 'asc');
        return ref.onSnapshot((snap) => {
            const cards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            onCards(cards);
        });
    }, []);

    const importCards = useCallback(async (setId, cards) => {
        const setRef = getBaseRef().collection('flashcard_sets').doc(setId);
        const cardsRef = setRef.collection('cards');

        // Get current count for ordering
        const existingSnap = await cardsRef.get();
        let order = existingSnap.size;

        // Batch write in chunks of 500 (Firestore limit)
        const BATCH_SIZE = 450;
        for (let i = 0; i < cards.length; i += BATCH_SIZE) {
            const chunk = cards.slice(i, i + BATCH_SIZE);
            const batch = getBaseRef().batch();
            chunk.forEach((card) => {
                const docRef = cardsRef.doc();
                batch.set(docRef, {
                    front: card.front || '',
                    back: card.back || '',
                    imageUrl: card.imageUrl || null,
                    order: order++,
                    difficulty: 0,
                    lastReviewed: null,
                    nextReview: null,
                    correctCount: 0,
                    incorrectCount: 0
                });
            });
            await batch.commit();
        }

        // Update set stats
        await setRef.update({
            cardCount: order,
            updatedAt: Date.now(),
            'studyStats.notStarted': order
        });

        return order;
    }, []);

    // ── Update study stats after session ────────────────────────

    const updateStudyStats = useCallback(async (setId, sessionResults) => {
        const setRef = getBaseRef().collection('flashcard_sets').doc(setId);
        const cardsRef = setRef.collection('cards');

        // Update individual card difficulties
        for (const result of sessionResults) {
            await cardsRef.doc(result.cardId).update({
                difficulty: result.newDifficulty,
                lastReviewed: Date.now(),
                nextReview: result.nextReview,
                correctCount: result.correct
                    ? (await cardsRef.doc(result.cardId).get()).data().correctCount + 1
                    : undefined,
                incorrectCount: !result.correct
                    ? (await cardsRef.doc(result.cardId).get()).data().incorrectCount + 1
                    : undefined,
            });
        }

        // Recount stats
        const allCards = await cardsRef.get();
        let mastered = 0, learning = 0, notStarted = 0;
        allCards.docs.forEach(doc => {
            const d = doc.data().difficulty;
            if (d >= 3) mastered++;
            else if (d >= 1) learning++;
            else notStarted++;
        });

        const setData = (await setRef.get()).data();
        await setRef.update({
            lastStudied: Date.now(),
            updatedAt: Date.now(),
            studyStats: {
                totalSessions: (setData.studyStats?.totalSessions || 0) + 1,
                mastered,
                learning,
                notStarted
            }
        });
    }, []);

    return {
        sets,
        loading,
        createSet,
        updateSet,
        deleteSet,
        addCard,
        updateCard,
        deleteCard,
        getCards,
        getCardsRef,
        importCards,
        updateStudyStats
    };
}
