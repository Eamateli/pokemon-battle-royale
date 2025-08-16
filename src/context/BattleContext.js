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
      // Only update votes if not locked
      if (state.votingLocked) {
        console.log('🚫 REDUCER: Vote update BLOCKED - voting is locked');
        return state;
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
 * 🔧 Complete Mock WebSocket implementation 
 * - Simulates other users voting from battle start
 * - 2-second countdown after user votes
 * - Clean shutdown and restart
 */
function createMockWebSocket(dispatch) {
  let autoVoteInterval = null;
  let userVoteTimeout = null;
  let isLocked = false;
  let currentVotes = { pokemon1: 0, pokemon2: 0 };
  
  console.log('🔌 Creating new WebSocket instance');
  
  return {
    // Start auto-voting simulation (called when battle starts)
    startAutoVoting: () => {
      console.log('🚀 Starting auto-vote simulation');
      
      // Clear any existing interval
      if (autoVoteInterval) {
        clearInterval(autoVoteInterval);
      }
      
      isLocked = false;
      
      // 🔧 FIXED: Start from 0 and gradually increase
      currentVotes = {
        pokemon1: 0,
        pokemon2: 0
      };
      
      console.log('📊 Starting battle from 0 votes:', currentVotes);
      dispatch({ type: ACTIONS.SET_VOTES, payload: currentVotes });
      
      // Gradually increase votes every 0.5-1.5 seconds  
      autoVoteInterval = setInterval(() => {
        if (isLocked) {
          console.log('🚫 Auto-vote stopped - voting locked');
          clearInterval(autoVoteInterval);
          autoVoteInterval = null;
          return;
        }
        
        // Gradually add votes from simulated users
        currentVotes = {
          pokemon1: currentVotes.pokemon1 + Math.floor(Math.random() * 10) + 1, // Add 1-10 votes
          pokemon2: currentVotes.pokemon2 + Math.floor(Math.random() * 10) + 1  // Add 1-10 votes
        };
        
        console.log('📈 Gradually increasing votes (simulating other users):', currentVotes);
        dispatch({ type: ACTIONS.SET_VOTES, payload: currentVotes });
        
      }, Math.random() * 1000 + 500); // 🔧 FIXED: Random interval 0.5-1.5 seconds (was 0.3-1.3)
    },
    
    // Handle user vote (starts 2-second countdown)
    send: (data) => {
      console.log('🚀 User voted - WebSocket send called');
      
      // Clear any existing user vote timeout
      if (userVoteTimeout) {
        clearTimeout(userVoteTimeout);
        userVoteTimeout = null;
      }
      
      setTimeout(() => {
        const message = JSON.parse(data);
        
        if (message.type === 'vote' && !isLocked) {
          console.log('✅ Processing user vote - starting 2 second countdown');
          
          // Add user's vote to current votes
          if (message.pokemon === 'pokemon1') {
            currentVotes.pokemon1 += 1;
          } else {
            currentVotes.pokemon2 += 1;
          }
          
          console.log('📊 Added user vote:', currentVotes);
          dispatch({ type: ACTIONS.SET_VOTES, payload: currentVotes });
          
          // Lock voting after EXACTLY 3 seconds
          userVoteTimeout = setTimeout(() => {
            console.log('🔒 LOCKING VOTES (after 3 seconds from user vote)');
            
            isLocked = true;
            
            // Stop auto-voting
            if (autoVoteInterval) {
              clearInterval(autoVoteInterval);
              autoVoteInterval = null;
            }
            
            dispatch({ type: ACTIONS.LOCK_VOTING });
            
            console.log('✅ Voting locked - battle over');
            userVoteTimeout = null;
            
          }, 5000); // 🔧 FIXED: EXACTLY 5 SECONDS 
          
        } else if (isLocked) {
          console.log('🚫 Vote ignored - already locked');
        }
      }, 500);
    },
    
    close: () => {
      console.log('🔌 WebSocket close called');
      
      // Clean up all timers
      if (autoVoteInterval) {
        clearInterval(autoVoteInterval);
        autoVoteInterval = null;
      }
      
      if (userVoteTimeout) {
        clearTimeout(userVoteTimeout);
        userVoteTimeout = null;
      }
      
      // Reset state
      isLocked = false;
      currentVotes = { pokemon1: 0, pokemon2: 0 };
      
      console.log('🧹 WebSocket cleaned up');
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

  useEffect(() => {
    console.log('🚀 Creating WebSocket connection');
    const mockWs = createMockWebSocket(dispatch);
    setWs(mockWs);
    dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });

    return () => {
      console.log('🧹 Cleaning up WebSocket');
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