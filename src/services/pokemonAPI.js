import { API_CONFIG } from '../utils/constants';

// API service for fetching Pokémon data
export const pokemonAPI = {
  /**
   * Fetch a single Pokémon by name or ID
   * @param {string|number} nameOrId - Pokémon name or ID
   * @returns {Promise<Object>} Formatted Pokémon data
   */
  async fetchPokemon(nameOrId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(
        `${API_CONFIG.POKEMON_BASE_URL}${nameOrId.toString().toLowerCase()}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${nameOrId} (${response.status})`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        sprite: data.sprites.other['official-artwork']?.front_default || 
                data.sprites.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        weight: data.weight,
        height: data.height,
        baseExperience: data.base_experience,
        types: data.types.map(type => type.type.name)
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${nameOrId}`);
      }
      throw new Error(`Error fetching ${nameOrId}: ${error.message}`);
    }
  },

  /**
   * Fetch two Pokémon simultaneously
   * @param {string|number} pokemon1Name - First Pokémon
   * @param {string|number} pokemon2Name - Second Pokémon
   * @returns {Promise<Object>} Object containing both Pokémon
   */
  async fetchBothPokemon(pokemon1Name = 'bulbasaur', pokemon2Name = 'pikachu') {
    try {
      const [pokemon1, pokemon2] = await Promise.all([
        this.fetchPokemon(pokemon1Name),
        this.fetchPokemon(pokemon2Name)
      ]);
      return { pokemon1, pokemon2 };
    } catch (error) {
      throw new Error(`Failed to fetch Pokémon: ${error.message}`);
    }
  },

  /**
   * Get two random Pokémon IDs from the original 150
   * @returns {Array<number>} Array of two different random IDs
   */
  getRandomPokemonIds() {
    const id1 = Math.floor(Math.random() * API_CONFIG.MAX_POKEMON_ID) + 1;
    let id2 = Math.floor(Math.random() * API_CONFIG.MAX_POKEMON_ID) + 1;
    
    // Ensure we get two different Pokémon
    while (id2 === id1) {
      id2 = Math.floor(Math.random() * API_CONFIG.MAX_POKEMON_ID) + 1;
    }
    
    return [id1, id2];
  },

  /**
   * Get random Pokémon names for battles
   * @returns {Array<string>} Array of popular Pokémon names
   */
  getPopularPokemonNames() {
    const popularPokemon = [
      'pikachu', 'charizard', 'blastoise', 'venusaur', 'alakazam',
      'machamp', 'gengar', 'dragonite', 'mewtwo', 'mew', 'gyarados',
      'lapras', 'eevee', 'snorlax', 'articuno', 'zapdos', 'moltres'
    ];
    
    return popularPokemon.sort(() => 0.5 - Math.random()).slice(0, 2);
  }
};