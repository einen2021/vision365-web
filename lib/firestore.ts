import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// Helper to check if Firebase is initialized
const checkFirebase = () => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please check your .env.local file and ensure all Firebase environment variables are set.'
    )
  }
  return db
}


// Helper to get building collection name
export const getBuildingCollectionName = (buildingName: string): string => {
  if (buildingName === 'areej5') {
    return `${buildingName}BuildingDB`
  }
  return `${buildingName}BuildingDB`
}

// Re-export db for convenience (with null check)
export { db }

// Helper to convert Firestore timestamp to Date
export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }
  return new Date(timestamp)
}

// Auth functions
export const firestoreAuth = {
  // Login - check UserDB collection
  async login(email: string, password: string) {
    const firestoreDb = checkFirebase()
    const userRef = collection(firestoreDb, 'UserDB')
    const q = query(userRef, where('email', '==', email))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid email or password.')
    }

    const userData = snapshot.docs[0].data()
    
    // Simple password comparison (backend uses plain text in login endpoint)
    if (userData.password !== password) {
      throw new Error('Invalid email or password.')
    }

    return {
      email: userData.email,
      role: userData.role,
      password: userData.password, // Keep for compatibility
      ...userData,
    }
  },

  // Signup - check MailDB and create in UserDB
  async signup(email: string, password: string, name: string) {
    const firestoreDb = checkFirebase()
    // Check if email is allowed in MailDB
    const mailRef = collection(firestoreDb, 'MailDB')
    const mailQuery = query(mailRef, where('email', '==', email))
    const mailSnapshot = await getDocs(mailQuery)

    if (mailSnapshot.empty) {
      throw new Error('Email not allowed for signup.')
    }

    const allowedUser = mailSnapshot.docs[0].data()
    const allowedRole = allowedUser.role

    if (!allowedRole) {
      throw new Error('Email exists but no role assigned. Contact admin.')
    }

    // Check if user already exists
    const userRef = collection(firestoreDb, 'UserDB')
    const userQuery = query(userRef, where('email', '==', email))
    const userSnapshot = await getDocs(userQuery)

    if (!userSnapshot.empty) {
      throw new Error('Email already registered.')
    }

    // Create user
    await addDoc(userRef, {
      email,
      password,
      name,
      role: allowedRole,
    })

    // Update MailDB to set active = true
    await updateDoc(mailSnapshot.docs[0].ref, { active: true })

    return { message: 'User registered successfully.', status: true }
  },
}

// Communities
export const firestoreCommunities = {
  async getAll() {
    const firestoreDb = checkFirebase()
    const communitiesRef = collection(firestoreDb, 'communities')
    const snapshot = await getDocs(query(communitiesRef, orderBy('createdAt', 'desc')))
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  },
}

