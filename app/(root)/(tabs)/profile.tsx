import { useUser } from "@clerk/clerk-expo";
import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InputField from "@/components/InputField";

const Profile = () => {
  const { user } = useUser();

  const firstName =
    user?.firstName || (user?.fullName ? user.fullName.split(" ")[0] : "Aasim");
  const lastName =
    user?.lastName ||
    (user?.fullName && user.fullName.split(" ").length > 1
      ? user.fullName.split(" ").slice(1).join(" ")
      : "Nadaf");
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "aasim@example.com";
  const phone =
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.phoneNumbers?.[0]?.phoneNumber ||
    "+1 (555) 234-5678";
  const avatarUrl =
    user?.imageUrl ||
    user?.externalAccounts?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-JakartaBold my-5">My profile</Text>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
            className="rounded-full h-[110px] w-[110px] border-[3px] border-[#0286FF] shadow-sm shadow-neutral-300"
          />
          <Text className="text-xl font-JakartaBold text-neutral-800 mt-3">
            {firstName} {lastName}
          </Text>
          <Text className="text-sm font-JakartaMedium text-neutral-500">
            {email}
          </Text>
        </View>

        <View className="flex flex-col items-start justify-center bg-general-500 rounded-2xl shadow-sm px-5 py-4">
          <View className="flex flex-col items-start justify-start w-full">
            <InputField
              label="First name"
              placeholder={firstName}
              containerStyle="w-full mb-3"
              inputStyle="p-3.5 bg-white"
              editable={false}
            />

            <InputField
              label="Last name"
              placeholder={lastName}
              containerStyle="w-full mb-3"
              inputStyle="p-3.5 bg-white"
              editable={false}
            />

            <InputField
              label="Email"
              placeholder={email}
              containerStyle="w-full mb-3"
              inputStyle="p-3.5 bg-white"
              editable={false}
            />

            <InputField
              label="Phone"
              placeholder={phone}
              containerStyle="w-full"
              inputStyle="p-3.5 bg-white"
              editable={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
