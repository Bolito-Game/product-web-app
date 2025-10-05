// A constant for the shopping cart local storage key.
const CART_STORAGE_KEY = 'product-web-app-shopping-cart';
// Time-to-live for cached items: 1 hour in milliseconds.
const TTL = 3600 * 1000;

/**
 * Retrieves the list of SKUs currently in the shopping cart.
 * @returns {Set<string>} A set of SKUs in the cart.
 */
const getCartSkus = () => {
    try {
        const cartString = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartString) return new Set();
        const cartItems = JSON.parse(cartString);
        return new Set(cartItems.map(item => item.sku));
    } catch (e) {
        console.error("Failed to parse shopping cart for caching logic.", e);
        return new Set();
    }
};

/**
 * Checks if a cached item's timestamp is older than the TTL.
 * This check now applies to all items, regardless of whether they are in the cart.
 * @param {object} item - The cached item object { data, timestamp }.
 * @returns {boolean} - True if the item is expired, false otherwise.
 */
const isExpired = (item) => {
    // An item without a valid timestamp is considered expired.
    if (!item || typeof item.timestamp !== 'number') return true;

    const now = new Date().getTime();
    return (now - item.timestamp) > TTL;
};

/**
 * Saves a product to the local storage cache with a current timestamp.
 * @param {string} sku - The product's Stock Keeping Unit.
 * @param {object} productData - The product data object to cache.
 */
export const setProductInCache = (sku, productData) => {
    if (!sku || !productData) return;
    try {
        const cacheItem = {
            data: productData,
            timestamp: new Date().getTime(),
        };
        localStorage.setItem(sku, JSON.stringify(cacheItem));
    } catch (e) {
        console.error(`Failed to cache product with SKU: ${sku}`, e);
    }
};

/**
 * Cleans up expired product data from local storage.
 * IMPORTANT: This function will NOT remove expired items that are still in the shopping cart.
 * Their data is kept to be re-fetched on the ProductDetailPage.
 */
export const cleanupExpiredProducts = () => {
    const cartSkus = getCartSkus();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || key === CART_STORAGE_KEY) continue;

        try {
            const itemString = localStorage.getItem(key);
            if (!itemString) continue;

            const item = JSON.parse(itemString);

            // An item is removed only if it is expired AND not in the shopping cart.
            if (item && item.timestamp && item.data) {
                if (isExpired(item) && !cartSkus.has(key)) {
                    keysToRemove.push(key);
                }
            }
        } catch (e) {
            // Ignore keys that are not valid JSON or don't match our structure.
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
};