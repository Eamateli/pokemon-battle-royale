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
   * Generate a simple user ID for demo purposes
   * In production, this would come from user authentication
   */
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Determine which Pokémon is currently winning
   */
  const getWinnerInfo = () => {
    if (totalVotes === 0) return null;
    
    if (votes.pokemon1 > votes.pokemon2) {
      return { winner: pokemon1, percentage: Math.round((votes.pokemon1 / totalVotes) * 100) };
    } else if (votes.pokemon2 > votes.pokemon1) {
      return { winner: pokemon2, percentage: Math.round((votes.pokemon2 / totalVotes) * 100) };
    }
    return { winner: null, percentage: 50 }; // Tie
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Preparing battle arena..." />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage error={error} onRetry={handleRetry} />;
  }

  const winnerInfo = getWinnerInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            ⚡ Pokémon Battle Royale ⚡
          </h1>
          
          <p className="text-xl text-white/90 mb-6">
            Choose your champion and watch the votes roll in!
          </p>
          
          {/* Status Bar */}
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <ConnectionStatus status={connectionStatus} />
            
            {totalVotes > 0 && (
              <div className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                <span className="font-medium">
                  {totalVotes.toLocaleString()} total votes
                </span>
              </div>
            )}

            <button
              onClick={handleNewBattle}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4" />
              New Battle
            </button>
          </div>
        </header>

        {/* Battle Cards */}
        <main className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PokemonCard
            pokemon={pokemon1}
            position="pokemon1"
            onVote={handleVote}
            userVoted={userVoted}
            votes={votes.pokemon1}
            totalVotes={totalVotes}
          />
          
          <PokemonCard
            pokemon={pokemon2}
            position="pokemon2"
            onVote={handleVote}
            userVoted={userVoted}
            votes={votes.pokemon2}
            totalVotes={totalVotes}
          />
        </main>

        {/* Battle Results Summary */}
        {userVoted && totalVotes > 0 && (
          <section className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              🏆 Battle Results
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-white">
                <span className="capitalize font-medium">{pokemon1.name}</span>
                <span className="font-bold">
                  {votes.pokemon1.toLocaleString()} votes ({Math.round((votes.pokemon1 / totalVotes) * 100)}%)
                </span>
              </div>
              
              <div className="flex justify-between text-white">
                <span className="capitalize font-medium">{pokemon2.name}</span>
                <span className="font-bold">
                  {votes.pokemon2.toLocaleString()} votes ({Math.round((votes.pokemon2 / totalVotes) * 100)}%)
                </span>
              </div>

              {winnerInfo?.winner && (
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-yellow-300 font-bold text-lg">
                    🎉 {winnerInfo.winner.name.toUpperCase()} is leading with {winnerInfo.percentage}%!
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
            <p className="text-white/80 text-lg">
              Cast your vote to see real-time results! 🗳️
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleArena;