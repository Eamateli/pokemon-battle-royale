import React from 'react';
import { Zap, Trophy } from 'lucide-react';
import { battleHelpers } from '../hooks/useBattle';

/**
 * Pokemon Card Component
 * Displays individual Pokémon information, voting button, and results
 * Now with Game Boy Pokédex styling
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
    if (img.src.includes('official-artwork')) {
      img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    } else if (!img.src.includes('placeholder')) {
      img.src = `https://via.placeholder.com/128x128/3B82F6/FFFFFF?text=${pokemon.name.charAt(0).toUpperCase()}`;
    }
  };

  /**
   * Get type-specific styling for Pokémon type badges
   */
  const getTypeColor = (type) => {
    const typeColors = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0', 
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    return typeColors[type] || '#68A090';
  };

  // Use pixelated sprite instead of official artwork
  const pokemonImage = pokemon.sprites?.front_default || 
                      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

  return (
    <div className={`relative bg-gradient-to-b from-red-600 to-red-800 border-4 border-red-900 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 pokemon-card-retro ${
      isWinner ? 'ring-4 ring-yellow-400 winner-glow' : ''
    } ${canVote ? 'hover:shadow-xl cursor-pointer' : ''}`}>
      
      {/* Winner Badge */}
      {isWinner && totalVotes > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-black px-2 py-1 border-2 border-yellow-600 text-xs font-bold flex items-center gap-1 retro-text">
          <Trophy className="w-3 h-3" />
          WINNER
        </div>
      )}

      {/* Header with Pokemon Name */}
      <div className="bg-gray-300 border-b-2 border-gray-500 p-2 text-center">
        <h3 className="text-lg font-bold text-black retro-text uppercase tracking-wider">
          {pokemon.name}
        </h3>
      </div>

      {/* Pokemon Image Container - Dark Screen - Square */}
      <div className="bg-black border-4 border-gray-400 m-3 rounded-lg relative" style={{ aspectRatio: '1/1', minHeight: '500px' }}>
        <div className="flex items-center justify-center h-full">
          <img 
            src={pokemonImage}
            alt={pokemon?.name || 'Pokemon'}
            className="object-contain pixel-image bounce-in pokemon-breathing"
            style={{ width: '480px', height: '480px' }}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-pulse"></div>
        </div>

        {/* Blinking overlay effect */}
        <div className="absolute inset-0 pointer-events-none pokemon-blink"></div>
      </div>

      {/* Info Panel - All details in ONE red card */}
      <div className="p-3">
        <div className="bg-red-400 border-2 border-red-600 p-3 rounded space-y-1">
          
          {/* Type */}
          <div className="retro-text text-left flex items-center">
            <span className="text-xs font-bold text-black">Type:</span>
            <div className="flex gap-2 ml-2">
              {pokemon.types && pokemon.types.length > 0 ? (
                pokemon.types.map((typeName, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 text-xs font-bold text-white rounded-full retro-text uppercase border border-black"
                    style={{ backgroundColor: getTypeColor(typeName) }}
                  >
                    {typeName}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 text-xs font-bold text-white rounded-full retro-text border border-black bg-gray-500">
                  Loading...
                </span>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="retro-text text-left">
            <span className="text-xs font-bold text-black">Experience:</span>
            <span className="text-lg font-bold text-white ml-2">
              {pokemon?.baseExperience || '0'}
            </span>
          </div>

          {/* Height */}
          <div className="retro-text text-left">
            <span className="text-xs font-bold text-black">Height:</span>
            <span className="text-lg font-bold text-white ml-2">
              {formattedStats?.height || '0.0m'}
            </span>
          </div>

          {/* Weight */}
          <div className="retro-text text-left">
            <span className="text-xs font-bold text-black">Weight:</span>
            <span className="text-lg font-bold text-white ml-2">
              {formattedStats?.weight || '0.0kg'}
            </span>
          </div>

        </div>

        {/* Voting Section - Keep all existing functionality */}
        <div className="mt-4">
          {userVoted ? (
            // Show Results
            <div className="space-y-2">
              <div className="bg-white border-2 border-gray-400 p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-black retro-text">
                    VOTES: {votes.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-blue-600 retro-text">{percentage}%</span>
                </div>
                
                {/* Pixel Progress Bar */}
                <div className="w-full bg-gray-300 border border-gray-500 h-4 mt-2 relative overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500 ease-out progress-bar border-r border-blue-700"
                    style={{ 
                      width: `${percentage}%`,
                      background: percentage > 50 ? '#00FF00' : '#0066FF'
                    }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${pokemon?.name || 'Pokemon'} has ${percentage}% of votes`}
                  ></div>
                </div>
                
                {/* User Vote Indicator */}
                {userVoted === position && (
                  <div className="text-center text-xs text-green-600 font-bold mt-1 retro-text">
                    ★ YOUR VOTE ★
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show Vote Button
            <button
              onClick={() => onVote(position)}
              className="bg-yellow-400 hover:bg-yellow-300 border-4 border-yellow-600 text-black font-bold py-2 px-4 transition-all duration-200 retro-text uppercase tracking-wider retro-button rounded-full"
              disabled={!canVote}
              aria-label={`Vote for ${pokemon?.name || 'Pokemon'}`}
            >
              VOTE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;