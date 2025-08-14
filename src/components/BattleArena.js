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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
            backgroundImage: 'url("/pokemon_pixel_background.png")'       }}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10">{/* Header */}
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

        <h2 className="pokemon-subtitle text-2xl md:text-3xl font-bold text-gray-800 mb-4 drop-shadow-lg">
          Battle Royale
        </h2>
        <p className="text-gray-800 text-xl mb-6 font-semibold drop-shadow">
          Choose your champion and watch the votes roll in!
        </p>
        
        {/* Connection Status & Stats */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <ConnectionStatus status={connectionStatus} />
          <div className="flex items-center gap-2 text-gray-800 font-semibold drop-shadow">
            <Users className="w-5 h-5" />
            <span className="font-medium">{totalVotes.toLocaleString()} total votes</span>
          </div>
        </div>

        {/* New Battle Button */}
        <button
          onClick={handleNewBattle}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
            <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-2xl p-6 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🏆 Battle Results
              </h2>
              
              {winnerInfo?.winner && winnerInfo.winner !== 'tie' && (
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-xl mb-2">
                    🎉 {winnerInfo.name?.charAt(0).toUpperCase() + winnerInfo.name?.slice(1)} wins! 🎉
                  </p>
                  <p className="text-gray-600">
                    With {winnerInfo.winner === 'pokemon1' ? votes.pokemon1 : votes.pokemon2} votes 
                    ({Math.round(((winnerInfo.winner === 'pokemon1' ? votes.pokemon1 : votes.pokemon2) / totalVotes) * 100)}% of total votes)
                  </p>
                </div>
              )}

              {winnerInfo?.winner === 'tie' && (
                <div className="text-center pt-4 border-t border-gray-300">
                  <p className="text-gray-800 font-bold text-lg">
                    🤝 It's a tie! Both Pokémon are equally matched!
                  </p>
                </div>
              )}

              {winnerInfo?.winner === null && (
                <div className="text-center pt-4 border-t border-gray-300">
                  <p className="text-gray-800 font-bold text-lg">
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
            <p className="text-gray-800 text-lg font-semibold drop-shadow">
              Cast your vote to see real-time results! 🗳️
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default BattleArena;