// Buildings
export const firestoreBuildings = {
  async getAll() {
    const firestoreDb = checkFirebase()
    // Client SDK can't list collections - need a buildings collection
    // Try to get from a buildings collection if it exists
    try {
      const buildingsRef = collection(firestoreDb, 'buildings')
      const snapshot = await getDocs(buildingsRef)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      // If buildings collection doesn't exist, return empty
      return []
    }
  },

  async createBuilding(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    
    // Check if building already exists
    const buildingDetailsRef = doc(firestoreDb, collectionName, 'buildingDetails')
    const buildingDoc = await getDoc(buildingDetailsRef)
    
    if (buildingDoc.exists()) {
      throw new Error(`Building with name '${buildingName}' already exists.`)
    }

    // Create building collection with initialized documents using batch
    const batch = writeBatch(firestoreDb)
    
    // Initialize actions document
    batch.set(doc(firestoreDb, collectionName, 'actions'), {
      ack: false,
      live: false,
      ppm: false,
      reset: false,
      sack: false,
      silence: false,
      tack: false,
    })

    // Initialize alarm messages document
    batch.set(doc(firestoreDb, collectionName, 'alarmMessage'), {
      messages: [],
    })

    // Initialize alarm details document
    batch.set(doc(firestoreDb, collectionName, 'alarmDetails'), {
      totalFire: 0,
      totalSupervisory: 0,
      totalTrouble: 0,
    })

    // Initialize building details document
    batch.set(buildingDetailsRef, {
      buildingName: buildingName,
      floorDetails: '',
      locationData: '',
      mapData: '',
      operator: '',
      communityId: null,
      communityName: 'Not Assigned',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Initialize contact details document
    batch.set(doc(firestoreDb, collectionName, 'contactDetails'), {
      contactName: '',
      contactNo: [],
      contactPosition: '',
      emailId: '',
    })

    // Initialize project details document
    batch.set(doc(firestoreDb, collectionName, 'projectDetails'), {
      clientName: '',
      contractorName: '',
      projectName: '',
    })

    // Initialize mimic document
    batch.set(doc(firestoreDb, collectionName, 'mimic'), {})

    // Initialize mimicMap document
    batch.set(doc(firestoreDb, collectionName, 'mimicMap'), {
      mimicDetails: [],
    })

    // Initialize smokeActions document
    batch.set(doc(firestoreDb, collectionName, 'smokeActions'), {
      SEF: true,
      SPF: true,
      LIFT: true,
      FAN: true,
    })

    // Commit batch
    await batch.commit()

    return { message: `Building ${buildingName} created successfully.`, status: true }
  },

  async getAllFromUser(email: string) {
    const firestoreDb = checkFirebase()
    const userRef = collection(firestoreDb, 'UserDB')
    const userQuery = query(userRef, where('email', '==', email))
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) {
      return []
    }

    const userData = userSnapshot.docs[0].data()
    
    if (userData.role === 'admin') {
      // Admin - try to get from buildings collection
      try {
        const buildingsRef = collection(firestoreDb, 'buildings')
        const snapshot = await getDocs(buildingsRef)
        return snapshot.docs.map((doc) => doc.data().name || doc.id)
      } catch (error) {
        // Fallback to user's buildings if collection doesn't exist
        return userData.buildings || []
      }
    }

    // For non-admin, return their assigned buildings
    // Buildings can be array or object
    // If object, it might be keyed by community ID: { communityId: [buildings] }
    if (Array.isArray(userData.buildings)) {
      return userData.buildings
    }
    if (typeof userData.buildings === 'object' && userData.buildings !== null) {
      // Check if it's an object with community IDs as keys
      const firstValue = Object.values(userData.buildings)[0]
      if (Array.isArray(firstValue)) {
        // It's keyed by community ID, return all buildings from all communities
        return Object.values(userData.buildings).flat() as string[]
      }
      // Otherwise, return the keys (building names)
      return Object.keys(userData.buildings)
    }
    return []
  },

  async getAllFromUserByCommunity(email: string, communityIdentifier: string) {
    const firestoreDb = checkFirebase()
    
    // First get all buildings for the user
    const allBuildings = await this.getAllFromUser(email)
    
    if (communityIdentifier === 'All' || !communityIdentifier) {
      return allBuildings
    }

    // Get the community document to find both ID and name, and get its buildings array
    let communityBuildings: string[] = []
    let foundCommunity = false
    
    try {
      const communitiesRef = collection(firestoreDb, 'communities')
      const communitiesSnapshot = await getDocs(communitiesRef)
      
      for (const communityDoc of communitiesSnapshot.docs) {
        const communityData = communityDoc.data()
        const docCommunityName = communityData.communityName || communityDoc.id
        
        // Check if the identifier matches either the ID or the name (case-insensitive)
        const nameMatches = docCommunityName.toLowerCase() === communityIdentifier.toLowerCase()
        const idMatches = communityDoc.id === communityIdentifier
        
        if (idMatches || nameMatches) {
          foundCommunity = true
          // Get buildings array from community document (as per backend structure)
          // Buildings can be an array of strings or array of objects with id/name
          const buildingsData = communityData.buildings || []
          
          // Handle both array of strings and array of objects
          communityBuildings = buildingsData.map((b: any) => {
            if (typeof b === 'string') return b
            if (typeof b === 'object' && b.id) return b.id
            if (typeof b === 'object' && b.name) return b.name
            return String(b)
          })
          
          console.log(`Found community ${docCommunityName} with ${communityBuildings.length} buildings`)
          break
        }
      }
      
      if (!foundCommunity) {
        console.warn(`Community not found: ${communityIdentifier}`)
      }
    } catch (error) {
      console.warn('Error fetching communities for filtering:', error)
    }

    // If we couldn't find the community or it has no buildings, try alternative method
    if (!foundCommunity || communityBuildings.length === 0) {
      // Fallback: Check each building's buildingDetails document
      const filteredBuildings: string[] = []
      
      for (const buildingName of allBuildings) {
        try {
          const collectionName = getBuildingCollectionName(buildingName)
          const buildingDetailsRef = doc(firestoreDb, collectionName, 'buildingDetails')
          const buildingDoc = await getDoc(buildingDetailsRef)
          
          if (buildingDoc.exists()) {
            const buildingData = buildingDoc.data()
            const buildingCommunityId = buildingData.communityId
            const buildingCommunityName = buildingData.communityName || ''
            
            // Match by community identifier (could be ID or name)
            const matches = 
              buildingCommunityId === communityIdentifier ||
              buildingCommunityName === communityIdentifier ||
              buildingCommunityName.toLowerCase() === communityIdentifier.toLowerCase()
            
            if (matches) {
              filteredBuildings.push(buildingName)
            }
          }
        } catch (error) {
          // If we can't check, skip the building
          console.warn(`Could not check community for building ${buildingName}:`, error)
        }
      }
      
      return filteredBuildings
    }

    // Filter user's buildings by checking if they're in the community's buildings array
    // This matches the backend structure where communities have a buildings array
    console.log('🔍 Filtering buildings:', {
      userBuildings: allBuildings,
      communityBuildings: communityBuildings,
      communityIdentifier
    })
    
    // Also check if user has buildings stored by community ID (from backend structure)
    let userBuildingsByCommunity: string[] = []
    try {
      const userRef = collection(firestoreDb, 'UserDB')
      const userQuery = query(userRef, where('email', '==', email))
      const userSnapshot = await getDocs(userQuery)
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        
        // Find community ID from identifier
        const communitiesRef = collection(firestoreDb, 'communities')
        const communitiesSnapshot = await getDocs(communitiesRef)
        
        for (const communityDoc of communitiesSnapshot.docs) {
          const communityData = communityDoc.data()
          const docCommunityName = communityData.communityName || communityDoc.id
          
          if (communityDoc.id === communityIdentifier || 
              docCommunityName.toLowerCase() === communityIdentifier.toLowerCase()) {
            // Check if user has buildings stored by this community ID
            if (typeof userData.buildings === 'object' && userData.buildings !== null) {
              const communityId = communityDoc.id
              const buildingsForCommunity = userData.buildings[communityId]
              
              if (Array.isArray(buildingsForCommunity)) {
                userBuildingsByCommunity = buildingsForCommunity
                console.log(`📦 Found ${userBuildingsByCommunity.length} buildings for user in community ${communityId}`)
              }
            }
            break
          }
        }
      }
    } catch (error) {
      console.warn('Error checking user buildings by community:', error)
    }
    
    // Combine all possible user buildings
    const allUserBuildings = [...new Set([...allBuildings, ...userBuildingsByCommunity])]
    console.log('📋 All user buildings (combined):', allUserBuildings)
    
    // Filter: check if building is in community's buildings array
    const filteredBuildings = allUserBuildings.filter((buildingName) => {
      // Normalize building names (remove BuildingDB suffix if present)
      const normalizeBuildingName = (name: string) => {
        return name.replace('BuildingDB', '').toLowerCase().trim()
      }
      
      const normalizedUserBuilding = normalizeBuildingName(buildingName)
      
      // Check each community building
      for (const communityBuilding of communityBuildings) {
        const normalizedCommunityBuilding = normalizeBuildingName(communityBuilding)
        
        // Exact match (case-insensitive, ignoring BuildingDB suffix)
        if (normalizedUserBuilding === normalizedCommunityBuilding) {
          console.log(`✅ Building "${buildingName}" matches community building "${communityBuilding}"`)
          return true
        }
        
        // Also check exact string match
        if (buildingName === communityBuilding) {
          console.log(`✅ Building "${buildingName}" exact match with "${communityBuilding}"`)
          return true
        }
      }
      
      return false
    })
    
    // If no matches found, but community has buildings, try to include them anyway
    // (user might have access but building not in their list)
    if (filteredBuildings.length === 0 && communityBuildings.length > 0) {
      console.log('⚠️ No matches found, but community has buildings. Trying to include them...')
      
      // For each community building, check if user has access
      for (const communityBuilding of communityBuildings) {
        // Remove BuildingDB suffix if present
        const buildingName = communityBuilding.replace('BuildingDB', '')
        
        // Check if this building exists in user's all buildings (with or without suffix)
        const buildingExists = allUserBuildings.some(ub => {
          const normalizedUb = ub.replace('BuildingDB', '').toLowerCase()
          const normalizedCb = buildingName.toLowerCase()
          return normalizedUb === normalizedCb || ub === communityBuilding
        })
        
        if (buildingExists || allUserBuildings.length === 0) {
          // Include the building name without BuildingDB suffix
          filteredBuildings.push(buildingName)
          console.log(`➕ Added building "${buildingName}" from community`)
        }
      }
    }
    
    console.log('📋 Final filtered buildings result:', filteredBuildings)
    
    return filteredBuildings
  },
}

