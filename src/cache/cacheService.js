class CacheService {
    #cache = new Map();

    constructor() {}

    save(key, value) {
        if (this.#cache.has(key)) {
            this.#cache.set(key, {
                ...this.#cache.get(key),
                ...value
            });

            return;
        }

        this.#cache.set(key, value);
    }

    retrieve(key) {
        return this.#cache.get(key);
    }

    has(key) {
        return this.#cache.has(key);
    }

    delete(key) {
        return this.#cache.delete(key);
    }
}

module.exports = new CacheService();