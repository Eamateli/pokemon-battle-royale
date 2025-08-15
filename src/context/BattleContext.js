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
      // 🔧 FIX: Only update votes if not locked
      if (state.votingLocked) {
        console.log('🚫 REDUCER: Vote update BLOCKED - voting is locked');
        return state; // Don't update if locked
      }
      console.log('📊 REDUCER: Updating votes to:', action.payload);
      return {
        ...state,
        votes: action.payload,
        totalVotes: action.payload.pokemon1 + action.payload.pokemon2
      };
    
    case ACTIONS.SET_USER_VOTED:
      return { ...state, userVoted: action.payload };
    
    case ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
    
    case ACTIONS.LOCK_VOTING:
      console.log('🔒 REDUCER: Setting votingLocked to true');
      return { ...state, votingLocked: true };
    
    case ACTIONS.SET_BANNER_DISMISSED:
      return { ...state, bannerDismissed: action.payload };
    
    case ACTIONS.RESET_BATTLE:
      console.log('🔄 REDUCER: Resetting battle');
      return {
        ...initialState,
        loading: true,
        connectionStatus: state.connectionStatus,
        votingLocked: false,
        bannerDismissed: false
      };
    
    default:
      return state;
  }
}

/**
 * Enhanced Mock WebSocket implementation with proper vote locking
 */
function createMockWebSocket(dispatch) {
  let voteTimeout = null;
  let voteInterval = null;
  let isLocked = false; // Local lock flag
  
  console.log('🔌 Creating new WebSocket instance');
  
  return {
    send: (data) => {
      console.log('🚀 WebSocket send called');
      
      // Clear any existing timers first
      if (voteTimeout) {
        clearTimeout(voteTimeout);
        console.log('🧹 Cleared existing timeout');
      }
      if (voteInterval) {
        clearInterval(voteInterval);
        console.log('🧹 Cleared existing interval');
      }
      
      setTimeout(() => {
        const message = JSON.parse(data);
        if (message.type === 'vote' && !isLocked) {
          console.log('✅ Processing vote, not locked');
          
          // Initial vote with random numbers
          const randomVotes = {
            pokemon1: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon1' ? 1 : 0),
            pokemon2: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon2' ? 1 : 0)
          };
          
          console.log('📊 Initial votes:', randomVotes);
          dispatch({ type: ACTIONS.SET_VOTES, payload: randomVotes });
          
          // Start the interval for ongoing updates
          voteInterval = setInterval(() => {
            if (isLocked) {
              console.log('🚫 Interval fired but locked - stopping');
              clearInterval(voteInterval);
              return;
            }
            
            const newVotes = {
              pokemon1: randomVotes.pokemon1 + Math.floor(Math.random() * 3),
              pokemon2: randomVotes.pokemon2 + Math.floor(Math.random() * 3)
            };
            console.log('📈 Updating votes:', newVotes);
            dispatch({ type: ACTIONS.SET_VOTES, payload: newVotes });
          }, 2000);
          
          // Lock voting after 3 seconds
          voteTimeout = setTimeout(() => {
            console.log('🔒 LOCKING VOTES NOW');
            isLocked = true; // Set local lock FIRST
            clearInterval(voteInterval);
            dispatch({ type: ACTIONS.LOCK_VOTING });
            console.log('✅ Voting locked - no more changes should happen');
          }, 3000);
          
        } else if (isLocked) {
          console.log('🚫 Vote ignored - already locked');
        }
      }, 500);
    },
    
    close: () => {
      console.log('🔌 WebSocket close called');
      if (voteTimeout) clearTimeout(voteTimeout);
      if (voteInterval) clearInterval(voteInterval);
      isLocked = false;
      console.log('WebSocket connection closed');
    },
    
    readyState: 1
  };
}

/**
 * Battle Context Provider Component
 */
export function BattleProvider({ children }) {
  const [state, dispatch] = useReducer(battleReducer, initialState);
  const [ws, setWs] = useState(null);

  console.log('🏗️ BattleProvider rendering, votingLocked:', state.votingLocked);

  useEffect(() => {
    console.log('🚀 BattleProvider useEffect running');
    const mockWs = createMockWebSocket(dispatch);
    setWs(mockWs);
    dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });

    return () => {
      console.log('🧹 BattleProvider cleanup');
      if (mockWs.close) {
        mockWs.close();
      }
    };
  }, []);

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