// Mimic/Devices
export const firestoreMimic = {
  async getAllForBuilding(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const mimicRef = doc(firestoreDb, collectionName, 'mimic')
    const mimicMapRef = doc(firestoreDb, collectionName, 'mimicMap')

    const [mimicDoc, mimicMapDoc] = await Promise.all([
      getDoc(mimicRef),
      getDoc(mimicMapRef),
    ])

    if (!mimicDoc.exists() || !mimicMapDoc.exists()) {
      return { devices: [] }
    }

    const mimicData = mimicDoc.data()
    const mimicMapData = mimicMapDoc.data()
    const mimicDetails = mimicMapData.mimicDetails || []

    // Convert to array if it's an object
    const devicesArray = Array.isArray(mimicDetails)
      ? mimicDetails
      : Object.values(mimicDetails)

    const devices = devicesArray.map((device: any) => {
      const pseudo = device.pseudo || device
      const status = mimicData[pseudo] === '1' ? 'active' : 'inactive'
      
      return {
        id: pseudo,
        name: device.name || device,
        pseudo,
        status,
      }
    })

    return { devices }
  },

  async addDevice(buildingName: string, deviceName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const mimicRef = doc(firestoreDb, collectionName, 'mimic')
    const mimicMapRef = doc(firestoreDb, collectionName, 'mimicMap')

    // Generate unique pseudo
    let pseudo = Math.floor(Math.random() * 1000000).toString()

    // Check if mimic document exists
    const mimicDoc = await getDoc(mimicRef)
    if (mimicDoc.exists()) {
      const mimicData = mimicDoc.data()
      // Make sure we don't use an existing pseudo
      while (mimicData[pseudo] !== undefined) {
        pseudo = Math.floor(Math.random() * 1000000).toString()
      }
      await updateDoc(mimicRef, { [pseudo]: '1' })
    } else {
      await setDoc(mimicRef, { [pseudo]: '1' })
    }

    // Update mimicMap
    const mimicMapDoc = await getDoc(mimicMapRef)
    if (mimicMapDoc.exists()) {
      const mimicMapData = mimicMapDoc.data()
      const mimicDetails = mimicMapData.mimicDetails || []
      
      if (Array.isArray(mimicDetails)) {
        const updatedDetails = [...mimicDetails, { name: deviceName, pseudo }]
        await updateDoc(mimicMapRef, { mimicDetails: updatedDetails })
      } else {
        // If it's an object, convert to array
        const detailsArray = Object.values(mimicDetails)
        detailsArray.push({ name: deviceName, pseudo })
        await updateDoc(mimicMapRef, { mimicDetails: detailsArray })
      }
    } else {
      await setDoc(mimicMapRef, {
        mimicDetails: [{ name: deviceName, pseudo }],
      })
    }

    return { pseudo, message: 'Device added successfully.', status: true }
  },

  async updateDeviceStatus(buildingName: string, pseudo: string, status: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const mimicRef = doc(firestoreDb, collectionName, 'mimic')
    
    await updateDoc(mimicRef, { [pseudo]: status })
    return { message: 'Device status updated successfully.', status: true }
  },

  async getAllForAllBuildings() {
    // This is complex without listCollections - would need a buildings collection
    return { data: [] }
  },
}

