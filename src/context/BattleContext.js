import React, { createContext, useReducer, useState, useEffect } from 'react';
import { ACTIONS, initialState } from '../utils/constants';

// Create the Battle Context
export const BattleContext = createContext();

// Reducer for state management
function battleReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_POKEMON:
      return {
        ...state,
        pokemon1: action.payload.pokemon1,
        pokemon2: action.payload.pokemon2,
        loading: false,
        error: null
      };
    
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.SET_VOTES:
      return {
        ...state,
        votes: action.payload,
        totalVotes: action.payload.pokemon1 + action.payload.pokemon2
      };
    
    case ACTIONS.SET_USER_VOTED:
      return { ...state, userVoted: action.payload };
    
    case ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
    
    // NEW: Added for enhanced voting features
    case ACTIONS.LOCK_VOTING:
      return { ...state, votingLocked: true };
    
    case ACTIONS.SET_BANNER_DISMISSED:
      return { ...state, bannerDismissed: action.payload };
    
    case ACTIONS.SET_BATTLE_ID:
      return { ...state, battleId: action.payload };
    
    case ACTIONS.RESET_BATTLE:
      return {
        ...initialState,
        loading: true,
        connectionStatus: state.connectionStatus,
        // NEW: Reset voting state
        votingLocked: false,
        bannerDismissed: false,
        battleId: null
      };
    
    default:
      return state;
  }
}

/**
 * Enhanced Mock WebSocket implementation with vote locking
 * In production, this would be a real WebSocket connection
 */
function createMockWebSocket(dispatch) {
  let voteTimeout = null;
  
  return {
    send: (data) => {
      // Simulate network delay
      setTimeout(() => {
        const message = JSON.parse(data);
        if (message.type === 'vote') {
          // Simulate receiving the vote back from server with some random votes from other users
          const randomVotes = {
            pokemon1: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon1' ? 1 : 0),
            pokemon2: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon2' ? 1 : 0)
          };
          
          dispatch({ type: ACTIONS.SET_VOTES, payload: randomVotes });
          
          // Simulate ongoing votes from other users
          const interval = setInterval(() => {
            const newVotes = {
              pokemon1: randomVotes.pokemon1 + Math.floor(Math.random() * 3),
              pokemon2: randomVotes.pokemon2 + Math.floor(Math.random() * 3)
            };
            dispatch({ type: ACTIONS.SET_VOTES, payload: newVotes });
          }, 3000);

          // NEW: Lock voting after 10 seconds and stop updates
          voteTimeout = setTimeout(() => {
            clearInterval(interval);
            dispatch({ type: ACTIONS.LOCK_VOTING });
            console.log('Voting locked after 10 seconds');
          }, 10000);
        }
      }, 500);
    },
    close: () => {
      // NEW: Clear timeout on close
      if (voteTimeout) {
        clearTimeout(voteTimeout);
      }
      console.log('WebSocket connection closed');
    },
    readyState: 1 // WebSocket.OPEN
  };
}

/**
 * Battle Context Provider Component
 * Manages global state and WebSocket connection
 */
export function BattleProvider({ children }) {
  const [state, dispatch] = useReducer(battleReducer, initialState);
  const [ws, setWs] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const mockWs = createMockWebSocket(dispatch);
    setWs(mockWs);
    dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });

    // Cleanup function
    return () => {
      if (mockWs.close) {
        mockWs.close();
      }
    };
  }, []);

  // Context value that will be provided to children
  const value = {
    state,
    dispatch,
    ws
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
}