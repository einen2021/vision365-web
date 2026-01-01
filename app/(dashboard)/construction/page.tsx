'use client'

import { useState, useEffect } from 'react'
import { BaseScreen } from '@/components/common/BaseScreen'
import { StatusCard } from '@/components/ui/StatusCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react'
import { firestoreCommunities, firestoreBuildings, firestoreConstruction } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import { onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Select, SelectItem } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

interface ConstructionStep {
  id: string
  name: string
  status: 'yet-to-start' | 'ongoing' | 'completed'
  subcategories?: ConstructionStep[]
}

export default function ConstructionPage() {
  const [selectedCommunity, setSelectedCommunity] = useState('All')
  const [selectedBuilding, setSelectedBuilding] = useState('All')
  const [communities, setCommunities] = useState<string[]>([])
  const [buildings, setBuildings] = useState<string[]>([])
  const [steps, setSteps] = useState<ConstructionStep[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [loadingBuildings, setLoadingBuildings] = useState(false)
  const [loadingConstruction, setLoadingConstruction] = useState(false)
  const { user } = useAuth()

  const stats = {
    total: steps.reduce((acc, step) => acc + (step.subcategories?.length || 1), 0),
    completed: steps.reduce(
      (acc, step) =>
        acc +
        (step.status === 'completed' ? 1 : 0) +
        (step.subcategories?.filter((s) => s.status === 'completed').length || 0),
      0
    ),
    ongoing: steps.reduce(
      (acc, step) =>
        acc +
        (step.status === 'ongoing' ? 1 : 0) +
        (step.subcategories?.filter((s) => s.status === 'ongoing').length || 0),
      0
    ),
    progress: 0,
  }

  stats.progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

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
    setLoadingCommunities(true)
    try {
      const communitiesData = await firestoreCommunities.getAll()
      const communityList = communitiesData.map((c: any) => ({
        id: c.id || c.communityId,
        name: c.communityName || c.name || c.id,
        displayName: c.communityName || c.name || c.id,
      }))
      const displayNames: string[] = communityList.map((c: any) => c.displayName as string)
      const communitiesList: string[] = ['All', ...displayNames]
      setCommunities(communitiesList);
      // Store for filtering
      (window as any).__communitiesData = communityList
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoadingCommunities(false)
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

  // Real-time listener for construction data with subcategories
  useEffect(() => {
    if (selectedBuilding === 'All') {
      setSteps([])
      setLoadingConstruction(false)
      return
    }

    setLoadingConstruction(true)
    const constructionRef = doc(db as any, 'constructionDetails', selectedBuilding)
    
    const unsubscribe = onSnapshot(constructionRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const constructionStatus = data.constructionStatus || {}
        
        // Get subcategories
        try {
          const subcategoriesList = await firestoreConstruction.getSubcategories(selectedBuilding)
          const subcategories: any = subcategoriesList.reduce((acc: any, item: any) => {
            acc[item.id] = item.subcategories || [];
            return acc;
          }, {});
          
          // Convert to steps format with subcategories
          const stepsData = Object.entries(constructionStatus).map(([key, value]) => {
            const categoryKey = key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()
            const subcategoriesForStep = subcategories[categoryKey] || []
            
            return {
              id: key,
              name: key.replace(/([A-Z])/g, ' $1').trim(),
              status: (value === 1 ? 'completed' : value === 0 ? 'ongoing' : 'yet-to-start') as ConstructionStep['status'],
              subcategories: subcategoriesForStep.map((sub: any) => ({
                id: sub.id,
                name: sub.name,
                status: (sub.status || 'yet-to-start') as ConstructionStep['status'],
              })),
            }
          })
          
          setSteps(stepsData)
          setLoadingConstruction(false)
        } catch (error) {
          // Fallback without subcategories
          const stepsData = Object.entries(constructionStatus).map(([key, value]) => ({
            id: key,
            name: key.replace(/([A-Z])/g, ' $1').trim(),
            status: (value === 1 ? 'completed' : value === 0 ? 'ongoing' : 'yet-to-start') as ConstructionStep['status'],
          }))
          setSteps(stepsData)
          setLoadingConstruction(false)
        }
      } else {
        setSteps([])
        setLoadingConstruction(false)
      }
    })

    return () => {
      unsubscribe()
      setLoadingConstruction(false)
    }
  }, [selectedBuilding])

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const handleStatusChange = async (stepId: string, newStatus: string) => {
    if (selectedBuilding === 'All') return

    // Optimistic update
    const updateStep = (steps: ConstructionStep[]): ConstructionStep[] => {
      return steps.map((step) => {
        if (step.id === stepId) {
          return { ...step, status: newStatus as any }
        }
        if (step.subcategories) {
          return {
            ...step,
            subcategories: updateStep(step.subcategories),
          }
        }
        return step
      })
    }

    setSteps(updateStep(steps))
    setEditingStep(null)

    try {
      // Map status to numeric value
      const statusValue = newStatus === 'completed' ? 1 : newStatus === 'ongoing' ? 0 : -1
      
      const constructionRef = doc(db as any, 'constructionDetails', selectedBuilding)
      await updateDoc(constructionRef, {
        [`constructionStatus.${stepId}`]: statusValue,
        lastUpdated: new Date(),
      })
    } catch (error) {
      console.error('Error updating construction status:', error)
      // Revert on error
      fetchConstructionData()
    }
  }

  const fetchConstructionData = async () => {
    if (selectedBuilding === 'All') {
      setSteps([])
      return
    }

    try {
      const constructionData = await firestoreConstruction.getConstructionStatus(selectedBuilding)
      setSteps((constructionData.steps || []) as ConstructionStep[])
    } catch (error) {
      console.error('Error fetching construction data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white'
      case 'ongoing':
        return 'bg-warning text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <ProtectedRoute>
      <BaseScreen
        title="Construction Dashboard"
        subtitle="Progress Tracking"
        rightHeaderComponent={
          <Button
            variant={editMode ? 'primary' : 'secondary'}
            onClick={() => setEditMode(!editMode)}
            className="text-sm px-3 py-1"
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
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

          {/* Stats Cards */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              <StatusCard
                title="Total Assets"
                count={stats.total}
                icon="fire"
                backgroundColor="#ffffff"
              />
              <StatusCard
                title="Completed"
                count={stats.completed}
                icon="trouble"
                backgroundColor={stats.completed > 0 ? '#28a745' : '#ffffff'}
              />
              <StatusCard
                title="Ongoing"
                count={stats.ongoing}
                icon="supervisory"
                backgroundColor={stats.ongoing > 0 ? '#ffc107' : '#ffffff'}
              />
              <StatusCard
                title="Progress"
                count={stats.progress}
                icon="fire"
                backgroundColor="#ffffff"
              />
            </div>
          </div>

          {/* Overall Progress Bar */}
          <Card>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-900 font-medium">Overall Progress</span>
              <span className="text-gray-400">{stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </Card>

          {/* Construction Steps */}
          <div className="space-y-3">
            {loadingConstruction ? (
              <div className="space-y-3">
                <LoadingSkeleton className="h-20 w-full" count={5} />
              </div>
            ) : steps.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">
                  {selectedBuilding === 'All'
                    ? 'Please select a building'
                    : 'No construction data available'}
                </p>
              </Card>
            ) : (
              steps.map((step) => (
                <Card key={step.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {step.subcategories && step.subcategories.length > 0 && (
                        <button
                          onClick={() => toggleStep(step.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedSteps.has(step.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-900" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-900" />
                          )}
                        </button>
                      )}
                      <h3 className="text-gray-900 font-semibold text-lg">{step.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {editMode && editingStep === step.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(step.id, 'completed')}
                            className="p-1 bg-success rounded"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(step.id, 'ongoing')}
                            className="p-1 bg-warning rounded"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => setEditingStep(null)}
                            className="p-1 bg-gray-600 rounded"
                          >
                            <X className="w-4 h-4 text-gray-900" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              step.status
                            )}`}
                          >
                            {step.status.replace('-', ' ').toUpperCase()}
                          </span>
                          {editMode && (
                            <button
                              onClick={() => setEditingStep(step.id)}
                              className="p-1 hover:bg-gray-700 rounded"
                            >
                              <Edit2 className="w-4 h-4 text-gray-900" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {expandedSteps.has(step.id) &&
                    step.subcategories &&
                    step.subcategories.length > 0 && (
                      <div className="mt-4 space-y-2 pl-8">
                        {step.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 bg-gray-100 rounded border border-gray-200"
                          >
                            <span className="text-gray-700 text-sm">{sub.name}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                                sub.status
                              )}`}
                            >
                              {sub.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </Card>
              ))
            )}
          </div>
        </div>
      </BaseScreen>
    </ProtectedRoute>
  )
}