// Alarm Details
export const firestoreAlarms = {
  async getAlarmDetails(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const alarmRef = doc(firestoreDb, collectionName, 'alarmDetails')
    const alarmDoc = await getDoc(alarmRef)

    if (!alarmDoc.exists()) {
      return {
        fire: 0,
        trouble: 0,
        supervisory: 0,
      }
    }

    const data = alarmDoc.data()
    return {
      fire: data.totalFire || 0,
      trouble: data.totalTrouble || 0,
      supervisory: data.totalSupervisory || 0,
    }
  },

  async getAlarmDetailsForAllBuildings() {
    // Would need buildings collection
    return { data: [] }
  },
}

// Messages
export const firestoreMessages = {
  async getMessages(buildingName?: string, page: number = 1, pageLimit: number = 10) {
    const firestoreDb = checkFirebase()
    if (buildingName && buildingName !== 'All') {
      const collectionName = getBuildingCollectionName(buildingName)
      const messagesRef = doc(firestoreDb, collectionName, 'alarmMessage')
      const messagesDoc = await getDoc(messagesRef)

      if (!messagesDoc.exists()) {
        return { messages: [], totalPages: 1 }
      }

      const data = messagesDoc.data()
      const allMessages = data.alarmMessage || data.messages || []
      
      // Ensure allMessages is an array
      const messagesArray = Array.isArray(allMessages) ? allMessages : []
      
      // Sort by time (newest first) if messages have time property
      const sortedMessages = [...messagesArray].sort((a: any, b: any) => {
        const timeA = a.time || 0
        const timeB = b.time || 0
        return timeB - timeA
      })
      
      // Pagination
      const startIndex = (page - 1) * pageLimit
      const endIndex = startIndex + pageLimit
      const paginatedMessages = sortedMessages.slice(startIndex, endIndex)

      return {
        messages: paginatedMessages.map((msg: any) => {
          // Handle timestamp conversion
          let timestamp: Date;
          if (msg.time) {
            // If time is a Firestore timestamp, convert it
            if (msg.time.toDate) {
              timestamp = msg.time.toDate();
            } else if (typeof msg.time === 'number') {
              timestamp = new Date(msg.time);
            } else if (typeof msg.time === 'string') {
              timestamp = new Date(msg.time);
            } else {
              timestamp = new Date();
            }
          } else {
            timestamp = new Date();
          }
          
          return {
            id: msg.time || Date.now(),
            message: msg.message || '',
            timestamp: timestamp.toISOString(),
            type: 'alarm',
          };
        }),
        totalPages: Math.ceil(sortedMessages.length / pageLimit),
      }
    }

    // Get messages from all buildings
    // This would require a buildings collection or different approach
    return { messages: [], totalPages: 1 }
  },
}

