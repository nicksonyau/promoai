export const storeService = {
  async createStore(id: string, data: any) {
    await STORES_KV.put(`store:${id}`, JSON.stringify(data));
  },
  async getStoreById(id: string) {
    const store = await STORES_KV.get(`store:${id}`);
    return store ? JSON.parse(store) : null;
  },
  async getAllStores() {
    const stores = [];
    const list = await STORES_KV.list({ prefix: "store:" });
    for (const key of list.keys) {
      const value = await STORES_KV.get(key.name);
      if (value) stores.push(JSON.parse(value));
    }
    return stores;
  },
  async updateStore(id: string, updates: any) {
    const store = await this.getStoreById(id);
    if (!store) return null;
    const updated = { ...store, ...updates, updated_at: new Date().toISOString() };
    await STORES_KV.put(`store:${id}`, JSON.stringify(updated));
    return updated;
  },
  async deleteStore(id: string) {
    await STORES_KV.delete(`store:${id}`);
  },
};
