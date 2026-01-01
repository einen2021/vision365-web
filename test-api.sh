#!/bin/bash

# Test API endpoints with curl
BASE_URL="https://einen-backend-430199503919.asia-south1.run.app"

echo "Testing API Endpoints"
echo "===================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Login
echo "1. Testing Login endpoint (POST /login)"
curl -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -30
echo ""
echo "---"
echo ""

# Test 2: List Messages
echo "2. Testing List Messages endpoint (POST /list-messages)"
curl -X POST "$BASE_URL/list-messages" \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":10}' \
  -v \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -30
echo ""
echo "---"
echo ""

# Test 3: Alarm Details
echo "3. Testing Alarm Details endpoint (POST /buildings/alarm-details)"
curl -X POST "$BASE_URL/buildings/alarm-details" \
  -H "Content-Type: application/json" \
  -d '{"community":"","building":""}' \
  -v \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -30
echo ""
echo "---"
echo ""

# Test 4: All Buildings
echo "4. Testing All Buildings endpoint (GET /building/all)"
curl -X GET "$BASE_URL/building/all" \
  -H "Content-Type: application/json" \
  -v \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -30
echo ""
echo "---"
echo ""

# Test 5: All Communities
echo "5. Testing All Communities endpoint (GET /community/all)"
curl -X GET "$BASE_URL/community/all" \
  -H "Content-Type: application/json" \
  -v \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -30
echo ""
echo "===================="
echo "Tests Complete"