// Actions
export const firestoreActions = {
  async getActions(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const actionsRef = doc(firestoreDb, collectionName, 'actions')
    const actionsDoc = await getDoc(actionsRef)

    if (!actionsDoc.exists()) {
      return {
        ack: false,
        reset: false,
        sAck: false,
        tAck: false,
        silence: false,
      }
    }

    const data = actionsDoc.data()
    return {
      ack: data.ack || false,
      reset: data.reset || false,
      sAck: data.sAck || data.sack || false,
      tAck: data.tAck || data.tack || false,
      silence: data.silence || false,
    }
  },

  async updateActions(buildingName: string, action: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const actionsRef = doc(firestoreDb, collectionName, 'actions')
    
    // Map action names
    const actionMap: Record<string, string> = {
      ack: 'ack',
      reset: 'reset',
      sAck: 'sAck',
      tAck: 'tAck',
      silence: 'silence',
    }

    const fieldName = actionMap[action] || action
    
    // Toggle the action
    const currentDoc = await getDoc(actionsRef)
    const currentData = currentDoc.exists() ? currentDoc.data() : {}
    
    await updateDoc(actionsRef, {
      [fieldName]: !currentData[fieldName],
    })

    return { message: 'Action updated successfully.', status: true }
  },
}

// Smoke Controls
export const firestoreSmoke = {
  async getSmokeActions(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const smokeRef = doc(firestoreDb, collectionName, 'smokeActions')
    const smokeDoc = await getDoc(smokeRef)

    if (!smokeDoc.exists()) {
      return {
        controls: [],
        logo: null,
      }
    }

    const data = smokeDoc.data()
    
    // Convert to array format
    const controls = [
      { id: 'sef', label: 'SEF', state: data.SEF || data.p550 || false },
      { id: 'spf', label: 'SPF', state: data.SPF || data.p551 || false },
      { id: 'lift', label: 'LIFT', state: data.LIFT || data.p552 || false },
      { id: 'fan', label: 'FAN', state: data.FAN || data.p553 || false },
    ]

    // Get building logo from buildingDetails
    const buildingDetailsRef = doc(firestoreDb, collectionName, 'buildingDetails')
    const buildingDetailsDoc = await getDoc(buildingDetailsRef)
    const logo = buildingDetailsDoc.exists() ? buildingDetailsDoc.data().logo : null

    return {
      controls,
      logo,
    }
  },

  async updateSmokeAction(buildingName: string, controlId: string, state: boolean) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const smokeRef = doc(firestoreDb, collectionName, 'smokeActions')
    
    // Map control IDs to field names
    const fieldMap: Record<string, string> = {
      sef: 'SEF',
      spf: 'SPF',
      lift: 'LIFT',
      fan: 'FAN',
    }

    const fieldName = fieldMap[controlId.toLowerCase()] || controlId

    await updateDoc(smokeRef, {
      [fieldName]: state,
    })

    return { message: 'Smoke action updated successfully.', status: true }
  },
}

