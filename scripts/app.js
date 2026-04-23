// scripts/app.js

// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, runTransaction, query, updateDoc, serverTimestamp, increment, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- APPLICATION STATE ---
const state = {
    db: null,
    auth: null,
    userId: null,
    userRole: null, 
    isLoggedIn: false,
    activeTab: 'match',
    players: [],
    seasons: [],
    activeSeasonId: null,
    selectedStatsSeasonId: 'all-time',
    playerCard: { isOpen: false, playerId: null, selectedSeasonId: 'all-time' },
    fixture: { id: null, games: [] },
    previousFixtures: [],
    selectedPreviousFixtureId: null,
    currentGameIndex: 0,
    confirmation: { action: null, data: null },
    loginAttemptRole: null,
};

// --- CONSTANTS ---
const ADMIN_PASSWORD = 'burnaby';
const MEMBER_PASSWORD = 'darts';
const GAME_TITLES = ["Singles 1", "Singles 2", "Singles 3", "Singles 4", "Singles 5", "Doubles 1", "Doubles 2"];
const PLAYERS_COLLECTION = 'players';
const FIXTURES_COLLECTION = 'fixtures';
const SEASONS_COLLECTION = 'seasons';

// --- UI Feedback ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.className = `fixed top-5 right-5 text-white py-3 px-5 rounded-xl shadow-lg transform transition-transform duration-500 ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
    toast.classList.remove('translate-x-[150%]');
    setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
    }, 3000);
}

// --- LOGIC FUNCTIONS ---
// (These functions handle the actual app behavior like scoring and match finishing)

export async function finishMatch(dotdPlayerId) {
    const fixtureRef = doc(state.db, FIXTURES_COLLECTION, state.fixture.id);
    const seasonId = state.fixture.seasonId;

    try {
        await runTransaction(state.db, async (transaction) => {
            const playerRefs = {};
            const allPlayerIds = new Set();
            state.fixture.games.forEach(game => {
                game.playerIds.forEach(id => allPlayerIds.add(id));
            });
            if (dotdPlayerId) allPlayerIds.add(dotdPlayerId);

            allPlayerIds.forEach(id => {
                if (!playerRefs[id]) playerRefs[id] = doc(state.db, PLAYERS_COLLECTION, id);
            });

            const playerDocs = {};
            for (const id in playerRefs) {
                playerDocs[id] = await transaction.get(playerRefs[id]);
            }

            transaction.update(fixtureRef, { games: state.fixture.games, status: 'finished' });

            const playerAggregates = {};
            state.fixture.games.forEach(game => {
                const isDoubles = game.playerIds.length > 1;
                game.playerIds.forEach((playerId, i) => {
                    if (!playerAggregates[playerId]) {
                        playerAggregates[playerId] = { legsWon: 0, legsLost: 0, fines: 0, scores100: 0, scores140: 0, scores180: 0, highCheckout: 0 };
                    }
                    const pScores = game.playerScores?.[i] || {};
                    playerAggregates[playerId].legsWon += game.legsWon || 0;
                    playerAggregates[playerId].legsLost += game.legsLost || 0;
                    playerAggregates[playerId].scores100 += pScores.scores100 || 0;
                    playerAggregates[playerId].scores140 += pScores.scores140 || 0;
                    playerAggregates[playerId].scores180 += pScores.scores180 || 0;

                    if (!isDoubles) {
                        playerAggregates[playerId].fines += game.fines || 0;
                        playerAggregates[playerId].highCheckout = Math.max(playerAggregates[playerId].highCheckout, game.highCheckout || 0);
                    }
                });
            });

            if (dotdPlayerId) {
                if (!playerAggregates[dotdPlayerId]) playerAggregates[dotdPlayerId] = { fines: 0 };
                playerAggregates[dotdPlayerId].fines += 250;
            }

            for (const playerId in playerAggregates) {
                const stats = playerAggregates[playerId];
                const playerRef = playerRefs[playerId];
                const playerDoc = playerDocs[playerId];
                if (!playerDoc.exists()) continue;
                const currentStats = playerDoc.data()?.stats?.[seasonId] || {};

                transaction.update(playerRef, {
                    [`stats.${seasonId}.legsWon`]: increment(stats.legsWon),
                    [`stats.${seasonId}.legsLost`]: increment(stats.legsLost),
                    [`stats.${seasonId}.fines`]: increment(stats.fines),
                    [`stats.${seasonId}.scores100`]: increment(stats.scores100),
                    [`stats.${seasonId}.scores140`]: increment(stats.scores140),
                    [`stats.${seasonId}.scores180`]: increment(stats.scores180),
                    [`stats.${seasonId}.highCheckout`]: Math.max(stats.highCheckout, currentStats.highCheckout || 0),
                });
            }
        });
        showToast("Match finished and stats saved!");
    } catch (e) {
        console.error("Transaction failed: ", e);
        showToast("Failed to save match stats.", true);
    }
}

// ... Additional helper functions from BurnabyArms.html would go here
