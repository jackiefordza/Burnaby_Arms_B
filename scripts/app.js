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
    toastMsg.textContent = message;
    toast.className = `fixed top-5 right-5 text-white py-3 px-5 rounded-xl shadow-lg transform transition-transform duration-500 ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
    toast.classList.remove('translate-x-[150%]');
    setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
    }, 3000);
}

// ... [The rest of your logic functions like handleLogin, addPlayer, updateStat, and finishMatch go here]
