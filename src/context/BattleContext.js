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

    case ACTIONS.UNLOCK_VOTING:
      console.log('🔓 REDUCER: Setting votingLocked to false');
      return { ...state, votingLocked: false };
    
    case ACTIONS.SET_BANNER_DISMISSED:
      return { ...state, bannerDismissed: action.payload };
    
    case ACTIONS.RESET_BATTLE:
      console.log('🔄 REDUCER: Resetting battle');
      return {
        ...initialState,
        loading: true,
        connectionStatus: state.connectionStatus,
        votingLocked: false,
        bannerDismissed: false,
        totalVotes: 0
      };
    
    default:
      return state;
  }
}

/**
 * 🔧 FIXED: Enhanced Mock WebSocket implementation with proper vote locking
 * 
 * Key Changes:
 * 1. Proper cleanup of intervals and timeouts
 * 2. Synchronized locking mechanism
 * 3. Immediate interval cleanup when locked
 * 4. Better state management
 */
function createMockWebSocket(dispatch) {
  let voteTimeout = null;
  let voteInterval = null;
  let isLocked = false; // Local lock flag
  let currentVotes = null; // Track current vote state
  
  console.log('🔌 Creating new WebSocket instance');
  
  return {
    send: (data) => {
      console.log('🚀 WebSocket send called');
      
      // Clear any existing timers first to prevent conflicts
      if (voteTimeout) {
        clearTimeout(voteTimeout);
        console.log('🧹 Cleared existing timeout');
      }
      if (voteInterval) {
        clearInterval(voteInterval);
        console.log('🧹 Cleared existing interval');
      }
      
      // Reset lock for new vote
      isLocked = false;
      
      setTimeout(() => {
        const message = JSON.parse(data);
        
        // Only process votes if not already locked
        if (message.type === 'vote' && !isLocked) {
          console.log('✅ Processing vote, not locked');
          
          // Generate initial vote with random numbers
          currentVotes = {
            pokemon1: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon1' ? 1 : 0),
            pokemon2: Math.floor(Math.random() * 50) + (message.pokemon === 'pokemon2' ? 1 : 0)
          };
          
          console.log('📊 Initial votes:', currentVotes);
          dispatch({ type: ACTIONS.SET_VOTES, payload: currentVotes });
          
          // 🔧 FIX: Start the interval for ongoing updates
          voteInterval = setInterval(() => {
            // Double check lock status to be extra safe
            if (isLocked) {
              console.log('🚫 Interval fired but locked - stopping immediately');
              clearInterval(voteInterval);
              voteInterval = null;
              return;
            }
            
            // Update votes with small increments
            currentVotes = {
              pokemon1: currentVotes.pokemon1 + Math.floor(Math.random() * 3),
              pokemon2: currentVotes.pokemon2 + Math.floor(Math.random() * 3)
            };
            
            console.log('📈 Updating votes:', currentVotes);
            dispatch({ type: ACTIONS.SET_VOTES, payload: currentVotes });
          }, 2000);
          
          // 🔧 FIX: Lock voting after 3 seconds with proper cleanup
          voteTimeout = setTimeout(() => {
            console.log('🔒 LOCKING VOTES NOW');
            
            // Set local lock FIRST to prevent any race conditions
            isLocked = true;
            
            // Clear the interval immediately
            if (voteInterval) {
              clearInterval(voteInterval);
              voteInterval = null;
              console.log('🧹 Vote interval cleared during lock');
            }
            
            // Dispatch the lock action to global state
            dispatch({ type: ACTIONS.LOCK_VOTING });
            
            console.log('✅ Voting locked - no more changes should happen');
          }, 3000);
          
        } else if (isLocked) {
          console.log('🚫 Vote ignored - already locked');
        }
      }, 500);
    },
    
    close: () => {
      console.log('🔌 WebSocket close called - cleaning up all timers');
      
      // Clean up all timers and reset state
      if (voteTimeout) {
        clearTimeout(voteTimeout);
        voteTimeout = null;
      }
      if (voteInterval) {
        clearInterval(voteInterval);
        voteInterval = null;
      }
      
      // Reset lock state
      isLocked = false;
      currentVotes = null;
      
      console.log('🧹 WebSocket connection closed and cleaned up');
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
      if (mockWs && mockWs.close) {
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