import React, { useEffect, useState } from 'react';
import { Users, RotateCcw, X } from 'lucide-react';
import { useBattle } from '../hooks/useBattle';
import { pokemonAPI } from '../services/pokemonAPI';
import { ACTIONS } from '../utils/constants';
import PokemonCard from './PokemonCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ConnectionStatus from './ConnectionStatus';

/**
 * Main Battle Arena Component
 * Orchestrates the entire battle interface and logic
 */
function BattleArena() {
  const { state, dispatch, ws } = useBattle();
  const { pokemon1, pokemon2, loading, error, votes, userVoted, connectionStatus, totalVotes } = state;
  
  // State for winner banner
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const [bannerExiting, setBannerExiting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // 🔧 NEW: State for countdown banner
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5); // 🔧 FIXED: 5 seconds instead of 3

  // Load initial Pokémon when component mounts
  useEffect(() => {
    loadPokemon();
  }, []);

  // 🔧 NEW: Start auto-voting when Pokemon are loaded and WebSocket is ready
  useEffect(() => {
    if (pokemon1 && pokemon2 && ws && ws.startAutoVoting && !userVoted) {
      console.log('🚀 Starting auto-vote simulation for new battle');
      ws.startAutoVoting();
    }
  }, [pokemon1, pokemon2, ws, userVoted]);

  // Show winner banner when there's a clear winner (only if not dismissed)
  useEffect(() => {
    // 🔧 REMOVED: Don't automatically show winner banner based on votingLocked
    // Winner banner will be triggered manually after countdown finishes
  }, []);

  /**
   * Load Pokémon data from the API
   * @param {string|number} p1 - First Pokémon identifier
   * @param {string|number} p2 - Second Pokémon identifier
   */
  const loadPokemon = async (p1 = 'bulbasaur', p2 = 'pikachu') => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    
    try {
      const pokemonData = await pokemonAPI.fetchBothPokemon(p1, p2);
      dispatch({ type: ACTIONS.SET_POKEMON, payload: pokemonData });
      
      // 🔧 FIXED: Reset votes to 0 so auto-voting can start from 0 and gradually increase
      dispatch({ type: ACTIONS.UNLOCK_VOTING });
      dispatch({ type: ACTIONS.SET_VOTES, payload: { pokemon1: 0, pokemon2: 0 } });
      dispatch({ type: ACTIONS.SET_USER_VOTED, payload: null });
      
      // Close existing WebSocket for clean restart
      if (ws && ws.close) {
        ws.close();
      }
      
      // Hide winner banner for new battle
      setShowWinnerBanner(false);
      setBannerExiting(false);
      setBannerDismissed(false);
      
      // 🔧 NEW: Reset countdown banner
      setShowCountdown(false);
      setCountdown(5); // 🔧 FIXED: Reset to 5 seconds
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  };

  /**
   * Generate a simple user ID for vote tracking
   * In production, this would come from authentication
   * @returns {string} Simple user identifier
   */
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Handle user vote submission
   * @param {string} pokemonChoice - Which Pokémon was voted for ('pokemon1' or 'pokemon2')
   */
  const handleVote = (pokemonChoice) => {
    if (userVoted || !ws) return;

    // Mark user as voted immediately for instant feedback
    dispatch({ type: ACTIONS.SET_USER_VOTED, payload: pokemonChoice });

    // 🔧 FIXED: Start 5-second countdown banner after 0.6 seconds
    setTimeout(() => {
      setShowCountdown(true);
      setCountdown(5); // Start with 5 seconds
      
      // Countdown from 5 to 1
      let currentCount = 5;
      const countdownInterval = setInterval(() => {
        currentCount--;
        setCountdown(currentCount);
        
        if (currentCount <= 0) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          
          // 🔧 FIXED: When countdown finishes, stop votes first
          if (ws && ws.lockVoting) {
            ws.lockVoting();
          }
          
          // 🔧 FIXED: Wait 0.3 seconds AFTER countdown finishes, then show winner
          setTimeout(() => {
            console.log('🏆 Attempting to show winner banner');
            console.log('userVoted:', userVoted, 'totalVotes:', totalVotes, 'bannerDismissed:', bannerDismissed);
            
            // Force show winner banner regardless of conditions for debugging
            setShowWinnerBanner(true);
            
          }, 300); // 0.3 seconds after countdown finishes
        }
      }, 1000); // Update every second
      
    }, 600); // Start countdown 0.6 seconds after vote

    // Send vote through WebSocket (just adds the vote, no automatic timeout)
    const voteData = {
      type: 'vote',
      pokemon: pokemonChoice,
      timestamp: new Date().toISOString(),
      userId: generateUserId()
    };

    try {
      ws.send(JSON.stringify(voteData));
    } catch (error) {
      console.error('Failed to send vote:', error);
      // Revert the vote if WebSocket fails
      dispatch({ type: ACTIONS.SET_USER_VOTED, payload: null });
      setShowCountdown(false);
    }
  };

  /**
   * Handle starting a new battle with random Pokémon
   */
  const handleNewBattle = () => {
    const randomIds = pokemonAPI.getRandomPokemonIds();
    loadPokemon(randomIds[0], randomIds[1]);
  };

  /**
   * Handle retry for error states
   */
  const handleRetry = () => {
    loadPokemon();
  };

  /**
   * Determine the winner and their information
   * @returns {Object} Winner information
   */
  const getWinnerInfo = () => {
    if (totalVotes === 0) return null;
    
    const pokemon1Votes = votes.pokemon1;
    const pokemon2Votes = votes.pokemon2;
    
    if (pokemon1Votes === pokemon2Votes) {
      return { winner: 'tie', name: 'Tie' };
    }
    
    const winner = pokemon1Votes > pokemon2Votes ? 'pokemon1' : 'pokemon2';
    const winnerPokemon = winner === 'pokemon1' ? pokemon1 : pokemon2;
    return {
      winner,
      name: winnerPokemon?.name || 'Unknown',
      pokemon: winnerPokemon
    };
  };

  /**
   * Close the winner banner and prevent it from reappearing
   */
  const closeBanner = () => {
    setBannerExiting(true);
    setBannerDismissed(true);
    setTimeout(() => {
      setShowWinnerBanner(false);
      setBannerExiting(false);
    }, 500);
  };

  // Show loading spinner while fetching Pokémon
  if (loading) {
    return <LoadingSpinner message="Loading epic Pokémon battle..." />;
  }

  // Show error message if something went wrong
  if (error) {
    return <ErrorMessage error={error} onRetry={handleRetry} />;
  }

  // Get winner information for results display
  const winnerInfo = getWinnerInfo();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/pokemon_pixel_background.png")'
      }}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      
      {/* Winner Banner */}
      {showWinnerBanner && winnerInfo?.winner && (
        <div className="winner-banner-container">
          <div className={`winner-banner-content p-4 ${bannerExiting ? 'winner-banner-exit' : 'winner-banner'}`}>
            <div className="text-center">
              {winnerInfo.winner === 'tie' ? (
                // 🔧 FIXED: Special text for ties
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-black retro-text">
                    🤝 IT'S A TIE! 🤝
                  </h2>
                  <p className="text-lg text-black/80 retro-text mt-1">
                    Both Pokémon are equally amazing with {votes.pokemon1} votes each!
                  </p>
                </>
              ) : (
                // Original winner text
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-black retro-text">
                    🏆 {winnerInfo.name?.charAt(0).toUpperCase() + winnerInfo.name?.slice(1)} WINS! 🏆
                  </h2>
                  <p className="text-lg text-black/80 retro-text mt-1">
                    With {winnerInfo.winner === 'pokemon1' ? votes.pokemon1 : votes.pokemon2} votes!
                  </p>
                </>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={closeBanner}
              className="banner-close-btn"
              aria-label="Close winner banner"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Left Pokéball */}
            <img 
              src="/pokeball.png" 
              alt="Pokeball" 
              className="w-16 h-16 drop-shadow-lg"
            />

            {/* Pokémon Logo */}
            <h1 className="pokemon-logo text-6xl md:text-7xl font-bold">
              Pokémon
            </h1>

            {/* Right Pokéball (Flipped) */}
            <img 
              src="/pokeball.png" 
              alt="Pokeball" 
              className="w-16 h-16 drop-shadow-lg"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 drop-shadow-lg">
            <span style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Battle</span>  <span style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Royale</span>
          </h2>
          <p className="text-gray-800 text-xl mb-6 font-semibold drop-shadow">
            Vote your champion and see who Wins!
          </p>
        
          {/* Connection Status & Stats - WITH DARKER BACKGROUND */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
              <ConnectionStatus status={connectionStatus} className="text-white" />
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-white font-semibold drop-shadow">
                <Users className="w-5 h-5" />
                <span className="font-medium">{totalVotes.toLocaleString()} total votes</span>
              </div>
            </div>
          </div>

          {/* New Battle Button */}
          <button
            onClick={handleNewBattle}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg retro-text"
          >
            <RotateCcw className="w-4 h-4" />
            NEW RANDOM BATTLE
          </button>
        </header>

        <div className="container mx-auto px-4 pb-8">
          {/* Battle Arena - SMALLER CARDS */}
          <div className="flex justify-center items-start gap-8 max-w-4xl mx-auto">
            {pokemon1 && (
              <PokemonCard
                pokemon={pokemon1}
                position="pokemon1"
                onVote={handleVote}
                userVoted={userVoted}
                votes={votes.pokemon1}
                totalVotes={totalVotes}
                votingLocked={state.votingLocked} // 🔧 NEW: Pass voting lock status
              />
            )}
            
            {pokemon2 && (
              <PokemonCard
                pokemon={pokemon2}
                position="pokemon2"
                onVote={handleVote}
                userVoted={userVoted}
                votes={votes.pokemon2}
                totalVotes={totalVotes}
                votingLocked={state.votingLocked} // 🔧 NEW: Pass voting lock status
              />
            )}
          </div>
        </div>
      </div>
      
      {/* 🔧 NEW: Countdown Banner - CENTERED ON SCREEN */}
      {showCountdown && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md rounded-xl px-8 py-4 border-2 border-white/30 shadow-2xl">
            <div className="flex items-center gap-3 text-white font-bold text-2xl retro-text">
              <span>Votes close in</span>
              <span className="text-red-400 text-3xl animate-pulse">{countdown}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BattleArena;