// Construction
export const firestoreConstruction = {
  async getConstructionStatus(buildingName: string) {
    const firestoreDb = checkFirebase()
    const constructionRef = doc(firestoreDb, 'constructionDetails', buildingName)
    const constructionDoc = await getDoc(constructionRef)

    if (!constructionDoc.exists()) {
      return {
        steps: [],
      }
    }

    const data = constructionDoc.data()
    const constructionStatus = data.constructionStatus || {}

    // Convert to steps format
    const steps = Object.entries(constructionStatus).map(([key, value]) => ({
      id: key,
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      status: value === 1 ? 'completed' : value === 0 ? 'ongoing' : 'yet-to-start',
    }))

    return { steps }
  },

  async getSubcategories(buildingName: string) {
    const firestoreDb = checkFirebase()
    const subcategoriesRef = collection(firestoreDb, 'subcategoryConstruction', buildingName, 'subcategories')
    const snapshot = await getDocs(subcategoriesRef)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  },
}

// Incidents
export const firestoreIncidents = {
  async getAllIncidents(community?: string, building?: string) {
    const firestoreDb = checkFirebase()
    // Get incidents from all buildings or specific building
    if (building && building !== 'All') {
      const collectionName = getBuildingCollectionName(building)
      const incidentsRef = doc(firestoreDb, collectionName, 'incidents')
      const incidentsDoc = await getDoc(incidentsRef)

      if (!incidentsDoc.exists()) {
        return { incidents: [] }
      }

      const data = incidentsDoc.data()
      return {
        incidents: (data.incidents || []).map((incident: any) => ({
          ...incident,
          id: incident.incidentId || incident.id,
        })),
      }
    }

    // Get from all buildings - would need buildings collection
    return { incidents: [] }
  },

  async createIncident(buildingName: string, incidentData: any) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const incidentsRef = doc(firestoreDb, collectionName, 'incidents')
    
    // Get existing incidents
    const incidentsDoc = await getDoc(incidentsRef)
    const existingData = incidentsDoc.exists() ? incidentsDoc.data() : {}
    const incidents = existingData.incidents || []
    
    // Add new incident
    const newIncident = {
      ...incidentData,
      id: incidentData.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'open', // Default status
    }
    
    incidents.push(newIncident)
    
    // Save back to Firestore
    if (incidentsDoc.exists()) {
      await updateDoc(incidentsRef, { incidents })
    } else {
      await setDoc(incidentsRef, { incidents })
    }
    
    return { message: 'Incident created successfully.', status: true, id: newIncident.id }
  },
}

