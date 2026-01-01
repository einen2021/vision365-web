"use client";

import { useState, useEffect, useRef } from "react";
import { BaseScreen } from "@/components/common/BaseScreen";
import { StatusCard } from "@/components/ui/StatusCard";
import { ActionButtons } from "@/components/ui/ActionButtons";
import { Card } from "@/components/ui/Card";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import {
  firestoreCommunities,
  firestoreBuildings,
  firestoreAlarms,
  firestoreMessages,
  firestoreActions,
  firestoreListeners,
  firestoreAlarmReasons,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectItem } from "@/components/ui/Select";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AlertTriangle, Bug, ShieldAlert, Flag } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBuildingCollectionName } from "@/lib/firestore";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface Message {
  id: string;
  message: string;
  timestamp: string;
  type: string;
  alarmReason?: {
    alarmType: "False Alarm" | "Actual Alarm";
    reason?: string;
  };
}

export default function DashboardPage() {
  const [selectedCommunity, setSelectedCommunity] = useState("All");
  const [selectedBuilding, setSelectedBuilding] = useState("All");
  const [communities, setCommunities] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [fireCount, setFireCount] = useState(0);
  const [troubleCount, setTroubleCount] = useState(0);
  const [supervisoryCount, setSupervisoryCount] = useState(0);
  const [fireBlinking, setFireBlinking] = useState(false);
  const [troubleBlinking, setTroubleBlinking] = useState(false);
  const [supervisoryBlinking, setSupervisoryBlinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actions, setActions] = useState({
    ack: false,
    reset: false,
    sAck: false,
    tAck: false,
    silence: false,
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Live data states
  const [liveAlarmData, setLiveAlarmData] = useState<any>(null);
  const [liveTroubleData, setLiveTroubleData] = useState<any>(null);
  const [liveSupervisoryData, setLiveSupervisoryData] = useState<any>(null);
  const [showLiveData, setShowLiveData] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);
  const [loadingLiveData, setLoadingLiveData] = useState(false);

  // Refs to track previous values for blinking
  const prevFireCount = useRef(0);
  const prevTroubleCount = useRef(0);
  const prevSupervisoryCount = useRef(0);
  const [buildingChanged, setBuildingChanged] = useState(false);

  // Alarm flagging states
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [alarmType, setAlarmType] = useState<"False Alarm" | "Actual Alarm">(
    "False Alarm"
  );
  const [alarmReason, setAlarmReason] = useState("");
  const [savingReason, setSavingReason] = useState(false);
  const [messageReasons, setMessageReasons] = useState<Record<string, any>>({});

  const { user } = useAuth();

  // Building name mapping function
  const mapBuildingName = (buildingName: string) => {
    const mappings: Record<string, string> = {
      "EMERALD PALM": "THEMORA",
      "EMERALD PALMBuildingDB": "THEMORA",
    };
    return mappings[buildingName] || buildingName;
  };

  // Fetch communities
  useEffect(() => {
    fetchCommunities();
  }, []);

  // Fetch buildings when community changes
  useEffect(() => {
    fetchBuildings();
    // Reset building selection when community changes
    if (selectedCommunity !== "All") {
      setSelectedBuilding("All");
      setBuildingChanged(true);
    }
  }, [selectedCommunity, user?.email]);

  // Handle building change
  useEffect(() => {
    if (selectedBuilding !== "All") {
      setBuildingChanged(true);
      // Clear live data when building changes
      setLiveAlarmData(null);
      setLiveTroubleData(null);
      setLiveSupervisoryData(null);
      setShowLiveData(false);
      setSelectedCardType(null);
      setLoadingLiveData(false);
    }
  }, [selectedBuilding]);

  // Reset building changed flag and update previous values
  useEffect(() => {
    if (buildingChanged) {
      prevFireCount.current = fireCount;
      prevTroubleCount.current = troubleCount;
      prevSupervisoryCount.current = supervisoryCount;

      const timeout = setTimeout(() => {
        setBuildingChanged(false);
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [buildingChanged, fireCount, troubleCount, supervisoryCount]);

  // Effect to check for value changes and trigger blinking
  useEffect(() => {
    // Only check for changes if building selection hasn't changed
    if (!buildingChanged) {
      // Check if fire count changed
      if (prevFireCount.current !== fireCount && prevFireCount.current !== 0) {
        setFireBlinking(true);
        setTimeout(() => setFireBlinking(false), 3000);
      }
      // Check if trouble count changed
      if (
        prevTroubleCount.current !== troubleCount &&
        prevTroubleCount.current !== 0
      ) {
        setTroubleBlinking(true);
        setTimeout(() => setTroubleBlinking(false), 3000);
      }
      // Check if supervisory count changed
      if (
        prevSupervisoryCount.current !== supervisoryCount &&
        prevSupervisoryCount.current !== 0
      ) {
        setSupervisoryBlinking(true);
        setTimeout(() => setSupervisoryBlinking(false), 3000);
      }
    }

    // Update previous values
    prevFireCount.current = fireCount;
    prevTroubleCount.current = troubleCount;
    prevSupervisoryCount.current = supervisoryCount;
  }, [fireCount, troubleCount, supervisoryCount, buildingChanged]);

  const fetchCommunities = async () => {
    setLoadingCommunities(true);
    try {
      const communitiesData = await firestoreCommunities.getAll();
      // Store both ID and name for proper filtering
      const communityList = communitiesData.map((c: any) => ({
        id: c.id || c.communityId,
        name: c.communityName || c.name || c.id,
        displayName: c.communityName || c.name || c.id,
      }));

      setCommunities([
        "All",
        ...(communityList.map((c: any) => c.displayName) || []),
      ]);

      // Store full community data for filtering
      (window as any).__communitiesData = communityList;
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      if (user?.email) {
        // Use the selected community identifier (name or ID)
        const buildingsData =
          await firestoreBuildings.getAllFromUserByCommunity(
            user.email,
            selectedCommunity
          );
        setBuildings(["All", ...(buildingsData || [])]);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const fetchAlarmData = async () => {
    if (selectedBuilding === "All") {
      setFireCount(0);
      setTroubleCount(0);
      setSupervisoryCount(0);
      setLoadingAlarms(false);
      return;
    }

    setLoadingAlarms(true);

    try {
      const alarmData = await firestoreAlarms.getAlarmDetails(selectedBuilding);

      setFireCount(alarmData.fire);
      setTroubleCount(alarmData.trouble);
      setSupervisoryCount(alarmData.supervisory);
    } catch (error) {
      console.error("Error fetching alarm data:", error);
    } finally {
      setLoadingAlarms(false);
    }
  };

  // Fetch live fire alarm data
  const fetchLiveAlarmData = async () => {
    if (selectedBuilding === "All" || !db) return;

    try {
      const collectionName = getBuildingCollectionName(selectedBuilding);
      const messagesRef = doc(db, collectionName, "alarmMessage");
      const messagesDoc = await getDoc(messagesRef);

      if (messagesDoc.exists()) {
        const data = messagesDoc.data();
        const allMessages = data.alarmMessage || data.messages || [];

        // Filter fire messages (typically messages with fire-related content)
        const fireMessages = allMessages
          .filter((msg: any) => {
            const messageText = (msg.message || "").toLowerCase();
            return (
              messageText.includes("fire") || messageText.includes("alarm")
            );
          })
          .map((msg: any) => ({
            buildingName: mapBuildingName(selectedBuilding),
            time: msg.time,
            formattedTime: new Date(msg.time).toLocaleString(),
            message: msg.message,
          }))
          .sort((a: any, b: any) => b.time - a.time);

        setLiveAlarmData({
          buildingName: mapBuildingName(selectedBuilding),
          totalFireCount: fireMessages.length,
          fireMessages,
        });
      }
    } catch (error) {
      console.error("Error fetching live fire alarm data:", error);
    }
  };

  // Fetch live trouble data
  const fetchLiveTroubleData = async () => {
    if (selectedBuilding === "All" || !db) return;

    try {
      const collectionName = getBuildingCollectionName(selectedBuilding);
      const messagesRef = doc(db, collectionName, "alarmMessage");
      const messagesDoc = await getDoc(messagesRef);

      if (messagesDoc.exists()) {
        const data = messagesDoc.data();
        const allMessages = data.alarmMessage || data.messages || [];

        // Filter trouble messages
        const troubleMessages = allMessages
          .filter((msg: any) => {
            const messageText = (msg.message || "").toLowerCase();
            return (
              messageText.includes("trouble") || messageText.includes("fault")
            );
          })
          .map((msg: any) => ({
            buildingName: mapBuildingName(selectedBuilding),
            time: msg.time,
            formattedTime: new Date(msg.time).toLocaleString(),
            message: msg.message,
          }))
          .sort((a: any, b: any) => b.time - a.time);

        setLiveTroubleData({
          buildingName: mapBuildingName(selectedBuilding),
          totalTroubleCount: troubleMessages.length,
          troubleMessages,
        });
      }
    } catch (error) {
      console.error("Error fetching live trouble data:", error);
    }
  };

  // Fetch live supervisory data
  const fetchLiveSupervisoryData = async () => {
    if (selectedBuilding === "All" || !db) return;

    try {
      const collectionName = getBuildingCollectionName(selectedBuilding);
      const messagesRef = doc(db, collectionName, "alarmMessage");
      const messagesDoc = await getDoc(messagesRef);

      if (messagesDoc.exists()) {
        const data = messagesDoc.data();
        const allMessages = data.alarmMessage || data.messages || [];

        // Filter supervisory messages
        const supervisoryMessages = allMessages
          .filter((msg: any) => {
            const messageText = (msg.message || "").toLowerCase();
            return (
              messageText.includes("supervisory") ||
              messageText.includes("supervise")
            );
          })
          .map((msg: any) => ({
            buildingName: mapBuildingName(selectedBuilding),
            time: msg.time,
            formattedTime: new Date(msg.time).toLocaleString(),
            message: msg.message,
          }))
          .sort((a: any, b: any) => b.time - a.time);

        setLiveSupervisoryData({
          buildingName: mapBuildingName(selectedBuilding),
          totalSupervisoryCount: supervisoryMessages.length,
          supervisoryMessages,
        });
      }
    } catch (error) {
      console.error("Error fetching live supervisory data:", error);
    }
  };

  // Fetch all live data (for manual refresh)
  const fetchAllLiveData = async () => {
    if (selectedCardType === "fire") {
      await fetchLiveAlarmData();
    } else if (selectedCardType === "trouble") {
      await fetchLiveTroubleData();
    } else if (selectedCardType === "supervisory") {
      await fetchLiveSupervisoryData();
    }
  };

  // Handle card clicks
  const handleCardClick = async (cardType: string) => {
    if (selectedBuilding === "All") {
      alert("Please select a specific building to view live data");
      return;
    }

    // If clicking the same card, toggle it off
    if (selectedCardType === cardType) {
      setSelectedCardType(null);
      setShowLiveData(false);
      setLoadingLiveData(false);
      return;
    }

    // Set the selected card type and show loading
    setSelectedCardType(cardType);
    setShowLiveData(true);
    setLoadingLiveData(true);

    // Fetch the appropriate data based on card type
    try {
      switch (cardType) {
        case "fire":
          await fetchLiveAlarmData();
          break;
        case "trouble":
          await fetchLiveTroubleData();
          break;
        case "supervisory":
          await fetchLiveSupervisoryData();
          break;
      }
    } catch (error) {
      console.error("Error in handleCardClick:", error);
    } finally {
      setLoadingLiveData(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      if (selectedBuilding === "All") {
        // Fetch messages from all user's buildings
        if (user?.email) {
          const allBuildings = await firestoreBuildings.getAllFromUser(
            user.email
          );
          const allMessages: Message[] = [];

          // Fetch messages from each building
          for (const building of allBuildings) {
            try {
              const buildingMessages = await firestoreMessages.getMessages(
                building,
                1,
                1000
              );
              if (
                buildingMessages.messages &&
                buildingMessages.messages.length > 0
              ) {
                allMessages.push(...buildingMessages.messages);
              }
            } catch (error) {
              console.warn(
                `Error fetching messages for building ${building}:`,
                error
              );
            }
          }

          // Sort by timestamp (newest first)
          allMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
          });

          // Paginate
          const startIndex = (currentPage - 1) * 10;
          const endIndex = startIndex + 10;
          const paginatedMessages = allMessages.slice(startIndex, endIndex);

          setMessages(paginatedMessages);
          setTotalPages(Math.ceil(allMessages.length / 10));
        } else {
          setMessages([]);
          setTotalPages(1);
        }
      } else {
        const messagesData = await firestoreMessages.getMessages(
          selectedBuilding,
          currentPage,
          10
        );
        console.log("Messages data received:", messagesData);
        setMessages(messagesData.messages || []);
        setTotalPages(messagesData.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setTotalPages(1);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchBuildingActions = async () => {
    if (selectedBuilding === "All") {
      setActions({
        ack: false,
        reset: false,
        sAck: false,
        tAck: false,
        silence: false,
      });
      return;
    }

    try {
      const actionsData = await firestoreActions.getActions(selectedBuilding);
      setActions(actionsData);
    } catch (error) {
      console.error("Error fetching building actions:", error);
    }
  };

  // Real-time listeners instead of polling
  useEffect(() => {
    if (selectedBuilding === "All") {
      // For "All", just fetch messages periodically
      const interval = setInterval(() => {
        fetchMessages();
      }, 5000);
      return () => clearInterval(interval);
    }

    const unsubscribeAlarms = firestoreListeners.subscribeToAlarmDetails(
      selectedBuilding,
      (data) => {
        setFireCount(data.fire);
        setTroubleCount(data.trouble);
        setSupervisoryCount(data.supervisory);
      }
    );

    const unsubscribeMessages = firestoreListeners.subscribeToMessages(
      selectedBuilding,
      (allMessages) => {
        if (!allMessages || allMessages.length === 0) {
          setMessages([]);
          setTotalPages(1);
          return;
        }

        // Sort messages by time (newest first)
        const sortedMessages = [...allMessages].sort((a: any, b: any) => {
          const timeA = a.time || 0;
          const timeB = b.time || 0;
          return timeB - timeA;
        });

        const startIndex = (currentPage - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedMessages = sortedMessages.slice(startIndex, endIndex);

        setMessages(
          paginatedMessages.map((msg: any) => ({
            id: msg.time || Date.now(),
            message: msg.message || "",
            timestamp: new Date(msg.time || Date.now()).toISOString(),
            type: "alarm",
          }))
        );
        setTotalPages(Math.ceil(sortedMessages.length / 10));
        setLoadingMessages(false);
      }
    );

    return () => {
      unsubscribeAlarms();
      unsubscribeMessages();
    };
  }, [selectedBuilding, currentPage]);

  // Auto-refresh live data if it's currently shown
  useEffect(() => {
    if (showLiveData && selectedBuilding !== "All" && selectedCardType) {
      const interval = setInterval(() => {
        switch (selectedCardType) {
          case "fire":
            fetchLiveAlarmData();
            break;
          case "trouble":
            fetchLiveTroubleData();
            break;
          case "supervisory":
            fetchLiveSupervisoryData();
            break;
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [showLiveData, selectedBuilding, selectedCardType]);

  useEffect(() => {
    fetchAlarmData();
    fetchMessages();
    fetchBuildingActions();
    fetchAlarmReasons();
  }, [selectedCommunity, selectedBuilding, currentPage]);

  // Fetch alarm reasons for all messages
  const fetchAlarmReasons = async () => {
    if (selectedBuilding === "All") {
      setMessageReasons({});
      return;
    }

    try {
      const reasonsData = await firestoreAlarmReasons.getAllAlarmReasons(
        selectedBuilding
      );
      const reasonsMap: Record<string, any> = {};
      reasonsData.reasons.forEach((reason: any) => {
        reasonsMap[reason.messageId] = reason;
      });
      setMessageReasons(reasonsMap);
    } catch (error) {
      console.error("Error fetching alarm reasons:", error);
    }
  };

  // Handle flag button click
  const handleFlagClick = async (message: Message) => {
    setSelectedMessage(message);
    // Check if reason already exists
    if (messageReasons[message.id]) {
      const existingReason = messageReasons[message.id];
      setAlarmType(existingReason.alarmType);
      setAlarmReason(existingReason.reason || "");
    } else {
      setAlarmType("False Alarm");
      setAlarmReason("");
    }
    setShowFlagModal(true);
  };

  // Handle save alarm reason
  const handleSaveAlarmReason = async () => {
    if (!selectedMessage || selectedBuilding === "All") return;

    setSavingReason(true);
    try {
      await firestoreAlarmReasons.saveAlarmReason(
        selectedBuilding,
        selectedMessage.id,
        alarmType,
        alarmReason,
        selectedMessage.message,
        selectedMessage.timestamp,
        user?.email || "unknown"
      );

      // Update local state
      setMessageReasons({
        ...messageReasons,
        [selectedMessage.id]: {
          messageId: selectedMessage.id,
          alarmType,
          reason: alarmReason,
          messageText: selectedMessage.message,
          timestamp: selectedMessage.timestamp,
        },
      });

      setShowFlagModal(false);
      setSelectedMessage(null);
      setAlarmReason("");
    } catch (error) {
      console.error("Error saving alarm reason:", error);
      alert("Failed to save alarm reason. Please try again.");
    } finally {
      setSavingReason(false);
    }
  };

  // Pull-to-refresh
  usePullToRefresh({
    onRefresh: async () => {
      await fetchAlarmData();
      await fetchMessages();
      await fetchBuildingActions();
    },
    enabled: true,
  });

  const handleActionPress = async (action: string) => {
    if (selectedBuilding === "All") return;

    setLoadingAction(action);
    try {
      await firestoreActions.updateActions(selectedBuilding, action);
      await fetchBuildingActions();
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <ProtectedRoute>
      <BaseScreen
        title="Vision 365 Dashboard"
        subtitle="Fire & Safety Intelligence"
      >
        <div className="p-4 space-y-6 pb-24">
          {/* Selectors - Modal-based dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              {loadingCommunities && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <Select
                value={selectedCommunity}
                onValueChange={setSelectedCommunity}
                placeholder="Select Community"
                disabled={loadingCommunities}
              >
                {communities.map((community) => (
                  <SelectItem key={community} value={community}>
                    {community === "All" ? "All Communities" : community}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex-1 relative">
              {loadingBuildings && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <Select
                value={selectedBuilding}
                onValueChange={setSelectedBuilding}
                placeholder="Select Building"
                disabled={loadingBuildings}
              >
                {buildings.map((building) => (
                  <SelectItem key={building} value={building}>
                    {building === "All" ? "All Buildings" : building}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Status Cards - Horizontal Scroll */}
          {loadingAlarms ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                <LoadingSkeleton className="w-[130px] h-[120px]" count={3} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                <div
                  onClick={() => handleCardClick("fire")}
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    selectedCardType === "fire"
                      ? "ring-2 ring-blue-500 rounded-lg"
                      : ""
                  }`}
                >
                  <StatusCard
                    title="Fire"
                    count={fireCount}
                    icon="fire"
                    backgroundColor={fireCount > 0 ? "#ff5722" : "#ffffff"}
                    blinking={fireBlinking}
                  />
                </div>
                <div
                  onClick={() => handleCardClick("trouble")}
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    selectedCardType === "trouble"
                      ? "ring-2 ring-blue-500 rounded-lg"
                      : ""
                  }`}
                >
                  <StatusCard
                    title="Trouble"
                    count={troubleCount}
                    icon="trouble"
                    backgroundColor={troubleCount > 0 ? "#FFC107" : "#ffffff"}
                    blinking={troubleBlinking}
                  />
                </div>
                <div
                  onClick={() => handleCardClick("supervisory")}
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    selectedCardType === "supervisory"
                      ? "ring-2 ring-blue-500 rounded-lg"
                      : ""
                  }`}
                >
                  <StatusCard
                    title="Supervisory"
                    count={supervisoryCount}
                    icon="supervisory"
                    backgroundColor={
                      supervisoryCount > 0 ? "#FF9800" : "#ffffff"
                    }
                    blinking={supervisoryBlinking}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Refresh Live Data Button */}
          {selectedBuilding !== "All" && selectedCardType && (
            <div className="flex justify-end">
              <button
                onClick={fetchAllLiveData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Live Data
              </button>
            </div>
          )}

          {/* Live Data Display */}
          {showLiveData && selectedBuilding !== "All" && selectedCardType && (
            <div className="space-y-6">
              {loadingLiveData && (
                <Card>
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="lg" />
                      <span className="ml-2 text-gray-400">
                        Loading live data...
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Live Fire Messages */}
              {selectedCardType === "fire" && liveAlarmData && (
                <Card>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center text-gray-900">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        Live Fire Messages - {liveAlarmData.buildingName}
                        <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          {liveAlarmData.totalFireCount} messages
                        </span>
                      </h3>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Print
                      </button>
                    </div>
                    <div className="space-y-2">
                      {liveAlarmData.fireMessages.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                          No fire messages found.
                        </p>
                      ) : (
                        liveAlarmData.fireMessages.map(
                          (fire: any, index: number) => {
                            const messageId =
                              fire.time?.toString() ||
                              `${index}-${fire.message}`;
                            const reason = messageReasons[messageId];
                            return (
                              <Card key={index}>
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-white font-medium">
                                        {fire.buildingName ||
                                          liveAlarmData.buildingName}
                                      </p>
                                      <p className="text-gray-400 text-sm mt-1">
                                        {fire.formattedTime}
                                      </p>
                                      {reason && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 text-xs rounded ${
                                              reason.alarmType === "False Alarm"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {reason.alarmType}
                                          </span>
                                          {reason.reason && (
                                            <span className="text-xs text-gray-400">
                                              Reason: {reason.reason}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-red-600 font-medium">
                                        {fire.message}
                                      </p>
                                      <button
                                        onClick={() =>
                                          handleFlagClick({
                                            id: messageId,
                                            message: fire.message,
                                            timestamp: new Date(
                                              fire.time
                                            ).toISOString(),
                                            type: "fire",
                                          })
                                        }
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                        title="Flag Alarm"
                                      >
                                        <Flag
                                          className={`w-4 h-4 ${
                                            reason
                                              ? reason.alarmType ===
                                                "False Alarm"
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                              : "text-gray-400"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Live Trouble Data */}
              {selectedCardType === "trouble" && liveTroubleData && (
                <Card>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center text-gray-900">
                        <Bug className="h-5 w-5 text-red-500 mr-2" />
                        Live Trouble Messages - {liveTroubleData.buildingName}
                        <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          {liveTroubleData.totalTroubleCount} messages
                        </span>
                      </h3>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Print
                      </button>
                    </div>
                    <div className="space-y-2">
                      {liveTroubleData.troubleMessages.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                          No trouble messages found.
                        </p>
                      ) : (
                        liveTroubleData.troubleMessages.map(
                          (trouble: any, index: number) => {
                            const messageId =
                              trouble.time?.toString() ||
                              `${index}-${trouble.message}`;
                            const reason = messageReasons[messageId];
                            return (
                              <Card key={index}>
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-gray-900 font-medium">
                                        {trouble.buildingName ||
                                          liveTroubleData.buildingName}
                                      </p>
                                      <p className="text-gray-600 text-sm mt-1">
                                        {trouble.formattedTime}
                                      </p>
                                      {reason && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 text-xs rounded ${
                                              reason.alarmType === "False Alarm"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {reason.alarmType}
                                          </span>
                                          {reason.reason && (
                                            <span className="text-xs text-gray-600">
                                              Reason: {reason.reason}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-red-600 font-medium">
                                        {trouble.message}
                                      </p>
                                      <button
                                        onClick={() =>
                                          handleFlagClick({
                                            id: messageId,
                                            message: trouble.message,
                                            timestamp: new Date(
                                              trouble.time
                                            ).toISOString(),
                                            type: "trouble",
                                          })
                                        }
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                        title="Flag Alarm"
                                      >
                                        <Flag
                                          className={`w-4 h-4 ${
                                            reason
                                              ? reason.alarmType ===
                                                "False Alarm"
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                              : "text-gray-400"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Live Supervisory Data */}
              {selectedCardType === "supervisory" && liveSupervisoryData && (
                <Card>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center text-gray-900">
                        <ShieldAlert className="h-5 w-5 text-blue-500 mr-2" />
                        Live Supervisory Messages -{" "}
                        {liveSupervisoryData.buildingName}
                        <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {liveSupervisoryData.totalSupervisoryCount} messages
                        </span>
                      </h3>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Print
                      </button>
                    </div>
                    <div className="space-y-2">
                      {liveSupervisoryData.supervisoryMessages.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                          No supervisory messages found.
                        </p>
                      ) : (
                        liveSupervisoryData.supervisoryMessages.map(
                          (supervisory: any, index: number) => {
                            const messageId =
                              supervisory.time?.toString() ||
                              `${index}-${supervisory.message}`;
                            const reason = messageReasons[messageId];
                            return (
                              <Card key={index}>
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-gray-900 font-medium">
                                        {supervisory.buildingName ||
                                          liveSupervisoryData.buildingName}
                                      </p>
                                      <p className="text-gray-600 text-sm mt-1">
                                        {supervisory.formattedTime}
                                      </p>
                                      {reason && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 text-xs rounded ${
                                              reason.alarmType === "False Alarm"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {reason.alarmType}
                                          </span>
                                          {reason.reason && (
                                            <span className="text-xs text-gray-600">
                                              Reason: {reason.reason}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-blue-600 font-medium">
                                        {supervisory.message}
                                      </p>
                                      <button
                                        onClick={() =>
                                          handleFlagClick({
                                            id: messageId,
                                            message: supervisory.message,
                                            timestamp: new Date(
                                              supervisory.time
                                            ).toISOString(),
                                            type: "supervisory",
                                          })
                                        }
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                        title="Flag Alarm"
                                      >
                                        <Flag
                                          className={`w-4 h-4 ${
                                            reason
                                              ? reason.alarmType ===
                                                "False Alarm"
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                              : "text-gray-400"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Messages Section - Hide when showing live data */}
          {!showLiveData && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              {loadingMessages ? (
                <div className="space-y-2">
                  <LoadingSkeleton className="h-20 w-full" count={3} />
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <Card>
                      <p className="text-gray-600 text-center py-4">
                        No messages
                      </p>
                    </Card>
                  ) : (
                    messages.map((message) => {
                      const reason = messageReasons[message.id];
                      return (
                        <Card key={message.id}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-black font-medium">
                                {message.message}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                              {reason && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${
                                      reason.alarmType === "False Alarm"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {reason.alarmType}
                                  </span>
                                  {reason.reason && (
                                    <span className="text-xs text-gray-600">
                                      Reason: {reason.reason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                                {message.type}
                              </span>
                              {selectedBuilding !== "All" && (
                                <button
                                  onClick={() => handleFlagClick(message)}
                                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                                  title="Flag Alarm"
                                >
                                  <Flag
                                    className={`w-4 h-4 ${
                                      reason
                                        ? reason.alarmType === "False Alarm"
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed Bottom */}
        {selectedBuilding !== "All" && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
            <ActionButtons
              buildingName={selectedBuilding}
              actions={actions}
              onActionPress={handleActionPress}
              loading={loadingAction}
            />
          </div>
        )}

        {/* Flag Alarm Modal */}
        <Modal
          isOpen={showFlagModal}
          onClose={() => {
            setShowFlagModal(false);
            setSelectedMessage(null);
            setAlarmReason("");
          }}
          title="Flag Alarm"
          size="md"
        >
          <div className="space-y-4">
            {selectedMessage && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Alert Message:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMessage.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alarm Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="alarmType"
                        value="False Alarm"
                        checked={alarmType === "False Alarm"}
                        onChange={(e) =>
                          setAlarmType(
                            e.target.value as "False Alarm" | "Actual Alarm"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">False Alarm</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="alarmType"
                        value="Actual Alarm"
                        checked={alarmType === "Actual Alarm"}
                        onChange={(e) =>
                          setAlarmType(
                            e.target.value as "False Alarm" | "Actual Alarm"
                          )
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Actual Alarm
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={alarmReason}
                    onChange={(e) => setAlarmReason(e.target.value)}
                    placeholder="Enter reason for flagging this alarm..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowFlagModal(false);
                      setSelectedMessage(null);
                      setAlarmReason("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={savingReason}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAlarmReason}
                    disabled={savingReason}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingReason ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </BaseScreen>
    </ProtectedRoute>
  );
}
