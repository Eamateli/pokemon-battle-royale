import { useContext } from 'react';
import { BattleContext } from '../context/BattleContext';

/**
 * Custom hook to use the Battle Context
 * Provides easy access to battle state and actions
 * 
 * @returns {Object} Battle context value containing state, dispatch, and ws
 * @throws {Error} If used outside of BattleProvider
 */
export function useBattle() {
  const context = useContext(BattleContext);
  
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  
  return context;
}

/**
 * Additional helper functions for common battle operations
 */
export const battleHelpers = {
  /**
   * Calculate vote percentage for a Pokémon
   * @param {number} votes - Votes for this Pokémon
   * @param {number} totalVotes - Total votes cast
   * @returns {number} Percentage (0-100)
   */
  calculatePercentage: (votes, totalVotes) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  },

  /**
   * Determine if a Pokémon is the current winner
   * @param {number} votes - Votes for this Pokémon
   * @param {number} totalVotes - Total votes cast
   * @returns {boolean} True if this Pokémon is winning
   */
  isWinner: (votes, totalVotes) => {
    return votes > 0 && totalVotes > 0 && votes / totalVotes >= 0.5;
  },

  /**
   * Format Pokémon stats for display
   * @param {Object} pokemon - Pokémon data
   * @returns {Object} Formatted stats
   */
  formatStats: (pokemon) => {
    if (!pokemon) return {};
    
    return {
      weight: `${pokemon.weight / 10} kg`,
      height: `${pokemon.height / 10} m`,
      baseExperience: pokemon.baseExperience
    };
  }
};