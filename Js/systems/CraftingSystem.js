/**
 * CraftingSystem - Craft items from recipes
 * Pure functions, validates ingredients, consumes materials
 */

import { ITEMS, RECIPES } from '../../content.js';

export const CraftingSystem = {
  _recipes: null,

  /**
   * Initialize with recipe data
   */
  initialize() {
    this._recipes = RECIPES;
    console.log(`[CraftingSystem] Loaded ${this._recipes.length} recipes`);
  },

  /**
   * Get recipe by ID
   * @param {string} recipeId 
   * @returns {Object|null}
   */
  getRecipe(recipeId) {
    return this._recipes?.find(r => r.id === recipeId) || null;
  },

  /**
   * Get all recipes
   * @returns {Array}
   */
  getAllRecipes() {
    return this._recipes || [];
  },

  /**
   * Check if player has ingredients for recipe
   * @param {Object} state 
   * @param {string} recipeId 
   * @returns {{canCraft: boolean, missing?: Object}}
   */
  canCraft(state, recipeId) {
    const recipe = this.getRecipe(recipeId);
    
    if (!recipe) {
      return { canCraft: false, reason: 'recipe_not_found' };
    }

    const missing = {};
    let hasAll = true;

    for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
      const playerAmount = state.inventory?.[ingredientId] || 0;
      
      if (playerAmount < amount) {
        hasAll = false;
        missing[ingredientId] = {
          required: amount,
          have: playerAmount,
          name: ITEMS[ingredientId]?.name || ingredientId
        };
      }
    }

    return {
      canCraft: hasAll,
      missing: hasAll ? null : missing,
      recipe: recipe
    };
  },

  /**
   * Craft an item
   * @param {Object} state 
   * @param {string} recipeId 
   * @returns {{success: boolean, code: string, message: string, crafted?: Object}}
   */
  craft(state, recipeId) {
    const check = this.canCraft(state, recipeId);
    
    if (!check.canCraft) {
      if (check.reason === 'recipe_not_found') {
        return {
          success: false,
          code: 'RECIPE_NOT_FOUND',
          message: 'Unknown recipe'
        };
      }

      const missingList = Object.values(check.missing)
        .map(m => `${m.name}: ${m.have}/${m.required}`)
        .join(', ');

      return {
        success: false,
        code: 'MISSING_INGREDIENTS',
        message: `Missing: ${missingList}`,
        missing: check.missing
      };
    }

    const recipe = check.recipe;

    // Consume ingredients
    for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
      state.inventory[ingredientId] -= amount;
      if (state.inventory[ingredientId] <= 0) {
        delete state.inventory[ingredientId];
      }
    }

    // Add output
    const { itemId, amount } = recipe.output;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + amount;

    const item = ITEMS[itemId];

    return {
      success: true,
      code: 'CRAFTED',
      message: `Crafted ${item?.name || itemId} x${amount}!`,
      crafted: {
        itemId,
        name: item?.name || itemId,
        amount
      }
    };
  },

  /**
   * Get recipes player can currently craft
   * @param {Object} state 
   * @returns {Array}
   */
  getCraftableRecipes(state) {
    return this.getAllRecipes().filter(recipe => {
      const check = this.canCraft(state, recipe.id);
      return check.canCraft;
    });
  }
};

export default CraftingSystem;