/**
 * ==============================================================================
 * LOCATION HELPER (BROWSER GEOLOCATION & REVERSE GEOCODING)
 * ==============================================================================
 */

let cachedLocation = null;
let lastFetchTime = 0;

export async function getCurrentLocationName() {
  const now = Date.now();
  // Return cached location if fetched within the last 5 minutes
  if (cachedLocation && (now - lastFetchTime < 300000)) {
    return cachedLocation;
  }

  if (!navigator.geolocation) {
    return 'Sài Gòn';
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`,
            { signal: AbortSignal.timeout(3500) }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const district = addr.suburb || addr.city_district || addr.district || addr.quarter || addr.town;
            const city = addr.city || addr.state || addr.province;

            let result = 'Sài Gòn';
            if (district && city) {
              result = `${district}, ${city}`;
            } else if (city) {
              result = city;
            } else if (data.name) {
              result = data.name;
            } else {
              result = 'Việt Nam';
            }

            cachedLocation = result;
            lastFetchTime = Date.now();
            resolve(result);
            return;
          }
        } catch (e) {
          // Fallback silently if reverse geocoding fails
        }
        resolve('Sài Gòn');
      },
      () => {
        // User denied permission or timeout -> fallback gracefully
        resolve('Sài Gòn');
      },
      { timeout: 4000, maximumAge: 300000, enableHighAccuracy: false }
    );
  });
}
