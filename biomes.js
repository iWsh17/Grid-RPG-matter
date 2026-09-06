export function createBiomeRegistry(biomes, assignments) {
  const biomeMap = new Map(Object.entries(assignments));
  return {
    getBiomeIdAt(x, y) { return biomeMap.get(`${x},${y}`) ?? 'meadow'; },
    getBiomeAt(x, y) { return biomes[this.getBiomeIdAt(x, y)] ?? biomes.meadow; },
    list() { return Object.values(biomes); },
    validate() { return Object.values(assignments).every(biomeId => Boolean(biomes[biomeId])); },
    validateResourceNodes(resourceNodes) {
      const errors = [];
      Object.values(resourceNodes).forEach(node => {
        const mapBiomeId = this.getBiomeIdAt(node.x, node.y);
        if (!biomes[node.biomeId]) errors.push(`${node.id}: unknown biome '${node.biomeId}'`);
        else if (mapBiomeId !== node.biomeId) errors.push(`${node.id}: declared ${node.biomeId}, map uses ${mapBiomeId} at ${node.x},${node.y}`);
      });
      return { valid: errors.length === 0, errors };
    }
  };
}