// Floor Maps
export const firestoreFloorMaps = {
  async getBuildingFloorMaps(buildingName: string) {
    const firestoreDb = checkFirebase()
    
    // Try with building name as-is first
    let floorMapsRef = collection(firestoreDb, 'FloorMaps', buildingName, 'floors')
    let snapshot = await getDocs(floorMapsRef)
    
    // If no results, try with BuildingDB suffix
    if (snapshot.empty && !buildingName.endsWith('BuildingDB')) {
      const buildingNameWithSuffix = `${buildingName}BuildingDB`
      floorMapsRef = collection(firestoreDb, 'FloorMaps', buildingNameWithSuffix, 'floors')
      snapshot = await getDocs(floorMapsRef)
    }
    
    // If still no results, try without BuildingDB suffix if it was there
    if (snapshot.empty && buildingName.endsWith('BuildingDB')) {
      const buildingNameWithoutSuffix = buildingName.replace('BuildingDB', '')
      floorMapsRef = collection(firestoreDb, 'FloorMaps', buildingNameWithoutSuffix, 'floors')
      snapshot = await getDocs(floorMapsRef)
    }

    console.log(`Found ${snapshot.docs.length} floors for building ${buildingName}`)

    return {
      floors: snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.id, // Use document ID as floor name
        floorPlanName: doc.data().floorPlanName || doc.id,
        floorName: doc.data().floorName || doc.id,
        ...doc.data(),
      })),
    }
  },

  async getFloorMap(buildingName: string, floorName: string) {
    const firestoreDb = checkFirebase()
    const floorMapRef = doc(firestoreDb, 'FloorMaps', buildingName, 'floors', floorName)
    const floorMapDoc = await getDoc(floorMapRef)

    if (!floorMapDoc.exists()) {
      return null
    }

    const floorMapData = floorMapDoc.data()

    // Get asset mappings
    const mappingsRef = collection(firestoreDb, 'FloorMaps', buildingName, 'floors', floorName, 'assetMappings')
    const mappingsSnapshot = await getDocs(mappingsRef)

    const assets = mappingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      imageUrl: floorMapData.imageUrl,
      assets,
    }
  },

  async getActiveStatus(buildingName: string, floorPlanName: string) {
    const firestoreDb = checkFirebase()
    const floorMapRef = doc(firestoreDb, 'FloorMaps', buildingName, 'floors', floorPlanName)
    const mappingsRef = collection(floorMapRef, 'assetMappings')
    const mappingsSnapshot = await getDocs(mappingsRef)

    const activeStatuses: Record<string, any> = {}
    mappingsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      activeStatuses[doc.id] = {
        active: data.active || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      }
    })

    return {
      assets: Object.entries(activeStatuses).map(([id, status]) => ({
        id,
        activity: status.active,
      })),
    }
  },
}

