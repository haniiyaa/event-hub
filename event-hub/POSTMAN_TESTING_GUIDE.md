# 🧪 Event Hub API Testing Guide - Postman Manual Testing

## 📋 Prerequisites

1. **Start the Application**
   ```bash
   cd "c:\Users\nihal\OneDrive\Desktop\event hub\event-hub"
   .\mvnw.cmd spring-boot:run
   ```
   Wait for the message: `Started EventHubApplication in X.XXX seconds`

2. **Open Postman**
   - Download from: https://www.postman.com/downloads/
   - Create a new Collection called "Event Hub API Tests"

3. **Base URL**
   ```
   http://localhost:8080
   ```

---

## 🔧 Postman Setup

### Create Environment Variables
1. In Postman, click "Environments" → "Create Environment"
2. Name it "Event Hub Local"
3. Add these variables:
   - `baseUrl` = `http://localhost:8080`
   - `adminUsername` = `admin`
   - `adminPassword` = `admin123`
   - `studentUsername` = `student1`
   - `studentPassword` = `pass123`

---

## 🧪 Testing Steps (Follow in Order)

### **Phase 1: Authentication Setup**

#### **Test 1: Register Super Admin**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin",
    "password": "admin123",
    "email": "admin@college.edu",
    "fullName": "Super Administrator",
    "phoneNumber": "+1-555-0100",
    "classDetails": "Administration"
  }
  ```
- **Expected**: Status 200, success message
- **Note**: This creates the super admin account

#### **Test 2: Register Student (Future Club Admin)**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "student1",
    "password": "pass123",
    "email": "student1@college.edu",
    "fullName": "John Doe",
    "phoneNumber": "+1-555-0101",
    "classDetails": "Computer Science - Class of 2026"
  }
  ```
- **Expected**: Status 200, success message

#### **Test 3: Register Another Student**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "student2",
    "password": "pass123",
    "email": "student2@college.edu",
    "fullName": "Jane Smith",
    "phoneNumber": "+1-555-0102",
    "classDetails": "Information Systems - Class of 2027"
  }
  ```
- **Expected**: Status 200, success message

---

### **Phase 2: Admin Operations**

#### **Test 4: Admin Login**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Expected**: Status 200, user info with role "ADMIN"

#### **Test 5: Get Current User Info**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/auth/me`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `admin`
  - Password: `admin123`
- **Expected**: Status 200, admin user details

#### **Test 6: View All Users**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/users`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `admin`
  - Password: `admin123`
- **Expected**: Status 200, list of all registered users
- **📝 Important**: Note the `id` of `student1` for the next step

#### **Test 7: Promote Student to Club Admin**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/admin/promote-club-admin/2`
  - ⚠️ **Replace `2` with actual user ID of `student1` from Test 6**
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `admin`
  - Password: `admin123`
- **Expected**: Status 200, confirmation message

---

### **Phase 3: Club Admin Operations**

#### **Test 8: Club Admin Login**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "student1",
    "password": "pass123"
  }
  ```
- **Expected**: Status 200, user info with role "CLUB_ADMIN"

#### **Test 9: Create Club**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/club-admin/club`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "name": "Tech Club",
    "description": "A club for technology enthusiasts and programmers"
  }
  ```
- **Expected**: Status 200, club details with ID

#### **Test 10: Try to Create Second Club (Should Fail)**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/club-admin/club`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "name": "Science Club",
    "description": "Another club - should fail"
  }
  ```
- **Expected**: Status 400, error message about one club limit

#### **Test 11: Get My Club**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/club`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Expected**: Status 200, club details

---

### **Phase 4: Event Management**

#### **Test 12: Create Event**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/club-admin/events`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "title": "Java Workshop",
    "description": "Learn Spring Boot development",
    "eventDate": "2025-10-15T14:00:00",
    "location": "Computer Lab A",
    "capacity": 30
  }
  ```
- **Expected**: Status 200, event details with ID
- **📝 Important**: Note the event `id` for subsequent tests

#### **Test 13: Create Another Event**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/club-admin/events`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "title": "Python Bootcamp",
    "description": "Introduction to Python programming",
    "eventDate": "2025-10-20T10:00:00",
    "location": "Auditorium B",
    "capacity": 50
  }
  ```
- **Expected**: Status 200, second event details

#### **Test 14: Get All My Events**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/events`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Expected**: Status 200, list of both events

