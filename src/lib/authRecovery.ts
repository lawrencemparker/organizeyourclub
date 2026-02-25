import { supabase } from "./supabase";

/**
 * WHY THIS FILE EXISTS
 * --------------------
 * Supabase fires the PASSWORD_RECOVERY auth event during its own client
 * initialization — which happens the moment `supabase` is first imported
 * (inside AuthContext). This occurs BEFORE React has rendered any routes or
 * components. Any listener registered inside a component (even at module
 * level in a route-level file) will miss the event entirely, because those
 * files aren't imported until the route renders, which is after auth is done.
 *
 * This file must be imported in main.tsx as the VERY FIRST import, before
 * createRoot / ReactDOM.render is called. That guarantees this listener is
 * registered at the same time Supabase initializes and fires its events.
 *
 * USAGE in main.tsx:
 *   import "@/lib/authRecovery";   ← add this as the first import
 *   import { createRoot } from "react-dom/client";
 *   ...
 */

export let isRecoverySession = false;

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    isRecoverySession = true;
  }
});

export function clearRecoverySession() {
  isRecoverySession = false;
}