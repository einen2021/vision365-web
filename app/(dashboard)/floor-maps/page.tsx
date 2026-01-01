"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BaseScreen } from "@/components/common/BaseScreen";
import { Card } from "@/components/ui/Card";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { MapPin, Activity, Wifi, WifiOff, ImageIcon } from "lucide-react";
import {
  firestoreCommunities,
  firestoreBuildings,
  firestoreFloorMaps,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { onSnapshot, collection, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectItem } from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Asset {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  activity: number;
  customImageUrl?: string;
  assetName?: string;
  locationIndex?: number;
}

interface FloorMap {
  name: string;
  imageUrl: string;
  assets: Asset[];
  assetMappings?: Record<string, Record<string, any[]>>;
  floorPlanName?: string;
}

interface AssetMapping {
  id: string;
  x: number;
  y: number;
  naturalX: number;
  naturalY: number;
  active: number;
  category: string;
  assetName: string;
  locationIndex: number;
  customImageUrl?: string;
}

// Category Icons Dictionary
const CATEGORY_ICONS: Record<string, string> = {
  "AIR CURTIN": "/icons/air-curtain-icon-design-free-vector.jpg",
  ACAHU: "/icons/AIR-handle.png",
  CCUI: "/icons/control-unit.png",
  ACCDU: "/icons/chemical.png",
  ACCH: "/icons/chillers.png",
  ACCHWP: "/icons/pump.png",
  ACFAHU: "/icons/air-handlng unit.png",
  "FAN COIL": "/icons/fan.png",
  DEFAULT: "/icons/default.png",
};

const getIconForCategory = (
  category: string,
  customImageUrl?: string | null
) => {
  if (customImageUrl) {
    return customImageUrl;
  }
  return CATEGORY_ICONS[category] || CATEGORY_ICONS["DEFAULT"];
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  if (target.src !== CATEGORY_ICONS["DEFAULT"]) {
    target.src = CATEGORY_ICONS["DEFAULT"];
  }
};

const getRadarColor = (activeValue: number) => {
  if (activeValue <= 2) return "rgba(34, 197, 94, 0.6)"; // Green
  if (activeValue <= 7) return "rgba(234, 179, 8, 0.6)"; // Yellow
  return "rgba(239, 68, 68, 0.6)"; // Red
};

const getRadarBorderColor = (activeValue: number) => {
  if (activeValue <= 2) return "rgb(34, 197, 94)"; // Green
  if (activeValue <= 7) return "rgb(234, 179, 8)"; // Yellow
  return "rgb(239, 68, 68)"; // Red
};

const shouldAnimate = (activeValue: number) => {
  return activeValue > 2;
};

export default function FloorMapsPage() {
  const [selectedCommunity, setSelectedCommunity] = useState("All");
  const [selectedBuilding, setSelectedBuilding] = useState("All");
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [communities, setCommunities] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [floorMap, setFloorMap] = useState<FloorMap | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingFloorMap, setLoadingFloorMap] = useState(false);
  const [activeStatuses, setActiveStatuses] = useState<
    Record<string, { active: number; lastUpdated: string }>
  >({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const [actualImageDimensions, setActualImageDimensions] = useState({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Fetch buildings when community changes
  useEffect(() => {
    fetchBuildings();
    // Reset building and floor selection when community changes
    if (selectedCommunity !== "All") {
      setSelectedBuilding("All");
      setSelectedFloor("All");
    }
  }, [selectedCommunity, user?.email]);

  useEffect(() => {
    if (selectedBuilding !== "All") {
      fetchFloors();
    } else {
      setFloors([]);
      setFloorMap(null);
    }
  }, [selectedBuilding]);

  // Calculate image dimensions for proper asset positioning
  const calculateImageDimensions = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const containerRect = img.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth === 0 || naturalHeight === 0) return;

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY);

    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;

    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    setActualImageDimensions({
      width: displayedWidth,
      height: displayedHeight,
      offsetX: offsetX,
      offsetY: offsetY,
      naturalWidth: naturalWidth,
      naturalHeight: naturalHeight,
    });
  }, []);

  // Real-time listener for floor map and active status
  useEffect(() => {
    if (selectedFloor === "All" || selectedBuilding === "All") {
      setFloorMap(null);
      setLoadingFloorMap(false);
      setActiveStatuses({});
      setLastUpdate(null);
      return;
    }

    setLoadingFloorMap(true);
    const buildingName = selectedBuilding.endsWith("BuildingDB")
      ? selectedBuilding
      : `${selectedBuilding}BuildingDB`;

    if (!db) {
      console.error("Firestore not initialized");
      setLoadingFloorMap(false);
      return;
    }

    const floorMapRef = doc(
      db,
      "FloorMaps",
      buildingName,
      "floors",
      selectedFloor
    );
    const mappingsRef = collection(floorMapRef, "assetMappings");

    const unsubscribeFloor = onSnapshot(floorMapRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        // Get asset mappings
        const mappingsSnapshot = await getDocs(mappingsRef);

        // Process asset mappings similar to reference code structure
        const assetMappings: Record<string, Record<string, any[]>> = {};
        const assets: Asset[] = [];
        const initialActiveStatuses: Record<
          string,
          { active: number; lastUpdated: string }
        > = {};

        mappingsSnapshot.docs.forEach((mappingDoc) => {
          const mappingData = mappingDoc.data();
          const category = mappingData.category || "general";
          const assetName = mappingData.assetName || mappingDoc.id;

          if (!assetMappings[category]) {
            assetMappings[category] = {};
          }
          if (!assetMappings[category][assetName]) {
            assetMappings[category][assetName] = [];
          }

          const location = {
            id: mappingDoc.id,
            x: mappingData.x || 0,
            y: mappingData.y || 0,
            active: mappingData.active || 0,
            customImageUrl: mappingData.customImageUrl || null,
          };

          assetMappings[category][assetName].push(location);

          assets.push({
            id: mappingDoc.id,
            name: assetName,
            category: category,
            x: mappingData.x || 0,
            y: mappingData.y || 0,
            activity: mappingData.active || 0,
            customImageUrl: mappingData.customImageUrl,
          });

          initialActiveStatuses[mappingDoc.id] = {
            active: mappingData.active || 0,
            lastUpdated: new Date().toISOString(),
          };
        });

        setFloorMap({
          name: selectedFloor,
          floorPlanName: data.floorPlanName || selectedFloor,
          imageUrl: data.imageUrl || "",
          assets,
          assetMappings,
        });
        setActiveStatuses(initialActiveStatuses);
        setLastUpdate(new Date());
        setLoadingFloorMap(false);
      } else {
        setFloorMap(null);
        setActiveStatuses({});
        setLoadingFloorMap(false);
      }
    });

    // Listen to active status changes in real-time
    const unsubscribeMappings = onSnapshot(mappingsRef, (snapshot) => {
      const updatedStatuses: Record<
        string,
        { active: number; lastUpdated: string }
      > = {};

      snapshot.docs.forEach((mappingDoc) => {
        const data = mappingDoc.data();
        updatedStatuses[mappingDoc.id] = {
          active: data.active || 0,
          lastUpdated: new Date().toISOString(),
        };
      });

      setActiveStatuses(updatedStatuses);
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribeFloor();
      unsubscribeMappings();
      setLoadingFloorMap(false);
    };
  }, [selectedFloor, selectedBuilding]);

  const fetchCommunities = async () => {
    try {
      const communitiesData = await firestoreCommunities.getAll();
      const communityList = communitiesData.map((c: any) => ({
        id: c.id || c.communityId,
        name: c.communityName || c.name || c.id,
        displayName: c.communityName || c.name || c.id,
      }));
      setCommunities([
        "All",
        ...(communityList.map((c: any) => c.displayName) || []),
      ]);
      // Store for filtering
      (window as any).__communitiesData = communityList;
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      if (user?.email) {
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

  const fetchFloors = async () => {
    if (selectedBuilding === "All") {
      setFloors([]);
      setLoadingFloors(false);
      return;
    }

    setLoadingFloors(true);
    try {
      console.log("Fetching floors for building:", selectedBuilding);
      const floorsData = await firestoreFloorMaps.getBuildingFloorMaps(
        selectedBuilding
      );
      console.log("Floors data received:", floorsData);

      const floorNames =
        floorsData.floors?.map((f: any) => {
          // Try multiple possible field names
          return f.name || f.floorPlanName || f.floorName || f.id || String(f);
        }) || [];

      console.log("Processed floor names:", floorNames);
      setFloors(["All", ...floorNames]);
    } catch (error) {
      console.error("Error fetching floors:", error);
      setFloors(["All"]); // At least show "All" option
    } finally {
      setLoadingFloors(false);
    }
  };

  const getActivityColor = (activity: number) => {
    if (activity >= 80) return "bg-danger";
    if (activity >= 50) return "bg-warning";
    if (activity > 0) return "bg-info";
    return "bg-gray-500";
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (imageRef.current) {
      setTimeout(calculateImageDimensions, 100);
      window.addEventListener("resize", calculateImageDimensions);
    }
  };

  // Render asset mappings on the floor plan
  const renderAssetMappings = () => {
    if (
      !floorMap?.assetMappings ||
      !imageLoaded ||
      actualImageDimensions.width === 0
    )
      return null;

    const mappings: AssetMapping[] = [];

    Object.entries(floorMap.assetMappings).forEach(([category, assets]) => {
      Object.entries(assets).forEach(([assetName, locations]) => {
        locations.forEach((location: any, index: number) => {
          const currentActiveStatus = activeStatuses[location.id];
          const scaleX =
            actualImageDimensions.width / actualImageDimensions.naturalWidth;
          const scaleY =
            actualImageDimensions.height / actualImageDimensions.naturalHeight;
          const displayX = location.x * scaleX + actualImageDimensions.offsetX;
          const displayY = location.y * scaleY + actualImageDimensions.offsetY;

          mappings.push({
            id: location.id,
            x: displayX,
            y: displayY,
            naturalX: location.x,
            naturalY: location.y,
            active: currentActiveStatus
              ? currentActiveStatus.active
              : location.active || 0,
            category: category,
            assetName: assetName,
            locationIndex: index,
            customImageUrl: location.customImageUrl || null,
          });
        });
      });
    });

    return mappings.map((mapping) => (
      <div
        key={`${mapping.id}-${mapping.locationIndex}`}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
        style={{ left: `${mapping.x}px`, top: `${mapping.y}px` }}
        onClick={() =>
          handleAssetClick({
            id: mapping.id,
            name: mapping.assetName,
            category: mapping.category,
            x: mapping.naturalX,
            y: mapping.naturalY,
            activity: mapping.active,
            customImageUrl: mapping.customImageUrl,
          })
        }
      >
        <div className="relative">
          <div
            className={`absolute rounded-full ${
              shouldAnimate(mapping.active) ? "animate-pulse" : ""
            }`}
            style={{
              width: "40px",
              height: "40px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: getRadarColor(mapping.active),
              border: `2px solid ${getRadarBorderColor(mapping.active)}`,
              zIndex: 5,
            }}
          />
          <img
            src={getIconForCategory(mapping.category, mapping.customImageUrl)}
            alt={mapping.category}
            className="object-contain shadow-lg border-2 border-white rounded bg-white hover:scale-110 transition-transform relative w-8 h-8"
            style={{
              zIndex: 10,
              minWidth: "32px",
              minHeight: "32px",
            }}
            onError={handleImageError}
          />
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="font-medium">{mapping.assetName}</div>
            <div className="text-xs text-gray-300">{mapping.category}</div>
            <div className="text-xs text-gray-300">
              Active Level: {mapping.active}
            </div>
            <div className="text-xs text-gray-300">
              Position: ({mapping.naturalX}, {mapping.naturalY})
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <ProtectedRoute>
      <BaseScreen title="Floor Maps" subtitle="Interactive Floor Plan Viewer">
        <div className="p-4 space-y-6">
          {/* Three-level Selectors - Modal-based dropdowns */}
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
                onValueChange={(value) => {
                  setSelectedBuilding(value);
                  setSelectedFloor("All");
                }}
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

            <div className="flex-1 relative">
              {loadingFloors && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <Select
                value={selectedFloor}
                onValueChange={(value) => {
                  console.log("Floor selected:", value);
                  setSelectedFloor(value);
                }}
                placeholder={
                  floors.length <= 1 ? "No floors available" : "Select Floor"
                }
                disabled={
                  selectedBuilding === "All" ||
                  loadingFloors ||
                  floors.length <= 1
                }
              >
                {floors.length > 0 ? (
                  floors.map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      {floor === "All" ? "All Floors" : floor}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none">No floors available</SelectItem>
                )}
              </Select>
            </div>
          </div>

          {/* Floor Map Display */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Card>
                <div className="p-4 flex items-center justify-between border-b">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    {floorMap
                      ? `${
                          floorMap.floorPlanName || floorMap.name
                        } (${selectedBuilding})`
                      : "Floor Plan"}
                    {loadingFloorMap && (
                      <LoadingSpinner size="sm" className="ml-2" />
                    )}
                  </h3>
                  {lastUpdate && (
                    <span className="text-xs text-gray-400">
                      Updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="p-2 md:p-4">
                  {loadingFloorMap ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="lg" />
                      <span className="ml-3 text-gray-400">
                        Loading floor map...
                      </span>
                    </div>
                  ) : !floorMap ? (
                    <div className="border-2 border-dashed rounded-lg h-[300px] md:h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-base text-gray-500">
                          {selectedBuilding === "All"
                            ? "Please select a building"
                            : selectedFloor === "All"
                            ? "Please select a floor"
                            : "No floor map available"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        ref={imageRef}
                        src={floorMap.imageUrl || "/images/placeholder.svg"}
                        alt={floorMap.floorPlanName || floorMap.name}
                        className="block w-full h-auto max-w-full"
                        onLoad={handleImageLoad}
                        style={{
                          objectFit: "contain",
                          objectPosition: "center",
                          maxHeight: "600px",
                        }}
                      />
                      {renderAssetMappings()}
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <LoadingSpinner size="lg" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Asset Mappings Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <div className="p-4 border-b border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Asset Mappings
                  </h3>
                </div>
                <div className="p-4">
                  {floorMap?.assetMappings &&
                  Object.keys(floorMap.assetMappings).length > 0 ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {Object.entries(floorMap.assetMappings).map(
                        ([category, assets]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2 font-medium text-sm border-b pb-1">
                              <img
                                src={getIconForCategory(category)}
                                alt={category}
                                className="w-5 h-5 object-contain"
                                onError={handleImageError}
                              />
                              <span className="text-white">{category}</span>
                            </div>
                            <div className="space-y-2 ml-7">
                              {Object.entries(assets).map(
                                ([assetName, locations]) =>
                                  locations.map(
                                    (location: any, index: number) => {
                                      const currentActiveStatus =
                                        activeStatuses[location.id];
                                      const currentActive = currentActiveStatus
                                        ? currentActiveStatus.active
                                        : location.active || 0;
                                      return (
                                        <div
                                          key={location.id}
                                          className={`p-2 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200 ${
                                            selectedAsset?.id === location.id
                                              ? "ring-2 ring-primary"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleAssetClick({
                                              id: location.id,
                                              name: assetName,
                                              category: category,
                                              x: location.x,
                                              y: location.y,
                                              activity: currentActive,
                                            })
                                          }
                                        >
                                          <div className="flex justify-between items-center font-medium">
                                            <span className="text-gray-900">
                                              {assetName} #{index + 1}
                                            </span>
                                            <span className="text-gray-600">
                                              ({location.x}, {location.y})
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  getRadarBorderColor(
                                                    currentActive
                                                  ),
                                              }}
                                            />
                                            <span className="text-gray-700">
                                              Active Level: {currentActive}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        No assets mapped
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Activity Legend */}
          <Card>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Legend
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getRadarBorderColor(8) }}
                />
                <span className="text-gray-700 text-sm">High (8+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getRadarBorderColor(5) }}
                />
                <span className="text-gray-700 text-sm">Medium (3-7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getRadarBorderColor(1) }}
                />
                <span className="text-gray-700 text-sm">Low (1-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getRadarBorderColor(0) }}
                />
                <span className="text-gray-700 text-sm">Inactive (0)</span>
              </div>
            </div>
          </Card>

          {/* Asset Detail Modal */}
          {selectedAsset && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white font-semibold text-xl">
                    {selectedAsset.name}
                  </h3>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Category</p>
                    <p className="text-white">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Activity Level</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-4 h-4 rounded-full ${getActivityColor(
                          selectedAsset.activity
                        )}`}
                      />
                      <p className="text-white">{selectedAsset.activity}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Position</p>
                    <p className="text-white">
                      X: {selectedAsset.x}%, Y: {selectedAsset.y}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </BaseScreen>
    </ProtectedRoute>
  );
}
