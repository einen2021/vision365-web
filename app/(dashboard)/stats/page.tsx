'use client'

import { useState, useEffect } from 'react'
import { BaseScreen } from '@/components/common/BaseScreen'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Plus, CheckCircle, XCircle } from 'lucide-react'
import { firestoreBuildings, firestoreMimic, firestoreListeners } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

interface Device {
  id: string
  name: string
  pseudo: string
  status: 'active' | 'inactive'
}

const buildingSchema = z.object({
  buildingName: z.string().min(1, 'Building name is required'),
})

const deviceSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required'),
})

type BuildingFormData = z.infer<typeof buildingSchema>
type DeviceFormData = z.infer<typeof deviceSchema>

export default function StatsPage() {
  const [selectedBuilding, setSelectedBuilding] = useState('All')
  const [buildings, setBuildings] = useState<string[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const {
    register: registerBuilding,
    handleSubmit: handleSubmitBuilding,
    formState: { errors: buildingErrors },
    reset: resetBuilding,
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
  })

  const {
    register: registerDevice,
    handleSubmit: handleSubmitDevice,
    formState: { errors: deviceErrors },
    reset: resetDevice,
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  })

  useEffect(() => {
    fetchBuildings()
  }, [])

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      if (user?.email) {
        // Stats page doesn't have community selector, so get all buildings
        const buildingsData = await firestoreBuildings.getAllFromUser(user.email)
        setBuildings(['All', ...(buildingsData || [])])
      }
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoadingBuildings(false);
    }
  }

  // Real-time listener for devices
  useEffect(() => {
    if (selectedBuilding === 'All') {
      setDevices([])
      setLoadingDevices(false)
      return
    }

    setLoadingDevices(true)
    const unsubscribe = firestoreListeners.subscribeToMimic(
      selectedBuilding,
      (devices) => {
        setDevices(devices)
        setLoadingDevices(false)
      }
    )

    return () => {
      unsubscribe()
      setLoadingDevices(false)
    }
  }, [selectedBuilding])

  const onCreateBuilding = async (data: BuildingFormData) => {
    setLoading(true)
    setError(null)
    try {
      await firestoreBuildings.createBuilding(data.buildingName)
      setShowAddBuilding(false)
      resetBuilding()
      await fetchBuildings()
    } catch (err: any) {
      setError(err.message || 'Failed to create building')
    } finally {
      setLoading(false)
    }
  }

  const onCreateDevice = async (data: DeviceFormData) => {
    if (selectedBuilding === 'All') return
    
    setLoading(true)
    setError(null)
    try {
      await firestoreMimic.addDevice(selectedBuilding, data.deviceName)
      setShowAddDevice(false)
      resetDevice()
    } catch (err: any) {
      setError(err.message || 'Failed to add device')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <BaseScreen
        title="Stats / Mimics"
        subtitle="Device Status Monitoring"
        rightHeaderComponent={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAddBuilding(true)}
              className="text-sm px-3 py-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Building
            </Button>
            {selectedBuilding !== 'All' && (
              <Button
                variant="primary"
                onClick={() => setShowAddDevice(true)}
                className="text-sm px-3 py-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Device
              </Button>
            )}
          </div>
        }
      >
        <div className="p-4 space-y-6">
          {/* Building Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Building
            </label>
            <div className="relative">
              {loadingBuildings && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                disabled={loadingBuildings}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
              >
                {buildings.map((building) => (
                  <option key={building} value={building}>
                    {building === 'All' ? 'All Buildings' : building}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Device Cards Grid */}
          {selectedBuilding === 'All' ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                Please select a building to view devices
              </p>
            </Card>
          ) : loadingDevices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoadingSkeleton className="h-32 w-full" count={6} />
            </div>
          ) : devices.length === 0 ? (
            <Card>
              <p className="text-gray-400 text-center py-8">No devices found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <Card
                  key={device.id}
                  className={`${
                    device.status === 'active'
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold text-lg mb-1">
                        {device.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{device.pseudo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.status === 'active' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        device.status === 'active'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {device.status.toUpperCase()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Building Modal */}
        <Modal
          isOpen={showAddBuilding}
          onClose={() => {
            setShowAddBuilding(false)
            resetBuilding()
            setError(null)
          }}
          title="Add New Building"
        >
          <form onSubmit={handleSubmitBuilding(onCreateBuilding)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Building Name"
              placeholder="Enter building name"
              {...registerBuilding('buildingName')}
              error={buildingErrors.buildingName?.message}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddBuilding(false)
                  resetBuilding()
                  setError(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Create Building
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Device Modal */}
        <Modal
          isOpen={showAddDevice}
          onClose={() => {
            setShowAddDevice(false)
            resetDevice()
            setError(null)
          }}
          title="Add New Device"
        >
          <form onSubmit={handleSubmitDevice(onCreateDevice)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Device Name"
              placeholder="Enter device name"
              {...registerDevice('deviceName')}
              error={deviceErrors.deviceName?.message}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddDevice(false)
                  resetDevice()
                  setError(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Add Device
              </Button>
            </div>
          </form>
        </Modal>
      </BaseScreen>
    </ProtectedRoute>
  )
}

