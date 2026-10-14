import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;
const geoapifyAPI = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.4, 0.01);

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

/**
 * Decodes a Google encoded polyline string into an array of { latitude, longitude }
 */
export function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

/**
 * Calculates Haversine distance in kilometers between two points
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes route coordinates and duration between two coordinates using
 * Google Routes API v2, with fallback to Geoapify Routing API and Haversine estimation.
 */
export const getRoute = async ({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}): Promise<{
  coordinates: { latitude: number; longitude: number }[];
  duration: number; // in seconds
  distance: number; // in meters
}> => {
  // 1. Try Google Routes API v2
  if (directionsAPI) {
    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": directionsAPI,
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: originLatitude,
                  longitude: originLongitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destinationLatitude,
                  longitude: destinationLongitude,
                },
              },
            },
            travelMode: "DRIVE",
          }),
        },
      );

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const durationSec = route.duration
          ? parseInt(route.duration.replace("s", ""), 10)
          : 0;
        const distanceM = route.distanceMeters || 0;
        const coordinates = route.polyline?.encodedPolyline
          ? decodePolyline(route.polyline.encodedPolyline)
          : [];

        if (coordinates.length > 0) {
          return { coordinates, duration: durationSec, distance: distanceM };
        }
      }
    } catch (err) {
      console.warn("Google Routes API failed, trying Geoapify:", err);
    }
  }

  // 2. Try Geoapify Routing API
  if (geoapifyAPI) {
    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${originLatitude},${originLongitude}|${destinationLatitude},${destinationLongitude}&mode=drive&apiKey=${geoapifyAPI}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const durationSec = Math.round(feature.properties?.time || 0);
        const distanceM = Math.round(feature.properties?.distance || 0);
        const rawCoords =
          feature.geometry?.coordinates?.[0] ||
          feature.geometry?.coordinates ||
          [];
        const coordinates = rawCoords.map((pt: [number, number]) => ({
          latitude: pt[1],
          longitude: pt[0],
        }));

        if (coordinates.length > 0) {
          return { coordinates, duration: durationSec, distance: distanceM };
        }
      }
    } catch (err) {
      console.warn("Geoapify Routing API failed:", err);
    }
  }

  // 3. Fallback: Direct line and Haversine formula
  const distKm = calculateDistance(
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
  );
  const estSeconds = Math.max(60, Math.round((distKm / 35) * 3600));

  return {
    coordinates: [
      { latitude: originLatitude, longitude: originLongitude },
      { latitude: destinationLatitude, longitude: destinationLongitude },
    ],
    duration: estSeconds,
    distance: Math.round(distKm * 1000),
  };
};

/**
 * Calculates estimated pickup and trip times and prices for each driver.
 * Guaranteed to return an array of MarkerData with time and price populated.
 */
export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}): Promise<MarkerData[]> => {
  if (!markers || markers.length === 0) return [];

  const originLat = userLatitude || 37.78825;
  const originLng = userLongitude || -122.4324;
  const destLat = destinationLatitude || originLat + 0.02;
  const destLng = destinationLongitude || originLng + 0.02;

  try {
    // 1. Calculate time from user to destination once
    let timeToDestination = 0;
    try {
      const destRoute = await getRoute({
        originLatitude: originLat,
        originLongitude: originLng,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
      });
      timeToDestination = destRoute.duration;
    } catch {
      const dist = calculateDistance(originLat, originLng, destLat, destLng);
      timeToDestination = (dist / 35) * 3600;
    }

    // 2. For each driver, calculate time to reach user
    const timesPromises = markers.map(async (marker) => {
      let timeToUser = 0;
      try {
        const distToUser = calculateDistance(
          marker.latitude,
          marker.longitude,
          originLat,
          originLng,
        );
        timeToUser = Math.max(120, Math.round((distToUser / 30) * 3600));
      } catch {
        timeToUser = 300;
      }

      const totalMinutes = Math.max(
        3,
        Math.round((timeToUser + timeToDestination) / 60),
      );
      const price = (totalMinutes * 0.5 + 2.5).toFixed(2);

      return {
        ...marker,
        time: totalMinutes,
        price,
      };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
    return markers.map((marker, index) => {
      const fallbackMinutes = 10 + index * 3;
      return {
        ...marker,
        time: fallbackMinutes,
        price: (fallbackMinutes * 0.5 + 2.5).toFixed(2),
      };
    });
  }
};
