'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BaseScreen } from '@/components/common/BaseScreen'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Map } from 'lucide-react'
import { firestoreCommunities, firestoreBuildings, firestoreSmoke, getBuildingCollectionName } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Select, SelectItem } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

interface SmokeControl {
  id: string
  label: string
  state: boolean
}

export default function ControlsPage() {
  const router = useRouter()
  const [selectedCommunity, setSelectedCommunity] = useState('All')
  const [selectedBuilding, setSelectedBuilding] = useState('All')
  const [communities, setCommunities] = useState<string[]>([])
  const [buildings, setBuildings] = useState<string[]>([])
  const [controls, setControls] = useState<SmokeControl[]>([])
  const [buildingLogo, setBuildingLogo] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [loadingControls, setLoadingControls] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchCommunities()
  }, [])

  // Fetch buildings when community changes
  useEffect(() => {
    fetchBuildings()
    // Reset building selection when community changes
    if (selectedCommunity !== 'All') {
      setSelectedBuilding('All')
    }
  }, [selectedCommunity, user?.email])

  const fetchCommunities = async () => {
    try {
      const communitiesData = await firestoreCommunities.getAll()
      const communityList = communitiesData.map((c: any) => ({
        id: c.id || c.communityId,
        name: c.communityName || c.name || c.id,
        displayName: c.communityName || c.name || c.id,
      }))
      setCommunities(['All', ...(communityList.map((c: any) => c.displayName) || [])]);
      // Store for filtering
      (window as any).__communitiesData = communityList
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  const fetchBuildings = async () => {
    setLoadingBuildings(true)
    try {
      if (user?.email) {
        const buildingsData = await firestoreBuildings.getAllFromUserByCommunity(
          user.email,
          selectedCommunity
        )
        setBuildings(['All', ...(buildingsData || [])])
      }
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoadingBuildings(false)
    }
  }

  // Real-time listener for smoke controls
  useEffect(() => {
    if (selectedBuilding === 'All') {
      setControls([])
      setBuildingLogo(null)
      setLoadingControls(false)
      return
    }

    setLoadingControls(true)
    const collectionName = getBuildingCollectionName(selectedBuilding)
    const smokeRef = doc(db as any, collectionName, 'smokeActions')
    const buildingDetailsRef = doc(db as any, collectionName, 'buildingDetails')

    const unsubscribeSmoke = onSnapshot(smokeRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const controls = [
          { id: 'sef', label: 'SEF', state: data.SEF || data.p550 || false },
          { id: 'spf', label: 'SPF', state: data.SPF || data.p551 || false },
          { id: 'lift', label: 'LIFT', state: data.LIFT || data.p552 || false },
          { id: 'fan', label: 'FAN', state: data.FAN || data.p553 || false },
        ]
        setControls(controls)
        setLoadingControls(false)
      } else {
        setLoadingControls(false)
      }
    })

    const unsubscribeBuilding = onSnapshot(buildingDetailsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setBuildingLogo(data.logo || null)
      }
    })

    return () => {
      unsubscribeSmoke()
      unsubscribeBuilding()
      setLoadingControls(false)
    }
  }, [selectedBuilding])

  const handleToggle = async (controlId: string, newState: boolean) => {
    // Optimistic update
    setControls((prev) =>
      prev.map((c) => (c.id === controlId ? { ...c, state: newState } : c))
    )
    setUpdating(controlId)

    try {
      await firestoreSmoke.updateSmokeAction(selectedBuilding, controlId, newState)
    } catch (error) {
      // Revert on error
      setControls((prev) =>
        prev.map((c) => (c.id === controlId ? { ...c, state: !newState } : c))
      )
      console.error('Error updating control:', error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <ProtectedRoute>
      <BaseScreen
        title="Controls"
        subtitle="Smoke Control System"
        rightHeaderComponent={
          selectedBuilding !== 'All' && (
            <Button
              variant="secondary"
              onClick={() => router.push('/floor-maps')}
              className="text-sm px-3 py-1"
            >
              <Map className="w-4 h-4 mr-1" />
              Floor Maps
            </Button>
          )
        }
      >
        <div className="p-4 space-y-6">
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
                    {community === 'All' ? 'All Communities' : community}
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
                    {building === 'All' ? 'All Buildings' : building}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {selectedBuilding === 'All' ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                Please select a building to view controls
              </p>
            </Card>
          ) : (
            <>
              {/* Building Info Card */}
              {buildingLogo && (
                <Card>
                  <div className="flex items-center gap-4">
                    <img
                      src={buildingLogo}
                      alt={selectedBuilding}
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h3 className="text-gray-900 font-semibold text-lg">{selectedBuilding}</h3>
                      <p className="text-gray-600 text-sm">Smoke Control System</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Control Buttons Grid */}
              {loadingControls ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <LoadingSkeleton className="h-32 w-full" count={4} />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {controls.map((control) => (
                  <button
                    key={control.id}
                    onClick={() => handleToggle(control.id, !control.state)}
                    disabled={updating === control.id}
                    className={`
                      p-6 rounded-lg font-semibold text-white
                      transition-all duration-200
                      ${control.state ? 'bg-success hover:bg-green-600' : 'bg-danger hover:bg-red-600'}
                      ${updating === control.id ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">{control.label}</div>
                      <div className="text-sm">
                        {control.state ? 'ON' : 'OFF'}
                      </div>
                      {updating === control.id && (
                        <div className="mt-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                </div>
              )}
            </>
          )}
        </div>
      </BaseScreen>
    </ProtectedRoute>
  )
}

