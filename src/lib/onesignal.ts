// OneSignal helper functions for client-side usage

declare global {
  interface Window {
    OneSignal?: any;
  }
}

/**
 * Set tags on the current user for segmentation
 * @example
 * await setUserTags({ 
 *   home_venue: 'costa-coffee-london',
 *   plan_type: 'premium',
 *   total_connections: '15'
 * });
 */
export async function setUserTags(tags: Record<string, string>): Promise<boolean> {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not loaded');
    return false;
  }
  
  try {
    await window.OneSignal.User.addTags(tags);
    console.log('[OneSignal] Tags set:', tags);
    return true;
  } catch (error) {
    console.error('[OneSignal] Failed to set tags:', error);
    return false;
  }
}

/**
 * Remove specific tags from the current user
 */
export async function removeUserTags(tagKeys: string[]): Promise<boolean> {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not loaded');
    return false;
  }
  
  try {
    await window.OneSignal.User.removeTags(tagKeys);
    console.log('[OneSignal] Tags removed:', tagKeys);
    return true;
  } catch (error) {
    console.error('[OneSignal] Failed to remove tags:', error);
    return false;
  }
}

/**
 * Get all tags for the current user
 */
export async function getUserTags(): Promise<Record<string, string> | null> {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not loaded');
    return null;
  }
  
  try {
    const tags = await window.OneSignal.User.getTags();
    return tags;
  } catch (error) {
    console.error('[OneSignal] Failed to get tags:', error);
    return null;
  }
}

/**
 * Link the OneSignal subscription to your user ID (external_user_id)
 * This allows you to target users by their Supabase user ID
 */
export async function setExternalUserId(userId: string): Promise<boolean> {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not loaded');
    return false;
  }
  
  try {
    await window.OneSignal.login(userId);
    console.log('[OneSignal] External user ID set:', userId);
    return true;
  } catch (error) {
    console.error('[OneSignal] Failed to set external user ID:', error);
    return false;
  }
}

/**
 * Clear the external user ID (on logout)
 */
export async function clearExternalUserId(): Promise<boolean> {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not loaded');
    return false;
  }
  
  try {
    await window.OneSignal.logout();
    console.log('[OneSignal] External user ID cleared');
    return true;
  } catch (error) {
    console.error('[OneSignal] Failed to clear external user ID:', error);
    return false;
  }
}

/**
 * Get the current subscription ID (player_id)
 */
export function getPlayerId(): string | null {
  if (!window.OneSignal) {
    return null;
  }
  
  try {
    return window.OneSignal.User.PushSubscription.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribed(): Promise<boolean> {
  if (!window.OneSignal) {
    return false;
  }
  
  try {
    return await window.OneSignal.User.PushSubscription.optedIn || false;
  } catch (error) {
    return false;
  }
}

// ============================================
// Pre-built tag helpers for common use cases
// ============================================

/**
 * Track when user connects to WiFi at a venue
 */
export async function trackWiFiConnection(venueName: string, venueId: string) {
  const now = new Date().toISOString();
  await setUserTags({
    last_venue: venueName,
    last_venue_id: venueId,
    last_connection: now,
    has_connected: 'true',
  });
  
  // Increment connection count
  const tags = await getUserTags();
  const count = parseInt(tags?.total_connections || '0') + 1;
  await setUserTags({ total_connections: count.toString() });
}

/**
 * Track user's preferred/home venue
 */
export async function setHomeVenue(venueName: string, venueId: string) {
  await setUserTags({
    home_venue: venueName,
    home_venue_id: venueId,
  });
}

/**
 * Track user's subscription tier
 */
export async function setSubscriptionTier(tier: 'free' | 'premium' | 'business') {
  await setUserTags({
    tier: tier,
    is_premium: tier !== 'free' ? 'true' : 'false',
  });
}

/**
 * Track user's location (city level for privacy)
 */
export async function setUserCity(city: string, country: string) {
  await setUserTags({
    city: city,
    country: country,
  });
}

/**
 * Track onboarding completion
 */
export async function trackOnboardingComplete() {
  await setUserTags({
    onboarding_complete: 'true',
    onboarding_date: new Date().toISOString().split('T')[0],
  });
}

/**
 * Track Passpoint profile installation
 */
export async function trackPasspointInstalled(platform: 'ios' | 'android' | 'macos' | 'windows') {
  await setUserTags({
    passpoint_installed: 'true',
    passpoint_platform: platform,
    passpoint_date: new Date().toISOString().split('T')[0],
  });
}
