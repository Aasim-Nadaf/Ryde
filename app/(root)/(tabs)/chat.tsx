import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { icons } from "@/constants";

interface ChatThread {
  id: number;
  driverName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  car: string;
}

const mockThreads: ChatThread[] = [
  {
    id: 1,
    driverName: "James Wilson",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    lastMessage:
      "I've arrived at the pickup location outside Financial District.",
    time: "10:45 AM",
    unread: 1,
    car: "Tesla Model 3 • White",
  },
  {
    id: 2,
    driverName: "David Brown",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    lastMessage: "Thanks for riding with Ryde! Have a great day.",
    time: "Yesterday",
    unread: 0,
    car: "Toyota Camry • Black",
  },
  {
    id: 3,
    driverName: "Michael Johnson",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    lastMessage: "I'm 3 minutes away in the silver Honda Civic.",
    time: "Oct 12",
    unread: 0,
    car: "Honda Civic • Silver",
  },
  {
    id: 4,
    driverName: "Robert Miller",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    lastMessage: "Confirmed your destination at Palace of Fine Arts.",
    time: "Oct 11",
    unread: 0,
    car: "Hyundai Ioniq • Blue",
  },
];

const Chat = () => {
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [messageText, setMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState<{
    [key: number]: { sender: string; text: string; time: string }[];
  }>({
    1: [
      {
        sender: "driver",
        text: "Hello! I am on my way to your pickup location.",
        time: "10:40 AM",
      },
      {
        sender: "user",
        text: "Great, I'm waiting outside the main lobby.",
        time: "10:42 AM",
      },
      {
        sender: "driver",
        text: "I've arrived at the pickup location outside Financial District.",
        time: "10:45 AM",
      },
    ],
    2: [
      {
        sender: "user",
        text: "Are you on the north or south side of the street?",
        time: "5:30 PM",
      },
      {
        sender: "driver",
        text: "South side, near the corner bakery.",
        time: "5:31 PM",
      },
      {
        sender: "driver",
        text: "Thanks for riding with Ryde! Have a great day.",
        time: "6:15 PM",
      },
    ],
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat) return;

    const newMsg = {
      sender: "user",
      text: messageText.trim(),
      time: "Just now",
    };

    setChatMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
    }));

    setMessageText("");
  };

  if (activeChat) {
    const messages = chatMessages[activeChat.id] || [
      { sender: "driver", text: activeChat.lastMessage, time: activeChat.time },
    ];

    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Chat Header */}
        <View className="flex flex-row items-center justify-between px-5 py-3 border-b border-neutral-100">
          <View className="flex flex-row items-center">
            <TouchableOpacity
              onPress={() => setActiveChat(null)}
              className="mr-3 p-1"
            >
              <Image
                source={icons.backArrow}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Image
              source={{ uri: activeChat.avatar }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View>
              <Text className="text-base font-JakartaBold text-neutral-800">
                {activeChat.driverName}
              </Text>
              <Text className="text-xs font-JakartaMedium text-neutral-500">
                {activeChat.car}
              </Text>
            </View>
          </View>
        </View>

        {/* Message Thread */}
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((m, idx) => (
            <View
              key={idx}
              className={`flex flex-col mb-4 ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <View
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  m.sender === "user"
                    ? "bg-[#0286FF] rounded-tr-none"
                    : "bg-neutral-100 rounded-tl-none"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${
                    m.sender === "user" ? "text-white" : "text-neutral-800"
                  }`}
                >
                  {m.text}
                </Text>
              </View>
              <Text className="text-[10px] font-JakartaRegular text-neutral-400 mt-1">
                {m.time}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View className="flex flex-row items-center px-4 py-3 border-t border-neutral-100 bg-white">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-neutral-100 px-4 py-2.5 rounded-full font-JakartaMedium text-sm text-neutral-800 mr-3"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="bg-[#0286FF] w-10 h-10 rounded-full items-center justify-center"
          >
            <Image
              source={icons.point}
              className="w-4 h-4 tint-white"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <Text className="text-2xl font-JakartaBold my-5">Messages</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {mockThreads.map((thread) => (
          <TouchableOpacity
            key={thread.id}
            onPress={() => setActiveChat(thread)}
            className="flex flex-row items-center py-4 border-b border-neutral-100 active:bg-neutral-50"
          >
            <Image
              source={{ uri: thread.avatar }}
              className="w-14 h-14 rounded-full mr-4"
            />
            <View className="flex-1">
              <View className="flex flex-row items-center justify-between mb-1">
                <Text className="text-base font-JakartaSemiBold text-neutral-800">
                  {thread.driverName}
                </Text>
                <Text className="text-xs font-JakartaRegular text-neutral-400">
                  {thread.time}
                </Text>
              </View>
              <Text className="text-xs font-JakartaRegular text-neutral-500 mb-1">
                {thread.car}
              </Text>
              <Text
                className="text-sm font-JakartaMedium text-neutral-600"
                numberOfLines={1}
              >
                {thread.lastMessage}
              </Text>
            </View>
            {thread.unread > 0 && (
              <View className="bg-[#0286FF] w-5 h-5 rounded-full items-center justify-center ml-2">
                <Text className="text-white text-[11px] font-JakartaBold">
                  {thread.unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Chat;
