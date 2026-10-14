import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

interface SuggestionItem {
  id: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  latitude?: number;
  longitude?: number;
  isGoogle: boolean;
}

const googlePlacesApiKey = process.env.EXPO_PUBLIC_PLACES_API_KEY;
const geoapifyApiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle = "",
  textInputBackgroundColor = "white",
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState(initialLocation || "");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setQuery(initialLocation);
    }
  }, [initialLocation]);

  const searchPlaces = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    // 1. Try Google Places API (New)
    if (googlePlacesApiKey) {
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": googlePlacesApiKey,
            },
            body: JSON.stringify({
              input: text,
            }),
          },
        );

        const data = await response.json();
        if (data.suggestions && data.suggestions.length > 0) {
          const formatted: SuggestionItem[] = data.suggestions.map(
            (item: any) => ({
              id: item.placePrediction.placeId,
              mainText:
                item.placePrediction.structuredFormat?.mainText?.text ||
                item.placePrediction.text?.text,
              secondaryText:
                item.placePrediction.structuredFormat?.secondaryText?.text ||
                "",
              fullText: item.placePrediction.text?.text || "",
              isGoogle: true,
            }),
          );

          setSuggestions(formatted);
          setIsOpen(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Google Places API (New) failed, trying Geoapify:", err);
      }
    }

    // 2. Fallback to Geoapify Autocomplete
    if (geoapifyApiKey) {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            text,
          )}&apiKey=${geoapifyApiKey}`,
        );

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const formatted: SuggestionItem[] = data.features.map(
            (f: any, idx: number) => ({
              id: f.properties.place_id || `geo-${idx}`,
              mainText:
                f.properties.address_line1 ||
                f.properties.name ||
                f.properties.city ||
                f.properties.formatted,
              secondaryText:
                f.properties.address_line2 ||
                (f.properties.city
                  ? `${f.properties.city}, ${f.properties.country}`
                  : f.properties.country || ""),
              fullText: f.properties.formatted,
              latitude: f.properties.lat,
              longitude: f.properties.lon,
              isGoogle: false,
            }),
          );

          setSuggestions(formatted);
          setIsOpen(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Geoapify Autocomplete failed:", err);
      }
    }

    setSuggestions([]);
    setLoading(false);
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPlaces(text);
    }, 250);
  };

  const handleSelectSuggestion = async (item: SuggestionItem) => {
    setIsOpen(false);
    setQuery(item.mainText);

    let latitude = item.latitude;
    let longitude = item.longitude;
    let address = item.fullText || item.mainText;

    // If item is from Google, fetch place coordinates
    if (item.isGoogle && googlePlacesApiKey) {
      try {
        setLoading(true);
        const detailRes = await fetch(
          `https://places.googleapis.com/v1/places/${item.id}?fields=id,displayName,location,formattedAddress`,
          {
            headers: {
              "X-Goog-Api-Key": googlePlacesApiKey,
            },
          },
        );
        const detailData = await detailRes.json();
        if (detailData.location) {
          latitude = detailData.location.latitude;
          longitude = detailData.location.longitude;
        }
        if (detailData.formattedAddress) {
          address = detailData.formattedAddress;
        }
      } catch (err) {
        console.warn("Failed to fetch Google Place details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (latitude != null && longitude != null) {
      handlePress({
        latitude,
        longitude,
        address,
      });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <View className={`relative z-50 w-full ${containerStyle}`}>
      <View
        className="flex flex-row items-center justify-between px-4 py-3 rounded-xl"
        style={{
          backgroundColor:
            textInputBackgroundColor === "transparent"
              ? "transparent"
              : textInputBackgroundColor,
        }}
      >
        <Image
          source={icon || icons.search}
          className="w-5 h-5 mr-3"
          resizeMode="contain"
        />

        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder={initialLocation || "Where do you want to go?"}
          placeholderTextColor="#9ca3af"
          className="flex-1 text-base font-JakartaMedium text-neutral-800"
          autoCorrect={false}
        />

        {loading ? (
          <ActivityIndicator size="small" color="#0286FF" className="ml-2" />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} className="ml-2 p-1">
            <Image
              source={icons.close}
              className="w-4 h-4 tint-neutral-500"
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {isOpen && suggestions.length > 0 && (
        <View className="absolute top-[52px] left-0 right-0 bg-white rounded-xl shadow-lg border border-neutral-100 z-50 max-h-60 overflow-hidden">
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectSuggestion(item)}
                className="flex flex-row items-center px-4 py-3 border-b border-neutral-100 active:bg-neutral-50"
              >
                <Image
                  source={icons.pin}
                  className="w-5 h-5 mr-3"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text
                    className="text-sm font-JakartaSemiBold text-neutral-800"
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      className="text-xs font-JakartaRegular text-neutral-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;
