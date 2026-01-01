'use client'

import { useState, useEffect } from 'react'
import { BaseScreen } from '@/components/common/BaseScreen'
import { StatusCard } from '@/components/ui/StatusCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Plus, Search, AlertTriangle, MapPin, Clock } from 'lucide-react'
import { firestoreCommunities, firestoreBuildings, firestoreIncidents } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import { onSnapshot, doc, collection } from 'firebase/firestore'
import { db, getBuildingCollectionName } from '@/lib/firestore'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { Select, SelectItem } from '@/components/ui/Select'

interface Incident {
  id: string
  title: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'resolved'
  building: string
  location: string
  timestamp: string
}

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high']),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
})

type IncidentFormData = z.infer<typeof incidentSchema>

export default function IncidentsPage() {
  const [selectedCommunity, setSelectedCommunity] = useState('All')
  const [selectedBuilding, setSelectedBuilding] = useState('All')
  const [communities, setCommunities] = useState<string[]>([])
  const [buildings, setBuildings] = useState<string[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [loadingIncidents, setLoadingIncidents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      priority: 'medium',
    },
  })

  const stats = {
    total: incidents.length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
    open: incidents.filter((i) => i.status === 'open').length,
    highPriority: incidents.filter((i) => i.priority === 'high').length,
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      searchQuery === '' ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

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

  // Real-time listener for incidents
  useEffect(() => {
    if (selectedBuilding === 'All') {
      setIncidents([])
      setLoadingIncidents(false)
      return
    }

    setLoadingIncidents(true)
    const collectionName = getBuildingCollectionName(selectedBuilding)
    const incidentsRef = doc(db as any, collectionName, 'incidents')
    
    const unsubscribe = onSnapshot(incidentsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const incidentsData = (data.incidents || []).map((incident: any) => ({
          id: incident.incidentId || incident.id,
          title: incident.title || incident.hazardType || 'Untitled',
          category: incident.category || incident.hazardType || 'General',
          priority: (incident.priority || 'medium') as Incident['priority'],
          status: (incident.status || 'open') as Incident['status'],
          building: selectedBuilding,
          location: incident.location || '',
          timestamp: incident.timestamp || incident.createdAt || new Date().toISOString(),
        }))
        setIncidents(incidentsData)
        setLoadingIncidents(false)
      } else {
        setIncidents([])
        setLoadingIncidents(false)
      }
    })

    return () => {
      unsubscribe()
      setLoadingIncidents(false)
    }
  }, [selectedBuilding, selectedCommunity])

  const onCreateIncident = async (data: IncidentFormData) => {
    if (selectedBuilding === 'All') {
      setError('Please select a building')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await firestoreIncidents.createIncident(selectedBuilding, {
        title: data.title,
        category: data.category,
        priority: data.priority,
        location: data.location,
        description: data.description,
        status: 'open',
        building: selectedBuilding,
      })
      setShowCreateModal(false)
      reset()
    } catch (err: any) {
      setError(err.message || 'Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger text-white'
      case 'medium':
        return 'bg-warning text-white'
      default:
        return 'bg-info text-white'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? 'bg-success text-white' : 'bg-gray-500 text-white'
  }

  return (
    <ProtectedRoute>
      <BaseScreen
        title="Incident Reports"
        subtitle="Safety Incident Management"
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

          {/* Stats Cards */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              <StatusCard
                title="Total"
                count={stats.total}
                icon="fire"
                backgroundColor="#ffffff"
              />
              <StatusCard
                title="Resolved"
                count={stats.resolved}
                icon="trouble"
                backgroundColor={stats.resolved > 0 ? '#28a745' : '#ffffff'}
              />
              <StatusCard
                title="Open"
                count={stats.open}
                icon="supervisory"
                backgroundColor={stats.open > 0 ? '#dc3545' : '#ffffff'}
              />
              <StatusCard
                title="High Priority"
                count={stats.highPriority}
                icon="fire"
                backgroundColor={stats.highPriority > 0 ? '#dc3545' : '#ffffff'}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Incidents List */}
          <div className="space-y-3">
            {loadingIncidents ? (
              <div className="space-y-3">
                <LoadingSkeleton className="h-32 w-full" count={5} />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">No incidents found</p>
              </Card>
            ) : (
              filteredIncidents.map((incident) => (
                <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-gray-900 font-semibold text-lg">{incident.title}</h3>
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                              incident.priority
                            )}`}
                          >
                            {incident.priority.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                              incident.status
                            )}`}
                          >
                            {incident.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{incident.building} - {incident.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(incident.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Category: </span>
                          <span>{incident.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => setShowCreateModal(true)}
          label="Create Incident"
        />

        {/* Create Incident Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            reset()
            setError(null)
          }}
          title="Create New Incident"
          size="lg"
        >
          <form onSubmit={handleSubmit(onCreateIncident)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Title"
              placeholder="Enter incident title"
              {...register('title')}
              error={errors.title?.message}
            />
            <Input
              label="Category"
              placeholder="e.g., Fire, Equipment Failure"
              {...register('category')}
              error={errors.category?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>
            <Input
              label="Location"
              placeholder="Enter location within building"
              {...register('location')}
              error={errors.location?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                placeholder="Enter incident description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  reset()
                  setError(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Create Incident
              </Button>
            </div>
          </form>
        </Modal>
      </BaseScreen>
    </ProtectedRoute>
  )
}

