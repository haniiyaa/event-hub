# 🚀 Event Hub API - Quick Reference for Postman

## 📋 Base Setup
- **Base URL**: `http://localhost:8080`
- **Auth Type**: Basic Auth for protected endpoints
- **Content-Type**: `application/json` for POST/PUT requests

---

## 🔑 Test Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Club Admin | `student1` | `pass123` |
| Student | `student2` | `pass123` |

---

## 📋 Essential Test Sequence

### 1️⃣ **Setup Phase** (Run Once)
```bash
# Start Application First!
.\mvnw.cmd spring-boot:run
```

| Order | Method | Endpoint | Purpose |
|-------|--------|----------|---------|
| 1 | POST | `/api/auth/register` | Register admin |
| 2 | POST | `/api/auth/register` | Register student1 |
| 3 | POST | `/api/admin/promote-club-admin/2` | Promote to club admin |

### 2️⃣ **Core Testing** (Main Features)
| Order | Method | Endpoint | Auth | Purpose |
|-------|--------|----------|------|---------|
| 4 | POST | `/api/auth/login` | None | Login as club admin |
| 5 | POST | `/api/club-admin/club` | student1:pass123 | Create club |
| 6 | POST | `/api/club-admin/events` | student1:pass123 | Create event |
| 7 | GET | `/api/club-admin/dashboard` | student1:pass123 | View dashboard |

### 3️⃣ **Security Testing** (Verify Restrictions)
| Test | Method | Endpoint | Auth | Expected |
|------|--------|----------|------|----------|
| Duplicate Club | POST | `/api/club-admin/club` | student1:pass123 | 400 Error |
| Wrong Role | GET | `/api/admin/users` | student1:pass123 | 403 Forbidden |
| No Auth | GET | `/api/club-admin/club` | None | 401 Unauthorized |

---

## 📝 Sample JSON Bodies

### Register User
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

### Create Club
```json
{
  "name": "Tech Club",
  "description": "A club for technology enthusiasts and programmers"
}
```

### Create Event
```json
{
  "title": "Java Workshop",
  "description": "Learn Spring Boot development",
  "eventDate": "2025-10-15T14:00:00",
  "location": "Computer Lab A",
  "capacity": 30
}
```

### Update Capacity
```json
{
  "capacity": 40
}
```

### Create Instruction
```json
{
  "title": "Pre-Workshop Requirements",
  "content": "Please bring your laptop with Java 11+ installed.",
  "isImportant": true
}
```

---

## ⚡ Quick Test Results Check

### ✅ Success Indicators
- **Status 200**: Request successful
- **Status 201**: Resource created
- **JSON Response**: Contains expected data
- **Role Enforcement**: Proper access control

### ❌ Expected Failures
- **400 Bad Request**: Duplicate club creation
- **401 Unauthorized**: Missing authentication
- **403 Forbidden**: Wrong role access
- **404 Not Found**: Non-existent resource

---

## 🔧 Postman Tips

1. **Create Collection**: "Event Hub API Tests"
2. **Set Environment**: 
   - `baseUrl` = `http://localhost:8080`
   - `adminAuth` = `admin:admin123`
   - `clubAdminAuth` = `student1:pass123`
3. **Use Variables**: `{{baseUrl}}/api/auth/login`
4. **Save Requests**: Keep successful tests for retesting

---

## 🎯 Key Validations

| Feature | Test | What to Verify |
|---------|------|----------------|
| Authentication | Login/Register | Status 200, correct role returned |
| Authorization | Role-based access | 403 for wrong roles, 200 for correct |
| Business Rules | One club per admin | 400 error on second club creation |
| Data Flow | Create → Read → Update | Consistent data across operations |
| Error Handling | Invalid requests | Appropriate HTTP status codes |

---

## 📞 Need Help?

**Application Won't Start?**
- Check PostgreSQL is running
- Verify port 8080 is free
- Check application.properties database config

**Tests Failing?**
- Verify you followed the sequence
- Check authentication credentials
- Ensure proper JSON format
- Check response status codes

**Ready to Test?** Start with the detailed guide in `POSTMAN_TESTING_GUIDE.md`! 🚀