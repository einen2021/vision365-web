// Test script to verify API endpoints
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://einen-backend-430199503919.asia-south1.run.app'

// Test endpoints
const endpoints = {
  login: `${BASE_URL}/login`,
  listmessages: `${BASE_URL}/list-messages`,
  alarmdetails: `${BASE_URL}/buildings/alarm-details`,
  allbuildings: `${BASE_URL}/building`,
  getAllCommunities: `${BASE_URL}/community`,
}

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n=== Testing ${name} ===`)
  console.log(`URL: ${url}`)
  console.log(`Method: ${method}`)
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(url, options)
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log(`Response:`, JSON.stringify(data, null, 2))
    } else {
      const text = await response.text()
      console.log(`Response (text):`, text.substring(0, 200))
    }
    
    return { success: response.ok, status: response.status }
  } catch (error) {
    console.error(`Error:`, error.message)
    console.error(`Stack:`, error.stack)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...')
  console.log(`Base URL: ${BASE_URL}\n`)
  
  // Test 1: Login endpoint (POST)
  await testEndpoint('Login', endpoints.login, 'POST', {
    email: 'test@example.com',
    password: 'test123',
  })
  
  // Test 2: List Messages (POST)
  await testEndpoint('List Messages', endpoints.listmessages, 'POST', {
    page: 1,
    limit: 10,
  })
  
  // Test 3: Alarm Details (POST)
  await testEndpoint('Alarm Details', endpoints.alarmdetails, 'POST', {
    community: '',
    building: '',
  })
  
  // Test 4: All Buildings (GET)
  await testEndpoint('All Buildings', endpoints.allbuildings, 'GET')
  
  // Test 5: All Communities (GET)
  await testEndpoint('All Communities', endpoints.getAllCommunities, 'GET')
  
  console.log('\n=== Tests Complete ===')
}

// Run tests
runTests().catch(console.error)

