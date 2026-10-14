import React, { useEffect, useState, useRef } from "react";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
  getRoute,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const defaultDrivers: Driver[] = [
  {
    id: 1,
    first_name: "James",
    last_name: "Wilson",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a2dc52b2-9641-45da-80e9-08147151257f/-/preview/465x466/",
    car_seats: 4,
    rating: 4.8,
  },
  {
    id: 2,
    first_name: "David",
    last_name: "Brown",
    profile_image_url:
      "https://ucarecdn.com/6ea6d83d-ef1a-4838-8064-530a3eaec629/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x933/",
    car_seats: 5,
    rating: 4.6,
  },
  {
    id: 3,
    first_name: "Michael",
    last_name: "Johnson",
    profile_image_url:
      "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x618/",
    car_seats: 4,
    rating: 4.7,
  },
  {
    id: 4,
    first_name: "Robert",
    last_name: "Miller",
    profile_image_url:
      "https://ucarecdn.com/5ea35190-34f6-425e-9707-9ef4704164a4/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/530a701a-ae33-43b0-88eb-5e6670d04bb7/-/preview/1000x666/",
    car_seats: 4,
    rating: 4.9,
  },
];

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { selectedDriver, setDrivers } = useDriverStore();

  const { data: driversData } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // 1. Populate markers when drivers or user location is available
  useEffect(() => {
    const driversList =
      Array.isArray(driversData) && driversData.length > 0
        ? driversData
        : defaultDrivers;

    const lat = userLatitude || 37.78825;
    const lng = userLongitude || -122.4324;

    const newMarkers = generateMarkersFromData({
      data: driversList,
      userLatitude: lat,
      userLongitude: lng,
    });

    setMarkers(newMarkers);
  }, [driversData, userLatitude, userLongitude]);

  // 2. Calculate driver times and prices whenever destination and markers are ready
  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude != null &&
      destinationLongitude != null
    ) {
      calculateDriverTimes({
        markers,
        userLatitude: userLatitude || 37.78825,
        userLongitude: userLongitude || -122.4324,
        destinationLatitude,
        destinationLongitude,
      }).then((driversWithTimes) => {
        if (driversWithTimes && driversWithTimes.length > 0) {
          setDrivers(driversWithTimes);
        }
      });
    }
  }, [
    markers,
    destinationLatitude,
    destinationLongitude,
    userLatitude,
    userLongitude,
    setDrivers,
  ]);

  // 3. Fetch route coordinates and fit map when destination is set
  useEffect(() => {
    const originLat = userLatitude || 37.78825;
    const originLng = userLongitude || -122.4324;

    if (destinationLatitude != null && destinationLongitude != null) {
      getRoute({
        originLatitude: originLat,
        originLongitude: originLng,
        destinationLatitude,
        destinationLongitude,
      }).then((route) => {
        if (route.coordinates && route.coordinates.length > 0) {
          setRouteCoordinates(route.coordinates);
          if (mapRef.current && route.coordinates.length > 1) {
            mapRef.current.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
              animated: true,
            });
          }
        }
      });
    } else {
      setRouteCoordinates([]);
    }
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude]);

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      tintColor="black"
      mapType="mutedStandard"
      showsPointsOfInterest={false}
      initialRegion={region}
      region={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedDriver === +marker.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}

      {destinationLatitude != null && destinationLongitude != null && (
        <>
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
            image={icons.pin}
          />
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#0286FF"
              strokeWidth={3}
            />
          )}
        </>
      )}
    </MapView>
  );
};

export default Map;
