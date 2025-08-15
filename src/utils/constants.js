// Action types for useReducer
export const ACTIONS = {
  SET_POKEMON: 'SET_POKEMON',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_VOTES: 'SET_VOTES',
  SET_USER_VOTED: 'SET_USER_VOTED',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  RESET_BATTLE: 'RESET_BATTLE',
  // NEW: Added for enhanced voting features
  LOCK_VOTING: 'LOCK_VOTING',
  UNLOCK_VOTING: 'UNLOCK_VOTING',
  SET_BANNER_DISMISSED: 'SET_BANNER_DISMISSED',
  SET_BATTLE_ID: 'SET_BATTLE_ID'
};

// Initial state for the battle reducer
export const initialState = {
  pokemon1: null,
  pokemon2: null,
  loading: true,
  error: null,
  votes: { pokemon1: 0, pokemon2: 0 },
  userVoted: null,
  connectionStatus: 'disconnected',
  totalVotes: 0,
  // NEW: Added for enhanced voting features
  votingLocked: false,
  bannerDismissed: false,
  battleId: null
};

// API endpoints and configuration
export const API_CONFIG = {
  POKEMON_BASE_URL: 'https://pokeapi.co/api/v2/pokemon/',
  MAX_POKEMON_ID: 150, // Original 150 Pokémon
  REQUEST_TIMEOUT: 10000 // 10 seconds
};