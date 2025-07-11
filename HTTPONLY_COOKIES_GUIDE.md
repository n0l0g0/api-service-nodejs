# HttpOnly Cookies Authentication Guide

## ภาพรวม

API Service ได้ถูกอัปเดตให้รองรับ HttpOnly Cookies สำหรับการจัดการ authentication แทนการเก็บ JWT tokens ใน localStorage หรือ sessionStorage ซึ่งเป็นแนวทางที่ปลอดภัยกว่า

## คุณสมบัติหลัก

### 🔐 ความปลอดภัยที่เพิ่มขึ้น
- **HttpOnly Cookies**: ป้องกันการเข้าถึง tokens ผ่าน JavaScript
- **Secure Flag**: ใช้ HTTPS ใน production environment
- **SameSite Protection**: ป้องกัน CSRF attacks
- **Automatic Expiration**: กำหนดอายุ cookies อัตโนมัติ

### 🔄 Backward Compatibility
- รองรับทั้ง HttpOnly cookies และ Authorization header
- ระบบจะลองอ่าน cookies ก่อน จากนั้น fallback เป็น header
- ไม่ต้องเปลี่ยนแปลง client code ที่มีอยู่ทันที

### 🚀 API Endpoints ใหม่

## Authentication Endpoints

### POST `/api/auth/cookies`
ตั้งค่า authentication cookies จาก access token

**Request Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication cookies set successfully",
  "cookiesSet": {
    "accessToken": true,
    "refreshToken": true
  }
}
```

### GET `/api/auth/verify`
ตรวจสอบสถานะการเข้าสู่ระบบจาก cookies

**Response:**
```json
{
  "success": true,
  "message": "Authentication verified successfully",
  "authenticated": true,
  "user": {
    "id": "user123",
    "username": "john.doe",
    "email": "john@example.com",
    "requiredDuo": false,
    "duoVerified": false
  },
  "tokenSource": "cookie"
}
```

### GET `/api/auth/profile`
ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "user": {
    "id": "user123",
    "username": "john.doe",
    "email": "john@example.com",
    "requiredDuo": false,
    "duoVerified": false
  },
  "tokenSource": "cookie"
}
```

### POST `/api/auth/logout`
ล็อกเอาต์และลบ authentication cookies

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "authenticated": false
}
```

### GET `/api/auth/health`
ตรวจสอบสถานะ health ของระบบ authentication

**Response:**
```json
{
  "success": true,
  "message": "Auth system health check",
  "status": "healthy",
  "features": {
    "httpOnlyCookies": true,
    "fallbackHeaderAuth": true,
    "duoSupport": true
  },
  "currentRequest": {
    "hasAuthCookies": true,
    "isAuthenticated": true,
    "tokenSource": "cookie",
    "user": "john.doe"
  }
}
```

## Health Check Endpoints

### GET `/api/health`
ตรวจสอบสถานะระบบทั้งหมด (รวม auth status)

### GET `/api/health/simple`
ตรวจสอบสถานะแบบง่าย (สำหรับ load balancer)

### GET `/api/health/database`
ตรวจสอบสถานะการเชื่อมต่อ database

## การใช้งานใน Frontend

### 1. Login Process
```javascript
// หลังจากได้ access token จาก auth service
const response = await fetch('/api/auth/cookies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // สำคัญ: เพื่อส่ง cookies
  body: JSON.stringify({
    accessToken: token,
    refreshToken: refreshToken // optional
  })
});
```

### 2. Authenticated Requests
```javascript
// ไม่ต้องเพิ่ม Authorization header แล้ว
const response = await fetch('/api/aircraft', {
  method: 'GET',
  credentials: 'include', // สำคัญ: เพื่อส่ง cookies
});
```

### 3. Check Authentication Status
```javascript
const response = await fetch('/api/auth/verify', {
  method: 'GET',
  credentials: 'include',
});

const { authenticated, user } = await response.json();
```

### 4. Logout
```javascript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

## การตั้งค่า Environment Variables

เพิ่มใน `.env` file:

```env
# Frontend URL สำหรับ CORS
FRONTEND_URL=http://localhost:3000

# JWT Secret (ต้องเหมือนกับ auth service)
JWT_SECRET=your-jwt-secret-key

# Environment
NODE_ENV=development
```

## Cookie Configuration

### Cookie Names
- `access_token`: เก็บ JWT access token
- `refresh_token`: เก็บ JWT refresh token (optional)

### Cookie Options
- **HttpOnly**: `true` - ป้องกันการเข้าถึงผ่าน JavaScript
- **Secure**: `true` ใน production - ใช้ HTTPS เท่านั้น
- **SameSite**: `strict` ใน production, `lax` ใน development
- **MaxAge**: 24 ชั่วโมง สำหรับ access token, 7 วัน สำหรับ refresh token
- **Path**: `/` - ใช้ได้กับทุก path

## Security Features

### 1. CSRF Protection
- ใช้ SameSite cookies
- ตรวจสอบ Origin header
- ไม่ยอมรับ simple GET requests สำหรับ sensitive operations

### 2. XSS Protection
- HttpOnly cookies ไม่สามารถเข้าถึงผ่าน JavaScript ได้
- ป้องกันการขโมย tokens ผ่าน XSS attacks

### 3. Secure Transmission
- ใช้ Secure flag ใน production
- บังคับใช้ HTTPS

### 4. Automatic Cleanup
- Cookies หมดอายุอัตโนมัติ
- ลบ cookies เมื่อ logout

## Middleware Types

### 1. `verifyToken`
- รองรับทั้ง cookies และ Authorization header
- ใช้สำหรับ protected routes ส่วนใหญ่

### 2. `requireCookieAuth`
- บังคับให้ใช้ cookies เท่านั้น
- ใช้สำหรับ sensitive operations

### 3. `optionalAuth`
- Authentication เป็น optional
- ใช้สำหรับ endpoints ที่แสดงข้อมูลเพิ่มเติมถ้าล็อกอินแล้ว

## Troubleshooting

### Common Issues

1. **Cookies ไม่ถูกส่ง**
   - ตรวจสอบว่าใช้ `credentials: 'include'` ใน fetch
   - ตรวจสอบ CORS configuration

2. **Authentication ไม่ทำงาน**
   - ตรวจสอบ JWT_SECRET ว่าเหมือนกับ auth service
   - ตรวจสอบ cookie expiration

3. **CORS Errors**
   - ตรวจสอบ FRONTEND_URL ใน environment variables
   - ตรวจสอบว่า credentials: true ใน CORS config

### Debug Information

ใช้ `/api/auth/health` เพื่อดูข้อมูล debug:
- สถานะ authentication
- Token source (cookie หรือ header)
- Cookie information

## Migration Guide

### จาก localStorage/sessionStorage เป็น HttpOnly Cookies

1. **อัปเดต login process**:
   - เรียก `/api/auth/cookies` หลังจากได้ token
   - ลบการเก็บ token ใน localStorage

2. **อัปเดต API calls**:
   - เพิ่ม `credentials: 'include'` ใน fetch options
   - ลบ Authorization header (optional, ยังใช้ได้)

3. **อัปเดต authentication check**:
   - ใช้ `/api/auth/verify` แทนการตรวจสอบ localStorage

4. **อัปเดต logout**:
   - เรียก `/api/auth/logout` เพื่อลบ cookies
   - ลบการลบ localStorage 