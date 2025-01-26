#!/bin/bash

# Base URL
BASE_URL="http://localhost:5111/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting API Tests..."

# 1. Login as Super Admin
echo -e "\n${GREEN}1. Login as Super Admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/user/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "super@admin.com",
    "password": "SuperAdmin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get super admin token${NC}"
    exit 1
fi

# 2. Create School
echo -e "\n${GREEN}2. Creating School${NC}"
SCHOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/school/create" \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" \
  -d '{
    "name": "Test School",
    "address": "123 Test Street"
  }')

SCHOOL_ID=$(echo $SCHOOL_RESPONSE | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$SCHOOL_ID" ]; then
    echo -e "${RED}Failed to get school ID${NC}"
    exit 1
fi

# 3. Create School Admin
echo -e "\n${GREEN}3. Creating School Admin${NC}"
ADMIN_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/user/createUser" \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" \
  -d '{
    "email": "schooladmin@test.com",
    "password": "Admin@123",
    "role": "admin",
    "schoolID": "'$SCHOOL_ID'"
  }')

sleep 1

# 4. Login as School Admin
echo -e "\n${GREEN}4. Login as School Admin${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/user/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "schooladmin@test.com",
    "password": "Admin@123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Failed to get admin token${NC}"
    exit 1
fi

# 5. Create Classroom
echo -e "\n${GREEN}5. Creating Classroom${NC}"
CLASSROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/classroom/create" \
  -H "Content-Type: application/json" \
  -H "token: $ADMIN_TOKEN" \
  -d '{
    "name": "Class 5A",
    "schoolID": "'$SCHOOL_ID'"
  }')

CLASSROOM_ID=$(echo $CLASSROOM_RESPONSE | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$CLASSROOM_ID" ]; then
    echo -e "${RED}Failed to create classroom${NC}"
    exit 1
fi

# 6. Create Student
echo -e "\n${GREEN}6. Creating Student${NC}"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/student/create" \
  -H "Content-Type: application/json" \
  -H "token: $ADMIN_TOKEN" \
  -d '{
    "name": "John Doe",
    "age": 10,
    "classroomID": "'$CLASSROOM_ID'"
  }')

# 7. Get All Schools
echo -e "\n${GREEN}7. Getting All Schools${NC}"
curl -s -X GET "$BASE_URL/school/getAll" \
  -H "token: $TOKEN" | python3 -m json.tool

# 8. Get All Classrooms
echo -e "\n${GREEN}8. Getting All Classrooms${NC}"
curl -s -X GET "$BASE_URL/classroom/getAll" \
  -H "token: $ADMIN_TOKEN" | python3 -m json.tool

# 9. Get All Students
echo -e "\n${GREEN}9. Getting All Students${NC}"
curl -s -X GET "$BASE_URL/student/getAll" \
  -H "token: $ADMIN_TOKEN" | python3 -m json.tool

echo -e "\n${GREEN}API Tests Completed${NC}"