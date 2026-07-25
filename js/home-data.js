"use strict";

(() => {
    const CACHE_PREFIX = "kmc-home-cache-v2:";
    const memory = new Map();
    const pending = new Map();

    function readCache(key) {
        if (memory.has(key)) return memory.get(key);
        try {
            const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            memory.set(key, parsed);
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function writeCache(key, value) {
        const entry = { value, savedAt: Date.now() };
        memory.set(key, entry);
        try {
            localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
        } catch (_) {
            // Storage may be unavailable in private browsing; memory caching still works.
        }
        return entry;
    }

    function cachedValue(key) {
        return readCache(key)?.value ?? null;
    }

    function stableStringify(value) {
        if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
        if (value && typeof value === "object") {
            return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
        }
        return JSON.stringify(value);
    }

    function changed(a, b) {
        return stableStringify(a) !== stableStringify(b);
    }

    function requestOnce(key, loader) {
        if (pending.has(key)) return pending.get(key);
        const request = Promise.resolve()
            .then(loader)
            .finally(() => pending.delete(key));
        pending.set(key, request);
        return request;
    }

    function getDocument(cacheKey, collection, documentId) {
        return requestOnce(cacheKey, async () => {
            const db = window.kmcFirebase?.db;
            if (!db) throw new Error("Firebase is unavailable.");
            const snapshot = await db.collection(collection).doc(documentId).get();
            const value = snapshot.exists ? snapshot.data() : null;
            writeCache(cacheKey, value);
            return value;
        });
    }

    function getLatestPerformances(limit = 2) {
        const cacheKey = `latest-performances-${limit}`;
        return requestOnce(cacheKey, async () => {
            const db = window.kmcFirebase?.db;
            if (!db) throw new Error("Firebase is unavailable.");
            const snapshot = await db.collection("performances").orderBy("date", "desc").limit(limit).get();
            const value = snapshot.docs.map(document => ({ id: document.id, data: document.data() }));
            writeCache(cacheKey, value);
            return value;
        });
    }

    window.KMCHomeData = {
        cachedValue,
        changed,
        getHomeContent: () => getDocument("home-content", "siteContent", "homeSections"),
        getArrangements: () => getDocument("arrangements", "siteContent", "arrangements"),
        getLatestPerformances,
        writeCache
    };
})();