#### **Test 15: Update Event Capacity**
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/club-admin/events/1/capacity`
  - ⚠️ **Replace `1` with actual event ID from Test 12**
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "capacity": 40
  }
  ```
- **Expected**: Status 200, updated event details

#### **Test 16: Get Event Statistics**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/events/1/stats`
  - ⚠️ **Replace `1` with actual event ID**
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Expected**: Status 200, detailed event statistics

#### **Test 17: Create Event Instruction**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/club-admin/events/1/instructions`
  - ⚠️ **Replace `1` with actual event ID**
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "title": "Pre-Workshop Requirements",
    "content": "Please bring your laptop with Java 11+ installed. We'll cover Spring Boot basics.",
    "isImportant": true
  }
  ```
- **Expected**: Status 200, instruction details

#### **Test 18: Get Dashboard**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/dashboard`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Expected**: Status 200, complete dashboard with club and events

---

### **Phase 5: Security Testing**

#### **Test 19: Try Club Admin Endpoint as Student (Should Fail)**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/club`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student2`
  - Password: `pass123`
- **Expected**: Status 403, access denied

#### **Test 20: Try Admin Endpoint as Club Admin (Should Fail)**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/users`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Expected**: Status 403, access denied

#### **Test 21: Try Without Authentication (Should Fail)**
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/club-admin/dashboard`
- **Authorization**: None
- **Expected**: Status 401, unauthorized

---

### **Phase 6: Error Testing**

#### **Test 22: Duplicate Username Registration**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin",
    "password": "newpass",
    "email": "newemail@test.com",
    "fullName": "New User",
    "phoneNumber": "+1-555-0199",
    "classDetails": "Test Case"
  }
  ```
- **Expected**: Status 400, username exists error

#### **Test 23: Invalid Login**
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin",
    "password": "wrongpassword"
  }
  ```
- **Expected**: Status 401, invalid credentials

#### **Test 24: Update Non-existent Event**
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/club-admin/events/999/capacity`
- **Authorization**: 
  - Type: `Basic Auth`
  - Username: `student1`
  - Password: `pass123`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "capacity": 100
  }
  ```
- **Expected**: Status 404, not found

---

## 📊 Expected Results Summary

### ✅ **Success Scenarios** (Should Return 200)
- User registration (Tests 1-3)
- User login (Tests 4, 8)
- Get user info (Test 5)
- Admin operations (Tests 6-7)
- Club creation (Test 9)
- Get club (Test 11)
- Event operations (Tests 12-18)

### ❌ **Failure Scenarios** (Should Return 4xx)
- Second club creation (Test 10) → 400
- Unauthorized access (Tests 19-21) → 403/401
- Duplicate registration (Test 22) → 400
- Invalid login (Test 23) → 401
- Non-existent resource (Test 24) → 404

---

## 🎯 Key Features to Verify

1. **✅ Role-based Access Control**
   - Only admins can promote users
   - Only club admins can manage clubs/events
   - Proper authentication required

2. **✅ Business Logic**
   - One club per admin restriction
   - Event capacity management
   - Registration tracking

3. **✅ Data Integrity**
   - Proper foreign key relationships
   - Cascade operations
   - Data validation

4. **✅ Error Handling**
   - Appropriate HTTP status codes
   - Meaningful error messages
   - Security boundaries

---

## 🚀 Pro Tips for Postman Testing

1. **Save Your Tests**: Save each request in a collection for reuse
2. **Use Variables**: Leverage environment variables for easy URL/auth management
3. **Check Response**: Always verify both status code and response body
4. **Test Scripts**: Add test scripts to automate validation
5. **Documentation**: Use Postman's documentation feature to share tests

---

## 📞 Troubleshooting

**Application Not Starting?**
- Check if port 8080 is free
- Verify PostgreSQL is running
- Check database credentials in application.properties

**Authentication Failing?**
- Ensure you're using Basic Auth
- Check username/password spelling
- Verify user was promoted to correct role

**Database Errors?**
- Check PostgreSQL connection
- Verify database 'eventhub' exists
- Check credentials in application.properties

---

## 🎉 Success Confirmation

If all tests pass, you'll have verified:
- ✅ Complete user management system
- ✅ Role-based security
- ✅ Club admin functionality
- ✅ Event management
- ✅ Error handling
- ✅ Business rule enforcement

**Your Event Hub API is fully functional!** 🚀