// Real-time listeners
export const firestoreListeners = {
  // Listen to alarm details changes
  subscribeToAlarmDetails(
    buildingName: string,
    callback: (data: { fire: number; trouble: number; supervisory: number }) => void
  ): Unsubscribe {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const alarmRef = doc(firestoreDb, collectionName, 'alarmDetails')
    
    return onSnapshot(alarmRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          fire: data.totalFire || 0,
          trouble: data.totalTrouble || 0,
          supervisory: data.totalSupervisory || 0,
        })
      }
    })
  },

  // Listen to messages changes
  subscribeToMessages(
    buildingName: string,
    callback: (messages: any[]) => void
  ): Unsubscribe {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const messagesRef = doc(firestoreDb, collectionName, 'alarmMessage')
    
    return onSnapshot(messagesRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const messages = data.alarmMessage || data.messages || []
        // Ensure messages is an array
        const messagesArray = Array.isArray(messages) ? messages : []
        callback(messagesArray)
      } else {
        callback([])
      }
    }, (error) => {
      console.error('Error in subscribeToMessages:', error)
      callback([])
    })
  },

  // Listen to mimic/device status
  subscribeToMimic(
    buildingName: string,
    callback: (devices: any[]) => void
  ): Unsubscribe {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const mimicRef = doc(firestoreDb, collectionName, 'mimic')
    const mimicMapRef = doc(firestoreDb, collectionName, 'mimicMap')
    
    let mimicData: any = {}
    let mimicMapData: any = {}

    const unsubscribeMimic = onSnapshot(mimicRef, (doc) => {
      if (doc.exists()) {
        mimicData = doc.data()
        updateDevices()
      }
    })

    const unsubscribeMimicMap = onSnapshot(mimicMapRef, (doc) => {
      if (doc.exists()) {
        mimicMapData = doc.data()
        updateDevices()
      }
    })

    const updateDevices = () => {
      const mimicDetails = mimicMapData.mimicDetails || []
      const devicesArray = Array.isArray(mimicDetails)
        ? mimicDetails
        : Object.values(mimicDetails)

      const devices = devicesArray.map((device: any) => {
        const pseudo = device.pseudo || device
        const status = mimicData[pseudo] === '1' ? 'active' : 'inactive'
        
        return {
          id: pseudo,
          name: device.name || device,
          pseudo,
          status,
        }
      })

      callback(devices)
    }

    // Return combined unsubscribe
    return () => {
      unsubscribeMimic()
      unsubscribeMimicMap()
    }
  },
}

// Alarm Reasons
export const firestoreAlarmReasons = {
  async saveAlarmReason(
    buildingName: string,
    messageId: string,
    alarmType: 'False Alarm' | 'Actual Alarm',
    reason?: string,
    messageText?: string,
    timestamp?: string,
    flaggedBy?: string
  ) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const alarmReasonsRef = doc(firestoreDb, collectionName, 'AlarmReasons')
    
    // Get existing document
    const alarmReasonsDoc = await getDoc(alarmReasonsRef)
    const existingData = alarmReasonsDoc.exists() ? alarmReasonsDoc.data() : {}
    const existingReasons = existingData.reasons || []
    
    // Check if reason already exists for this messageId
    const reasonIndex = existingReasons.findIndex((r: any) => r.messageId === messageId)
    
    const newReason = {
      messageId,
      alarmType,
      reason: reason || '',
      messageText: messageText || '',
      timestamp: timestamp || new Date().toISOString(),
      flaggedAt: new Date().toISOString(),
      flaggedBy: flaggedBy || 'unknown',
    }
    
    if (reasonIndex >= 0) {
      // Update existing reason
      existingReasons[reasonIndex] = newReason
    } else {
      // Add new reason
      existingReasons.push(newReason)
    }
    
    // Save to Firestore
    await setDoc(alarmReasonsRef, {
      reasons: existingReasons,
      lastUpdated: new Date().toISOString(),
    }, { merge: true })
    
    return { message: 'Alarm reason saved successfully.', status: true }
  },

  async getAlarmReason(buildingName: string, messageId: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const alarmReasonsRef = doc(firestoreDb, collectionName, 'AlarmReasons')
    const alarmReasonsDoc = await getDoc(alarmReasonsRef)
    
    if (!alarmReasonsDoc.exists()) {
      return null
    }
    
    const data = alarmReasonsDoc.data()
    const reasons = data.reasons || []
    return reasons.find((r: any) => r.messageId === messageId) || null
  },

  async getAllAlarmReasons(buildingName: string) {
    const firestoreDb = checkFirebase()
    const collectionName = getBuildingCollectionName(buildingName)
    const alarmReasonsRef = doc(firestoreDb, collectionName, 'AlarmReasons')
    const alarmReasonsDoc = await getDoc(alarmReasonsRef)
    
    if (!alarmReasonsDoc.exists()) {
      return { reasons: [] }
    }
    
    const data = alarmReasonsDoc.data()
    return {
      reasons: data.reasons || [],
    }
  },
}
