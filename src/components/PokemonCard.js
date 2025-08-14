import React from 'react';
import { Zap, Trophy } from 'lucide-react';
import { battleHelpers } from '../hooks/useBattle';

/**
 * Pokemon Card Component
 * Displays individual Pokémon information, voting button, and results
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pokemon - Pokémon data object
 * @param {string} props.position - Position identifier ('pokemon1' or 'pokemon2')
 * @param {Function} props.onVote - Callback function for voting
 * @param {string|null} props.userVoted - Which Pokémon the user voted for
 * @param {number} props.votes - Number of votes for this Pokémon
 * @param {number} props.totalVotes - Total votes across both Pokémon
 */
function PokemonCard({ pokemon, position, onVote, userVoted, votes, totalVotes }) {
  // Add defensive checks to prevent errors
  if (!pokemon) {
    return <div className="bg-white rounded-2xl shadow-lg p-6">Loading Pokemon...</div>;
  }

  // Calculate display values
  const percentage = battleHelpers.calculatePercentage(votes, totalVotes);
  const isWinner = totalVotes > 0 && votes > 0 && votes >= (totalVotes - votes);
  const canVote = !userVoted;
  const formattedStats = battleHelpers.formatStats(pokemon);

  /**
   * Handle image loading errors by falling back to alternative sprites
   */
  const handleImageError = (e) => {
    const img = e.target;
    // Use different image sources based on what's available
    if (pokemon.sprite && img.src !== pokemon.sprite) {
      img.src = pokemon.sprite;
    } else if (pokemon.id && !img.src.includes('placeholder')) {
      img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    } else {
      img.src = `https://via.placeholder.com/128x128/3B82F6/FFFFFF?text=${pokemon.name?.charAt(0).toUpperCase() || 'P'}`;
    }
  };

  /**
   * Get type-specific styling for Pokémon type badges
   */
  const getTypeColor = (type) => {
    const typeColors = {
      normal: 'bg-gray-100 text-gray-800',
      fire: 'bg-red-100 text-red-800',
      water: 'bg-blue-100 text-blue-800',
      electric: 'bg-yellow-100 text-yellow-800',
      grass: 'bg-green-100 text-green-800',
      ice: 'bg-cyan-100 text-cyan-800',
      fighting: 'bg-red-200 text-red-900',
      poison: 'bg-purple-100 text-purple-800',
      ground: 'bg-yellow-200 text-yellow-900',
      flying: 'bg-indigo-100 text-indigo-800',
      psychic: 'bg-pink-100 text-pink-800',
      bug: 'bg-green-200 text-green-900',
      rock: 'bg-yellow-300 text-yellow-900',
      ghost: 'bg-purple-200 text-purple-900',
      dragon: 'bg-indigo-200 text-indigo-900',
      dark: 'bg-gray-300 text-gray-900',
      steel: 'bg-gray-200 text-gray-800',
      fairy: 'bg-pink-200 text-pink-900'
    };
    return typeColors[type] || 'bg-blue-100 text-blue-800';
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 pokemon-card ${
      isWinner ? 'ring-4 ring-yellow-400 shadow-yellow-200 winner-glow' : ''
    } ${canVote ? 'hover:shadow-xl cursor-pointer' : ''}`}>
      
      {/* Winner Badge */}
      {isWinner && totalVotes > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Winner!
        </div>
      )}

      <div className="p-6">
        {/* Pokemon Image */}
        <div className="text-center mb-4">
          <img 
            src={pokemon.sprite || 
                 `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png` ||
                 `https://via.placeholder.com/128x128/3B82F6/FFFFFF?text=${pokemon.name?.charAt(0).toUpperCase() || 'P'}`}
            alt={pokemon.name || 'Pokemon'}
            className="w-32 h-32 mx-auto object-contain bounce-in"
            onError={handleImageError}
            loading="lazy"
          />
        </div>

        {/* Pokemon Info */}
        <div className="space-y-3 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 text-center capitalize">
            {pokemon.name || 'Unknown Pokemon'}
          </h3>
          
          {/* Types - FIXED: Handle the types array properly */}
          <div className="flex justify-center gap-2 flex-wrap">
            {pokemon.types && pokemon.types.length > 0 ? (
              pokemon.types.map((type, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(type)}`}
                >
                  {type}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Unknown Type
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-800">{formattedStats.weight || 'N/A'}</div>
              <div className="text-xs text-gray-600">Weight</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-800">{formattedStats.height || 'N/A'}</div>
              <div className="text-xs text-gray-600">Height</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-800">{pokemon.base_experience || pokemon.baseExperience || 'N/A'}</div>
              <div className="text-xs text-gray-600">Base EXP</div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        {userVoted ? (
          // Show Results
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Votes: {votes.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-blue-600">{percentage}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out progress-bar"
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${pokemon.name} has ${percentage}% of votes`}
              ></div>
            </div>
            
            {/* User Vote Indicator */}
            {userVoted === position && (
              <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                <span className="text-green-500">✓</span>
                Your vote
              </div>
            )}
          </div>
        ) : (
          // Show Vote Button
          <button
            onClick={() => onVote(position)}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 vote-button"
            disabled={!canVote}
            aria-label={`Vote for ${pokemon.name}`}
          >
            <Zap className="w-5 h-5" />
            Vote for {pokemon.name}
          </button>
        )}
      </div>
    </div>
  );
}

export default PokemonCard;