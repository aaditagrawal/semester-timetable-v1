"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the app installable and usable
 * offline. Renders nothing.
 *
 * Skipped in development: a caching worker between you and the dev server
 * makes changes look like they aren't applying.
 */
export function ServiceWorker() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;
        if (!("serviceWorker" in navigator)) return;

        // After load, so registration never competes with the first paint.
        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // Nothing to do — the app works fine without it.
            });
        };

        if (document.readyState === "complete") {
            register();
            return;
        }
        window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}
