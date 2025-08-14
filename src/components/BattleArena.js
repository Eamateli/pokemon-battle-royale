import React, { useEffect } from 'react';
import { Users, RotateCcw } from 'lucide-react';
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

  // Load initial Pokémon when component mounts
  useEffect(() => {
    loadPokemon();
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
      
      // Reset votes for new battle
      dispatch({ type: ACTIONS.SET_VOTES, payload: { pokemon1: 0, pokemon2: 0 } });
      dispatch({ type: ACTIONS.SET_USER_VOTED, payload: null });
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

    // Send vote through WebSocket
    const voteData = {
      type: 'vote',
      pokemon: pokemonChoice,
      timestamp: new Date().toISOString(),
      userId: generateUserId() // In a real app, this would be from authentication
    };

    try {
      ws.send(JSON.stringify(voteData));
    } catch (error) {
      console.error('Failed to send vote:', error);
      // Revert the vote if WebSocket fails
      dispatch({ type: ACTIONS.SET_USER_VOTED, payload: null });
    }
  };

  /**
   * Start a new battle with random Pokémon
   */
  const handleNewBattle = async () => {
    try {
      const [id1, id2] = pokemonAPI.getRandomPokemonIds();
      await loadPokemon(id1, id2);
    } catch (error) {
      console.error('Failed to start new battle:', error);
      // Fallback to popular Pokémon if random fails
      const [name1, name2] = pokemonAPI.getPopularPokemonNames();
      await loadPokemon(name1, name2);
    }
  };

  /**
   * Retry loading Pokémon after an error
   */
  const handleRetry = () => {
    loadPokemon();
  };

  /**
   * Determine the winner of the current battle
   * @returns {string|null} 'pokemon1', 'pokemon2', or null for tie
   */
  const getWinner = () => {
    if (totalVotes === 0) return null;
    if (votes.pokemon1 > votes.pokemon2) return 'pokemon1';
    if (votes.pokemon2 > votes.pokemon1) return 'pokemon2';
    return 'tie';
  };

  /**
   * Get winner information for display
   * @returns {Object} Winner data including name and winner status
   */
  const getWinnerInfo = () => {
    const winner = getWinner();
    if (!winner || winner === 'tie') {
      return { winner: winner, name: null };
    }
    
    const winnerPokemon = winner === 'pokemon1' ? pokemon1 : pokemon2;
    return {
      winner,
      name: winnerPokemon?.name || 'Unknown',
      pokemon: winnerPokemon
    };
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%)'
    }}>
      {/* Floating Pokéballs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Pokéballs */}
        <div className="pokeball-large absolute top-10 left-10 opacity-10">
          <div className="w-32 h-32 bg-white rounded-full relative border-4 border-gray-800">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-4 border-gray-800"></div>
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
          </div>
        </div>

        <div className="pokeball-large absolute top-20 right-20 opacity-10">
          <div className="w-24 h-24 bg-white rounded-full relative border-3 border-gray-700">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-3 border-gray-700"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700"></div>
          </div>
        </div>

        <div className="pokeball-large absolute bottom-20 left-20 opacity-15">
          <div className="w-20 h-20 bg-white rounded-full relative border-2 border-gray-600">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-gray-600"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600"></div>
          </div>
        </div>

        <div className="pokeball-large absolute bottom-32 right-32 opacity-10">
          <div className="w-28 h-28 bg-white rounded-full relative border-3 border-gray-700">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-3 border-gray-700"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700"></div>
          </div>
        </div>

        {/* Small floating Pokéballs */}
        <div className="pokeball-small absolute top-40 left-1/3 opacity-20">
          <div className="w-12 h-12 bg-white rounded-full relative border-2 border-gray-600">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-gray-600"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600"></div>
          </div>
        </div>

        <div className="pokeball-small absolute top-60 right-1/4 opacity-15">
          <div className="w-16 h-16 bg-white rounded-full relative border-2 border-gray-600">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-600"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Left Pokéball */}
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full relative border-2 md:border-3 border-gray-800 shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full border-2 border-gray-800"></div>
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800"></div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
              Pokémon Battle Royale
            </h1>
            
            {/* Right Pokéball */}
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full relative border-2 md:border-3 border-gray-800 shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full border-2 border-gray-800"></div>
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800"></div>
            </div>
          </div>
          <p className="text-white/90 text-xl mb-6">
            Choose your champion and watch the votes roll in!
          </p>
          
          {/* Connection Status & Stats */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <ConnectionStatus status={connectionStatus} />
            <div className="flex items-center gap-2 text-white/80">
              <Users className="w-5 h-5" />
              <span className="font-medium">{totalVotes.toLocaleString()} total votes</span>
            </div>
          </div>

          {/* New Battle Button */}
          <button
            onClick={handleNewBattle}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4" />
            New Random Battle
          </button>
        </header>

        <div className="container mx-auto px-4 pb-8">
          {/* Battle Arena */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {pokemon1 && (
              <PokemonCard
                pokemon={pokemon1}
                position="pokemon1"
                onVote={handleVote}
                userVoted={userVoted}
                votes={votes.pokemon1}
                totalVotes={totalVotes}
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
              />
            )}
          </div>

          {/* Results Section */}
          {userVoted && totalVotes > 0 && (
            <section className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  🏆 Battle Results
                </h2>
                
                {winnerInfo?.winner && winnerInfo.winner !== 'tie' && (
                  <div className="text-center">
                    <p className="text-white font-bold text-xl mb-2">
                      🎉 {winnerInfo.name?.charAt(0).toUpperCase() + winnerInfo.name?.slice(1)} wins! 🎉
                    </p>
                    <p className="text-white/80">
                      With {winnerInfo.winner === 'pokemon1' ? votes.pokemon1 : votes.pokemon2} votes 
                      ({Math.round(((winnerInfo.winner === 'pokemon1' ? votes.pokemon1 : votes.pokemon2) / totalVotes) * 100)}% of total votes)
                    </p>
                  </div>
                )}

                {winnerInfo?.winner === 'tie' && (
                  <div className="text-center pt-4 border-t border-white/20">
                    <p className="text-white font-bold text-lg">
                      🤝 It's a tie! Both Pokémon are equally matched!
                    </p>
                  </div>
                )}

                {winnerInfo?.winner === null && (
                  <div className="text-center pt-4 border-t border-white/20">
                    <p className="text-white font-bold text-lg">
                      🤝 It's a tie! Both Pokémon are equally matched!
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Call to Action */}
          {!userVoted && (
            <div className="text-center mt-8">
              <p className="text-white/80 text-lg drop-shadow">
                Cast your vote to see real-time results! 🗳️
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .pokeball-large {
          animation: float 6s ease-in-out infinite;
        }
        
        .pokeball-small {
          animation: float 4s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .pokeball-large:nth-child(2) {
          animation-delay: -2s;
        }
        
        .pokeball-large:nth-child(3) {
          animation-delay: -4s;
        }
        
        .pokeball-small:nth-child(1) {
          animation-delay: -1s;
        }
        
        .pokeball-small:nth-child(2) {
          animation-delay: -3s;
        }
      `}</style>
    </div>
  );
}

export default BattleArena;