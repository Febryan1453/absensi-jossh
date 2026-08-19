# 🏫 School Attendance System REST API (Project Absensi)

Enterprise-grade REST API untuk Sistem Absensi Sekolah berbasis **Node.js**, **Express.js**, **MySQL 8+**, **JWT Authentication**, **Role-Based Access Control (RBAC)**, dan **Layered Architecture**.

---

## 📑 Daftar Isi

1. [Project Overview](#-project-overview)
2. [Architecture & Design Pattern](#-architecture--design-pattern)
3. [Project Structure](#-project-structure)
4. [Assumptions & Business Rules [ASSUMPTION]](#-assumptions--business-rules-assumption)
5. [Prerequisites & Requirements](#-prerequisites--requirements)
6. [Database Setup & Migration](#-database-setup--migration)
7. [Installation & Setup](#-installation--setup)
8. [Running the Application](#-running-the-application)
9. [Authentication & Authorization](#-authentication--authorization)
10. [API Security](#-api-security)
11. [Complete API Endpoints](#-complete-api-endpoints)
12. [Business Logic & Database Transactions](#-business-logic--database-transactions)
13. [Example Request & Response](#-example-request--response)
14. [Testing with Postman](#-testing-with-postman)

---

## 🎯 Project Overview

Project ini menyediakan REST API lengkap untuk mengelola absensi siswa, absensi mengajar guru, sesi sekolah, tahun ajaran, kelas, mata pelajaran, ruang, perangkat keras absensi (QR / RFID / NFC / Face Recognition), audit trail (attendance events), dan notifikasi otomatis ke orang tua murid.

Database schema `schema.sql` diperlakukan sebagai **Single Source of Truth** tanpa mengubah table, kolom, relasi, ataupun foreign keys yang ada.

---

## 🏗 Architecture & Design Pattern

Sistem dibangun menggunakan **Layered Architecture (N-Tier Architecture)** dengan pemisahan tanggung jawab (Separation of Concerns) yang ketat:

```
Client (Web / Mobile / IoT Attendance Scanner)
   ↓
Middlewares (Helmet, CORS, RateLimiter, JWT Auth, RBAC, Validation)
   ↓
Router (Routing & Endpoint Mapping only - No SQL, No Business Logic)
   ↓
Controller (HTTP Request/Response Handling, Input Extraction, Status Codes)
   ↓
Service (Business Logic, Validation Rules, Transactions, Notifications)
   ↓
Repository (Data Access Layer, Parameterized SQL Queries, CRUD, Joins)
   ↓
MySQL 8+ Connection Pool (InnoDB, utf8mb4, ACID Transactions)
```

### Tanggung Jawab Setiap Layer:
* **Router**: Hanya memetakan URL dan HTTP methods ke controller dan middleware yang bersangkutan.
* **Controller**: Menerima request HTTP, mengekstrak params/query/body, memanggil Service, dan mengembalikan response JSON seragam via `ApiResponse`.
* **Service**: Pusat business logic, orchestrator transaksi multi-tabel (`withTransaction`), validasi aturan bisnis, dan pembuatan notifikasi.
* **Repository**: Layer akses database murni menggunakan query terparameterisasi (`mysql2/promise`), anti SQL-injection, tanpa logic HTTP.
* **Middleware**: Autentikasi token JWT (`authenticateToken`), verifikasi perangkat (`authenticateDevice`), otorisasi role (`requireRole`), validasi skema (`validate`), dan centralized error handler (`errorHandler`).

---

## 📂 Project Structure

```
backend/
│
├── src/
│   ├── app.js                          # Express app configuration (CORS, Helmet, Rate Limit, Router)
│   ├── server.js                       # Server entry point & graceful shutdown
│   │
│   ├── config/
│   │   └── database.js                 # MySQL connection pool & withTransaction helper
│   │
│   ├── controllers/                    # HTTP Controllers
│   │   ├── academicYear.controller.js
│   │   ├── attendanceEvent.controller.js
│   │   ├── auth.controller.js
│   │   ├── class.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── device.controller.js
│   │   ├── notification.controller.js
│   │   ├── parent.controller.js
│   │   ├── room.controller.js
│   │   ├── schoolSession.controller.js
│   │   ├── student.controller.js
│   │   ├── studentAttendance.controller.js
│   │   ├── subject.controller.js
│   │   ├── teacher.controller.js
│   │   ├── teacherAttendance.controller.js
│   │   └── teachingSchedule.controller.js
│   │
│   ├── services/                       # Business Logic & Transactions
│   │   ├── academicYear.service.js
│   │   ├── attendanceEvent.service.js
│   │   ├── auth.service.js
│   │   ├── class.service.js
│   │   ├── dashboard.service.js
│   │   ├── device.service.js
│   │   ├── notification.service.js
│   │   ├── parent.service.js
│   │   ├── room.service.js
│   │   ├── schoolSession.service.js
│   │   ├── student.service.js
│   │   ├── studentAttendance.service.js
│   │   ├── subject.service.js
│   │   ├── teacher.service.js
│   │   ├── teacherAttendance.service.js
│   │   └── teachingSchedule.service.js
│   │
│   ├── repositories/                   # Data Access Layer (SQL Queries)
│   │   ├── academicYear.repository.js
│   │   ├── attendanceEvent.repository.js
│   │   ├── class.repository.js
│   │   ├── device.repository.js
│   │   ├── notification.repository.js
│   │   ├── parent.repository.js
│   │   ├── room.repository.js
│   │   ├── schoolSession.repository.js
│   │   ├── student.repository.js
│   │   ├── studentAttendance.repository.js
│   │   ├── studentParent.repository.js
│   │   ├── subject.repository.js
│   │   ├── teacher.repository.js
│   │   ├── teacherAttendance.repository.js
│   │   ├── teachingSchedule.repository.js
│   │   └── user.repository.js
│   │
│   ├── routes/                         # Express Route Definitions
│   │   ├── academicYear.routes.js
│   │   ├── attendanceEvent.routes.js
│   │   ├── auth.routes.js
│   │   ├── class.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── device.routes.js
│   │   ├── index.js                    # Master Route /api/v1
│   │   ├── notification.routes.js
│   │   ├── parent.routes.js
│   │   ├── room.routes.js
│   │   ├── schoolSession.routes.js
│   │   ├── student.routes.js
│   │   ├── studentAttendance.routes.js
│   │   ├── subject.routes.js
│   │   ├── teacher.routes.js
│   │   ├── teacherAttendance.routes.js
│   │   └── teachingSchedule.routes.js
│   │
│   ├── middlewares/                    # Custom Middlewares
│   │   ├── auth.middleware.js          # JWT verification
│   │   ├── deviceAuth.middleware.js    # Hardware API Key authentication
│   │   ├── errorHandler.middleware.js  # Centralized Error Handler
│   │   ├── notFound.middleware.js      # 404 Route Handler
│   │   ├── role.middleware.js          # RBAC (admin, teacher, student, parent)
│   │   └── validation.middleware.js    # Request body & query validator
│   │
│   ├── validations/                    # Request Validation Schemas
│   │   ├── academicYear.validation.js
│   │   ├── auth.validation.js
│   │   ├── class.validation.js
│   │   ├── device.validation.js
│   │   ├── notification.validation.js
│   │   ├── parent.validation.js
│   │   ├── room.validation.js
│   │   ├── schoolSession.validation.js
│   │   ├── student.validation.js
│   │   ├── studentAttendance.validation.js
│   │   ├── subject.validation.js
│   │   ├── teacher.validation.js
│   │   ├── teacherAttendance.validation.js
│   │   └── teachingSchedule.validation.js
│   │
│   └── utils/                          # Helper Utilities
│       ├── appError.js                 # Standardized Error Classes
│       ├── date.js                     # Date & Time calculation helpers
│       ├── hash.js                     # Password bcrypt hashing
│       ├── jwt.js                      # JWT Sign & Verify
│       ├── response.js                 # Standard Success & Error response
│       └── validator.js                # Schema validation engine
│
├── database/
│   ├── schema.sql                      # Database Schema (Single Source of Truth)
│   └── seed.sql                        # Seed Sample Data
│
├── .env.example
├── .env
├── .gitignore
├── package.json
├── postman_collection.json
└── README.md
```

---

## 📌 Assumptions & Business Rules [ASSUMPTION]

Berikut adalah asumsi dan aturan bisnis yang diimplementasikan:

1. **[ASSUMPTION - Student Attendance Rule]**:
   - Satu siswa hanya boleh memiliki 1 record absensi per tanggal (dijamin oleh unique key `uq_student_attendance_date`).
   - Check-in membandingkan waktu server dengan `school_sessions`. Jika waktu check-in $\le$ `late_after`, status otomatis `present`. Jika waktu check-in $>$ `late_after`, status otomatis `late`.
   - Check-out membandingkan waktu server dengan `check_out_start`. Jika siswa check-out sebelum `check_out_start`, status adalah `early_leave`. Jika setelah `check_out_start`, status adalah `completed`.
   - Setiap Check-In dan Check-Out secara otomatis mencatat audit trail di tabel `attendance_events` dan membuat notifikasi di tabel `attendance_notifications` untuk seluruh orang tua yang terhubung (`can_receive_notification = TRUE`) dalam **satu transaksi atomic**.

2. **[ASSUMPTION - Teacher Attendance Rule]**:
   - Absensi guru terikat 1-ke-1 dengan jadwal mengajar (`teaching_schedules`) melalui unique key `uq_teacher_attendance_schedule`.
   - Check-in guru sebelum `start_time` berstatus `on_time`. Jika lewat dari `start_time`, berstatus `late`.
   - Check-out guru otomatis memperbarui status jadwal mengajar menjadi `completed`.

3. **[ASSUMPTION - Single Active Academic Year]**:
   - Hanya boleh ada 1 tahun ajaran (`academic_years`) yang berstatus `is_active = TRUE`. Ketika sebuah tahun ajaran diaktifkan, semua tahun ajaran lain otomatis dinonaktifkan dalam satu transaksi.

4. **[ASSUMPTION - Hardware Devices]**:
   - Perangkat keras scanner (QR scanner, mesin RFID/NFC, Face Recognition terminal) dapat melakukan request check-in/out menggunakan header `X-API-Key` atau `X-Device-UUID` tanpa perlu login user.

5. **[ASSUMPTION - Default User Credentials in Seed]**:
   - Semua user bawaan pada `seed.sql` memiliki password default: `password`.

---

## ⚙️ Prerequisites & Requirements

- **Node.js** v18+ (atau v20+ LTS)
- **MySQL** 8.0+ / MariaDB 10.4+ (misalnya dari Laragon / XAMPP / Docker)
- **npm** v9+

---

## 💾 Database Setup & Migration

### 1. Buka MySQL Client / Terminal
Pastikan MySQL service telah berjalan di port `3306`.

### 2. Import Schema
Jalankan query schema dari folder `database/schema.sql`:
```bash
mysql -u root -p < database/schema.sql
```
*Atau via Laragon / phpMyAdmin / DBeaver / MySQL Workbench: Buka file `database/schema.sql` dan eksekusi seluruh perintah SQL.*

### 3. Import Seed Data
Jalankan query data awal dari folder `database/seed.sql`:
```bash
mysql -u root -p < database/seed.sql
```

---

## 🚀 Installation & Setup

### 1. Masuk ke Direktori Backend
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin `.env.example` menjadi `.env` dan sesuaikan kredensial database Anda:
```bash
cp .env.example .env
```

Isi file `.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=project_absensi
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10

# JWT Secret
JWT_SECRET=super_secret_jwt_key_project_absensi_2026_change_in_production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

---

## 🏃 Running the Application

### Mode Development (dengan hot reload nodemon):
```bash
npm run dev
```

### Mode Production:
```bash
npm start
```

Output console yang diharapkan saat server berhasil berjalan:
```
✅ Connected to MySQL Database successfully.
====================================================
🚀 School Attendance REST API Server Running
📡 URL: http://localhost:5000
⚙️  Environment: development
🩺 Health Check: http://localhost:5000/api/v1/health
====================================================
```

---

## 🔐 Authentication & Authorization

### Default Accounts dari Seed:
| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **admin** | `admin@absensi.test` | `password` | Administrator Utama |
| **teacher** | `ahmad@absensi.test` | `password` | Guru / Pengajar |
| **student** | `budi.siswa@absensi.test` | `password` | Siswa |
| **parent** | `ayah.budi@absensi.test` | `password` | Orang Tua Siswa |

### JWT Authentication Flow:
1. Client mengirim request `POST /api/v1/auth/login` berisi `{ "email": "...", "password": "..." }`.
2. Server memvalidasi kecocokan password menggunakan `bcryptjs.compare`.
3. Server membuat JWT token berisi payload: `{ id, uuid, role, email, status }`.
4. Client menyertakan token di setiap request pada header:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```
5. Middleware `authenticateToken` memverifikasi token dan masa berlakunya.

### Pembuatan Akun (Account Provisioning):
Tidak ada self-service registration. `POST /api/v1/auth/register` **bukan endpoint publik**:
route ini dilindungi `authenticateToken` + `requireRole('admin')`, sehingga hanya admin yang
sudah login yang bisa membuat akun baru. Field `role` pada body memang menentukan role akun
yang dibuat (`admin` / `teacher` / `student` / `parent`), dan itu aman karena hanya admin yang
dapat mencapai endpoint tersebut. Request tanpa token dijawab `401`, request dengan token
non-admin dijawab `403`.

### Role Authorization Matrix:
| Resource / Action | Admin | Teacher | Student | Parent | Device Key |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Auth Login / Me / Change Password | ✅ | ✅ | ✅ | ✅ | - |
| Auth Register (pembuatan akun baru) | ✅ | ❌ | ❌ | ❌ | - |
| Academic Years & Classes CRUD | ✅ | ❌ | ❌ | ❌ | - |
| Teachers & Students CRUD | ✅ | ❌ | ❌ | ❌ | - |
| Teaching Schedules CRUD | ✅ | ❌ | ❌ | ❌ | - |
| Hardware Device Management | ✅ | ❌ | ❌ | ❌ | - |
| Student Attendance Check-In / Out | ✅ | ✅ | ✅ (Own) | ❌ | ✅ |
| Student Attendance Manual Adjustment | ✅ | ✅ | ❌ | ❌ | - |
| View Student Attendances | ✅ | ✅ | ✅ (Own) | ✅ (Child) | - |
| Teacher Attendance Check-In / Out | ✅ | ✅ (Own) | ❌ | ❌ | ✅ |
| View Audit Logs (Attendance Events) | ✅ | ❌ | ❌ | ❌ | - |
| View Notifications & Mark Read | ✅ | ❌ | ❌ | ✅ (Own) | - |
| Dashboard Summary Metrics | ✅ | ✅ | ❌ | ❌ | - |

---

## 🛡️ API Security

Aplikasi mengimplementasikan best practices keamanan backend:
1. **Helmet**: Mengamankan header HTTP (X-DNS-Prefetch-Control, Frameguard, Hide Powered-By, XSS Filter, dll).
2. **CORS**: Pembatasan origin domain yang diizinkan mengakses API.
3. **Rate Limiting**: Membatasi request per IP address (1000 request / 15 menit) untuk mencegah DDoS & Brute Force.
4. **Body Limit**: Payload dibatasi maksimal 10MB untuk mencegah Memory Exhaustion DoS.
5. **Parameterized Queries**: 100% query database menggunakan placeholder `?` via MySQL2 pool untuk memblokir SQL Injection.
6. **Password Hashing**: Menggunakan `bcryptjs` dengan Salt Round 12. Password plaintext tidak pernah disimpan atau di-log.
7. **Sanitized Errors**: Error handling tersentralisasi menyembunyikan raw stack trace dan query internal database saat production.

---

## 📋 Complete API Endpoints

Semua endpoint diawali dengan prefix: `/api/v1`

### 1. Health & Status
| Method | Endpoint | Deskripsi | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Cek status kesehatan server | Public |

### 2. Authentication (`/auth`)
| Method | Endpoint | Deskripsi | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Membuat akun user baru (+ profil role) | Admin |
| `POST` | `/auth/login` | Login user & mendapatkan token JWT | Public |
| `GET` | `/auth/me` | Mengambil data profil user yang login | Bearer Token |
| `PUT` | `/auth/change-password` | Mengganti password user yang login | Bearer Token |

### 3. Tahun Ajaran (`/academic-years`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/academic-years` | Daftar tahun ajaran (filter `is_active`, pagination) | Authenticated |
| `GET` | `/academic-years/active` | Mengambil tahun ajaran yang sedang aktif | Authenticated |
| `GET` | `/academic-years/:id` | Detail tahun ajaran | Authenticated |
| `POST` | `/academic-years` | Tambah tahun ajaran baru | Admin |
| `PUT` | `/academic-years/:id` | Update tahun ajaran | Admin |
| `DELETE` | `/academic-years/:id` | Hapus tahun ajaran | Admin |

### 4. Kelas (`/classes`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/classes` | Daftar kelas (filter tahun ajaran, grade, status) | Authenticated |
| `GET` | `/classes/:id` | Detail kelas beserta wali kelas & total siswa | Authenticated |
| `POST` | `/classes` | Tambah kelas baru | Admin |
| `PUT` | `/classes/:id` | Update kelas | Admin |
| `DELETE` | `/classes/:id` | Hapus kelas | Admin |

### 5. Guru (`/teachers`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/teachers` | Daftar guru | Authenticated |
| `GET` | `/teachers/:id` | Detail guru & akun user terkait | Authenticated |
| `POST` | `/teachers` | Tambah guru baru (atomic user + teacher) | Admin |
| `PUT` | `/teachers/:id` | Update data guru | Admin |
| `DELETE` | `/teachers/:id` | Hapus data guru | Admin |

### 6. Siswa (`/students`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | Daftar siswa (filter kelas, status, gender) | Admin, Teacher, Parent |
| `GET` | `/students/:id` | Detail siswa & daftar orang tua | Authenticated |
| `POST` | `/students` | Tambah siswa baru (atomic user + student) | Admin |
| `PUT` | `/students/:id` | Update data siswa | Admin |
| `DELETE` | `/students/:id` | Hapus data siswa | Admin |

### 7. Orang Tua (`/parents`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/parents` | Daftar orang tua | Admin, Teacher |
| `GET` | `/parents/:id` | Detail orang tua & daftar anak | Authenticated |
| `POST` | `/parents` | Tambah data orang tua | Admin |
| `PUT` | `/parents/:id` | Update data orang tua | Admin |
| `DELETE` | `/parents/:id` | Hapus data orang tua | Admin |
| `POST` | `/parents/:id/students` | Hubungkan orang tua dengan siswa | Admin |
| `DELETE` | `/parents/:id/students/:studentId`| Putus relasi orang tua dengan siswa | Admin |

### 8. Mata Pelajaran & Ruangan (`/subjects`, `/rooms`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/subjects` | Daftar mata pelajaran | Authenticated |
| `POST` | `/subjects` | Tambah mata pelajaran | Admin |
| `PUT` | `/subjects/:id` | Update mata pelajaran | Admin |
| `DELETE` | `/subjects/:id` | Hapus mata pelajaran | Admin |
| `GET` | `/rooms` | Daftar ruangan kelas/lab | Authenticated |
| `POST` | `/rooms` | Tambah ruangan baru | Admin |
| `PUT` | `/rooms/:id` | Update ruangan | Admin |
| `DELETE` | `/rooms/:id` | Hapus ruangan | Admin |

### 9. Sesi Sekolah (`/school-sessions`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/school-sessions` | Daftar jam masuk & pulang sekolah | Authenticated |
| `GET` | `/school-sessions/active` | Sesi sekolah yang aktif | Authenticated |
| `POST` | `/school-sessions` | Tambah sesi sekolah | Admin |
| `PUT` | `/school-sessions/:id` | Update sesi sekolah | Admin |
| `DELETE` | `/school-sessions/:id` | Hapus sesi sekolah | Admin |

### 10. Perangkat Absensi (`/devices`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/devices` | Daftar hardware scanner/terminal | Admin |
| `POST` | `/devices` | Registrasi perangkat baru | Admin |
| `PUT` | `/devices/:id` | Update status/lokasi perangkat | Admin |
| `DELETE` | `/devices/:id` | Hapus perangkat | Admin |
| `POST` | `/devices/:id/ping` | Heartbeat keep-alive perangkat | Device Key / Admin |

### 11. Jadwal Mengajar (`/teaching-schedules`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/teaching-schedules` | Daftar jadwal (filter tanggal, guru, kelas) | Authenticated |
| `GET` | `/teaching-schedules/:id` | Detail jadwal & absensi guru terkait | Authenticated |
| `POST` | `/teaching-schedules` | Buat jadwal mengajar (dengan deteksi konflik)| Admin |
| `PUT` | `/teaching-schedules/:id` | Update jadwal mengajar | Admin |
| `DELETE` | `/teaching-schedules/:id` | Hapus jadwal mengajar | Admin |

### 12. Absensi Siswa (`/student-attendances`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/student-attendances/check-in` | Check-in kehadiran siswa (QR / Scanner) | Auth / Device |
| `POST` | `/student-attendances/check-out` | Check-out kepulangan siswa | Auth / Device |
| `POST` | `/student-attendances/manual` | Input manual hadir/sakit/izin/alpa | Admin, Teacher |
| `GET` | `/student-attendances/summary/today`| Statistik rekapitulasi kehadiran hari ini | Admin, Teacher |
| `GET` | `/student-attendances` | Daftar riwayat absensi (RBAC filtered) | Authenticated |
| `GET` | `/student-attendances/:id` | Detail absensi siswa | Authenticated |

### 13. Absensi Mengajar Guru (`/teacher-attendances`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/teacher-attendances/check-in` | Check-in absensi mengajar guru | Teacher / Device |
| `POST` | `/teacher-attendances/check-out`| Check-out mengajar & set schedule selesai | Teacher / Device |
| `POST` | `/teacher-attendances/manual` | Koreksi manual status guru (substituted, dll)| Admin |
| `GET` | `/teacher-attendances/summary/today`| Rekapitulasi absensi guru hari ini | Admin |
| `GET` | `/teacher-attendances` | Riwayat absensi mengajar | Authenticated |
| `GET` | `/teacher-attendances/:id` | Detail absensi guru | Authenticated |

### 14. Audit Log & Notifikasi (`/attendance-events`, `/notifications`, `/dashboard`)
| Method | Endpoint | Deskripsi | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/attendance-events` | Audit trail lengkap seluruh aktivitas absensi | Admin |
| `GET` | `/attendance-events/:id` | Detail log audit | Admin |
| `GET` | `/notifications` | Daftar notifikasi kehadiran untuk Orang Tua | Authenticated |
| `PATCH`| `/notifications/:id/read`| Tandai 1 notifikasi sudah dibaca | Authenticated |
| `PATCH`| `/notifications/read-all`| Tandai semua notifikasi sudah dibaca | Parent |
| `GET` | `/dashboard/summary` | Metrik dashboard & statistik eksekutif | Admin, Teacher |

---

## ⚡ Business Logic & Database Transactions

Contoh alur transaksi database pada saat **Check-In Siswa**:

```
Client / QR Scanner POST /student-attendances/check-in
                          ↓
                  Validation Layer
                          ↓
      Service: withTransaction(async (connection) => {
          1. BEGIN TRANSACTION;
          2. Check & lock status siswa (status == 'active');
          3. Evaluasi sesi sekolah (waktu vs late_after -> 'present' / 'late');
          4. INSERT INTO student_attendances (...);
          5. INSERT INTO attendance_events (audit log IP, Device, GPS, Event);
          6. SELECT linked parents (can_receive_notification == TRUE);
          7. INSERT INTO attendance_notifications (kirim notif ke orang tua);
          8. COMMIT TRANSACTION;
      })
                          ↓
    Jika terjadi error di tengah jalan -> ROLLBACK TRANSACTION
    Connection otomatis dikembalikan ke MySQL connection pool
```

---

## 📄 Example Request & Response

### 1. Login Admin
**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "admin@absensi.test",
  "password": "password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uuid": "f8a7e0a2-1234-4567-89ab-cdef01234567",
      "name": "Administrator",
      "email": "admin@absensi.test",
      "role": "admin",
      "status": "active",
      "email_verified_at": "2026-08-18T10:00:00.000Z",
      "last_login_at": "2026-08-18T11:45:00.000Z"
    },
    "profile": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXVpZCI6ImY4YT..."
  }
}
```

### 2. Check-In Siswa via QR Scanner
**Request:**
```http
POST /api/v1/student-attendances/check-in HTTP/1.1
Host: localhost:5000
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "student_id": 1,
  "method": "qr",
  "device_id": 1,
  "latitude": -6.2000000,
  "longitude": 106.8166667,
  "note": "Hadir tepat waktu"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student check-in recorded successfully",
  "data": {
    "id": 1,
    "student_id": 1,
    "school_session_id": 1,
    "date": "2026-08-18",
    "check_in_at": "2026-08-18T06:45:12.000Z",
    "check_out_at": null,
    "check_in_status": "present",
    "check_out_status": null,
    "check_in_method": "qr",
    "check_out_method": null,
    "check_in_device_id": 1,
    "check_out_device_id": null,
    "note": "Hadir tepat waktu",
    "nis": "NIS-2026-001",
    "nisn": "0012345678",
    "student_name": "Budi Hidayat",
    "class_id": 1,
    "class_code": "X-RPL-1",
    "class_name": "X Rekayasa Perangkat Lunak 1",
    "session_name": "Sesi Pagi Utama",
    "check_in_device_name": "Scanner Gerbang Utama"
  }
}
```

### 3. Error Handling (Contoh: Duplikat Check-In Hari Ini)
**Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Student Budi Hidayat has already checked in today at 2026-08-18 06:45:12",
  "error": {
    "code": "CONFLICT"
  }
}
```

---

## 📮 Testing with Postman

File koleksi Postman lengkap telah disediakan di root backend:
`backend/postman_collection.json`

### Cara Menggunakan di Postman:
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** (di pojok kiri atas).
3. Pilih file `backend/postman_collection.json`.
4. Jalankan request `1. Authentication -> Login as Admin`. Token JWT akan secara otomatis tersimpan di variable koleksi `{{admin_token}}`.
5. Anda dapat langsung menjalankan request-request lainnya dengan otentikasi otomatis!

---

## 👨‍💻 Maintainer & License

Dibuat dengan standar arsitektur backend modern.
Lisensi: **ISC**.
