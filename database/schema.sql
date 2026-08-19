-- ============================================================
-- DATABASE : PROJECT_ABSENSI
-- ============================================================

CREATE DATABASE IF NOT EXISTS project_absensi
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE project_absensi;

-- ============================================================
-- SCHOOL ATTENDANCE SYSTEM
-- Database Schema V2
--
-- Roles:
--   admin
--   teacher
--   student
--   parent
--
-- Database:
--   MySQL 8+
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- DROP TABLES
-- ============================================================

DROP TABLE IF EXISTS attendance_notifications;
DROP TABLE IF EXISTS attendance_events;
DROP TABLE IF EXISTS teacher_attendances;
DROP TABLE IF EXISTS student_attendances;
DROP TABLE IF EXISTS teaching_schedules;
DROP TABLE IF EXISTS attendance_devices;
DROP TABLE IF EXISTS student_parents;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS school_sessions;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS users;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    uuid CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(150) NULL UNIQUE,

    password VARCHAR(255) NULL,

    role ENUM(
        'admin',
        'teacher',
        'student',
        'parent'
    ) NOT NULL,

    status ENUM(
        'active',
        'inactive',
        'blocked'
    ) NOT NULL DEFAULT 'active',

    email_verified_at TIMESTAMP NULL,

    remember_token VARCHAR(100) NULL,

    last_login_at DATETIME NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (
        role
    ),

    INDEX idx_users_status (
        status
    ),

    INDEX idx_users_last_login (
        last_login_at
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 2. ACADEMIC YEARS
-- ============================================================

CREATE TABLE academic_years (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(20) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_academic_year_name (
        name
    ),

    INDEX idx_academic_year_active (
        is_active
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 3. CLASSES
-- ============================================================

CREATE TABLE classes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    code VARCHAR(30) NOT NULL,

    name VARCHAR(100) NOT NULL,

    grade VARCHAR(20) NULL,

    major VARCHAR(100) NULL,

    homeroom_teacher_id BIGINT UNSIGNED NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_academic_year
        FOREIGN KEY (
            academic_year_id
        )
        REFERENCES academic_years(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_class_code_year (
        academic_year_id,
        code
    ),

    INDEX idx_classes_academic_year (
        academic_year_id
    ),

    INDEX idx_classes_status (
        status
    ),

    INDEX idx_classes_homeroom_teacher (
        homeroom_teacher_id
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 4. TEACHERS
-- ============================================================

CREATE TABLE teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    nip VARCHAR(50) NULL,

    phone VARCHAR(30) NULL,

    gender ENUM(
        'male',
        'female'
    ) NULL,

    birth_date DATE NULL,

    address TEXT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_teachers_user
        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_teacher_user (
        user_id
    ),

    UNIQUE KEY uq_teacher_nip (
        nip
    ),

    INDEX idx_teachers_status (
        status
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 5. UPDATE FOREIGN KEY HOMEROOM TEACHER
-- ============================================================

ALTER TABLE classes

ADD CONSTRAINT fk_classes_homeroom_teacher

FOREIGN KEY (
    homeroom_teacher_id
)

REFERENCES teachers(id)

ON DELETE SET NULL

ON UPDATE CASCADE;


-- ============================================================
-- 6. STUDENTS
-- ============================================================

CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    class_id BIGINT UNSIGNED NOT NULL,

    nis VARCHAR(50) NOT NULL,

    nisn VARCHAR(50) NULL,

    gender ENUM(
        'male',
        'female'
    ) NULL,

    birth_place VARCHAR(100) NULL,

    birth_date DATE NULL,

    phone VARCHAR(30) NULL,

    address TEXT NULL,

    photo VARCHAR(255) NULL,

    admission_date DATE NULL,

    graduation_date DATE NULL,

    status ENUM(
        'active',
        'inactive',
        'graduated',
        'transferred'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_students_user
        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_students_class
        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_student_user (
        user_id
    ),

    UNIQUE KEY uq_student_nis (
        nis
    ),

    UNIQUE KEY uq_student_nisn (
        nisn
    ),

    INDEX idx_students_class (
        class_id
    ),

    INDEX idx_students_status (
        status
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 7. PARENTS
-- ============================================================

CREATE TABLE parents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    nik VARCHAR(30) NULL,

    phone VARCHAR(30) NULL,

    gender ENUM(
        'male',
        'female'
    ) NULL,

    address TEXT NULL,

    occupation VARCHAR(100) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_parents_user
        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_parent_user (
        user_id
    ),

    UNIQUE KEY uq_parent_nik (
        nik
    ),

    INDEX idx_parents_status (
        status
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 8. STUDENT PARENTS
-- ============================================================

CREATE TABLE student_parents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,

    parent_id BIGINT UNSIGNED NOT NULL,

    relationship ENUM(
        'father',
        'mother',
        'guardian',
        'other'
    ) NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    can_view_attendance BOOLEAN NOT NULL DEFAULT TRUE,

    can_receive_notification BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_parents_student
        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_student_parents_parent
        FOREIGN KEY (
            parent_id
        )
        REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_student_parent (
        student_id,
        parent_id
    ),

    INDEX idx_student_parents_student (
        student_id
    ),

    INDEX idx_student_parents_parent (
        parent_id
    ),

    INDEX idx_student_parents_relationship (
        relationship
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 9. SUBJECTS
-- ============================================================

CREATE TABLE subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(30) NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_subject_code (
        code
    ),

    INDEX idx_subject_status (
        status
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 10. ROOMS
-- ============================================================

CREATE TABLE rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(30) NOT NULL,

    name VARCHAR(100) NOT NULL,

    location VARCHAR(150) NULL,

    capacity INT UNSIGNED NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_room_code (
        code
    ),

    INDEX idx_room_status (
        status
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 11. SCHOOL SESSIONS
-- Untuk absensi datang dan pulang siswa
-- ============================================================

CREATE TABLE school_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    start_time TIME NOT NULL,

    late_after TIME NOT NULL,

    end_time TIME NOT NULL,

    check_out_start TIME NULL,

    check_out_end TIME NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_school_session_active (
        is_active
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 12. ATTENDANCE DEVICES
-- ============================================================

CREATE TABLE attendance_devices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    uuid CHAR(36) NOT NULL UNIQUE,

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,

    type ENUM(
        'qr',
        'rfid',
        'nfc',
        'face',
        'manual'
    ) NOT NULL DEFAULT 'qr',

    location VARCHAR(150) NULL,

    api_key VARCHAR(255) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    last_seen_at DATETIME NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_device_code (
        code
    ),

    -- api_key must be unique: deviceAuth.middleware.js resolves a device by
    -- `WHERE api_key = ? LIMIT 1` with no ORDER BY, so two devices sharing a
    -- key would let the server silently pick either one. A gate tablet could
    -- then record attendance against the wrong gate, with numbers that still
    -- look plausible. NULL is still allowed for devices without a key --
    -- MySQL permits multiple NULLs in a UNIQUE index.
    UNIQUE KEY uq_device_api_key (
        api_key
    ),

    INDEX idx_device_status (
        status
    ),

    INDEX idx_device_type (
        type
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 13. TEACHING SCHEDULES
-- Jadwal guru mengajar kelas
-- ============================================================

CREATE TABLE teaching_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    teacher_id BIGINT UNSIGNED NOT NULL,

    subject_id BIGINT UNSIGNED NOT NULL,

    class_id BIGINT UNSIGNED NOT NULL,

    room_id BIGINT UNSIGNED NULL,

    date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    attendance_open_before INT UNSIGNED NOT NULL DEFAULT 30,

    attendance_close_after INT UNSIGNED NOT NULL DEFAULT 30,

    status ENUM(
        'scheduled',
        'cancelled',
        'completed'
    ) NOT NULL DEFAULT 'scheduled',

    note VARCHAR(500) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_academic_year
        FOREIGN KEY (
            academic_year_id
        )
        REFERENCES academic_years(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_teacher
        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_subject
        FOREIGN KEY (
            subject_id
        )
        REFERENCES subjects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_class
        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_room
        FOREIGN KEY (
            room_id
        )
        REFERENCES rooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_schedule_teacher_date (
        teacher_id,
        date
    ),

    INDEX idx_schedule_class_date (
        class_id,
        date
    ),

    INDEX idx_schedule_date (
        date
    ),

    INDEX idx_schedule_subject (
        subject_id
    ),

    INDEX idx_schedule_room (
        room_id
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 14. STUDENT ATTENDANCES
-- 1 siswa hanya 1 absensi per tanggal
-- ============================================================

CREATE TABLE student_attendances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,

    school_session_id BIGINT UNSIGNED NULL,

    date DATE NOT NULL,

    check_in_at DATETIME NULL,

    check_out_at DATETIME NULL,

    check_in_status ENUM(
        'present',
        'late',
        'absent',
        'excused',
        'sick',
        'permission'
    ) NULL,

    check_out_status ENUM(
        'completed',
        'not_checked_out',
        'early_leave'
    ) NULL,

    check_in_method ENUM(
        'qr',
        'rfid',
        'nfc',
        'face',
        'manual',
        'system'
    ) NULL,

    check_out_method ENUM(
        'qr',
        'rfid',
        'nfc',
        'face',
        'manual',
        'system'
    ) NULL,

    check_in_device_id BIGINT UNSIGNED NULL,

    check_out_device_id BIGINT UNSIGNED NULL,

    note VARCHAR(500) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_attendance_student
        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_student_attendance_session
        FOREIGN KEY (
            school_session_id
        )
        REFERENCES school_sessions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_student_attendance_checkin_device
        FOREIGN KEY (
            check_in_device_id
        )
        REFERENCES attendance_devices(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_student_attendance_checkout_device
        FOREIGN KEY (
            check_out_device_id
        )
        REFERENCES attendance_devices(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE KEY uq_student_attendance_date (
        student_id,
        date
    ),

    INDEX idx_student_attendance_date (
        date
    ),

    INDEX idx_student_attendance_student_date (
        student_id,
        date
    ),

    INDEX idx_student_attendance_status (
        check_in_status
    ),

    INDEX idx_student_attendance_checkin (
        check_in_at
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 15. TEACHER ATTENDANCES
-- 1 jadwal = 1 absensi guru
-- ============================================================

CREATE TABLE teacher_attendances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    teaching_schedule_id BIGINT UNSIGNED NOT NULL,

    teacher_id BIGINT UNSIGNED NOT NULL,

    check_in_at DATETIME NULL,

    check_out_at DATETIME NULL,

    status ENUM(
        'on_time',
        'late',
        'absent',
        'cancelled',
        'substituted'
    ) NOT NULL DEFAULT 'on_time',

    method ENUM(
        'qr',
        'rfid',
        'nfc',
        'face',
        'manual',
        'system'
    ) NULL,

    device_id BIGINT UNSIGNED NULL,

    note VARCHAR(500) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_attendance_schedule
        FOREIGN KEY (
            teaching_schedule_id
        )
        REFERENCES teaching_schedules(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_teacher_attendance_teacher
        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_teacher_attendance_device
        FOREIGN KEY (
            device_id
        )
        REFERENCES attendance_devices(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE KEY uq_teacher_attendance_schedule (
        teaching_schedule_id
    ),

    INDEX idx_teacher_attendance_teacher (
        teacher_id
    ),

    INDEX idx_teacher_attendance_status (
        status
    ),

    INDEX idx_teacher_attendance_checkin (
        check_in_at
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 16. ATTENDANCE EVENTS
-- Audit log semua aktivitas absensi
-- ============================================================

CREATE TABLE attendance_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    event_type ENUM(
        'student_check_in',
        'student_check_out',
        'teacher_check_in',
        'teacher_check_out',
        'manual_correction',
        'attendance_created',
        'attendance_updated'
    ) NOT NULL,

    student_attendance_id BIGINT UNSIGNED NULL,

    teacher_attendance_id BIGINT UNSIGNED NULL,

    user_id BIGINT UNSIGNED NULL,

    device_id BIGINT UNSIGNED NULL,

    occurred_at DATETIME NOT NULL,

    method ENUM(
        'qr',
        'rfid',
        'nfc',
        'face',
        'manual',
        'system'
    ) NOT NULL,

    ip_address VARCHAR(45) NULL,

    user_agent TEXT NULL,

    latitude DECIMAL(10,7) NULL,

    longitude DECIMAL(10,7) NULL,

    metadata JSON NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_student_attendance
        FOREIGN KEY (
            student_attendance_id
        )
        REFERENCES student_attendances(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_event_teacher_attendance
        FOREIGN KEY (
            teacher_attendance_id
        )
        REFERENCES teacher_attendances(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_event_user
        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_event_device
        FOREIGN KEY (
            device_id
        )
        REFERENCES attendance_devices(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_events_occurred_at (
        occurred_at
    ),

    INDEX idx_events_event_type (
        event_type
    ),

    INDEX idx_events_student (
        student_attendance_id
    ),

    INDEX idx_events_teacher (
        teacher_attendance_id
    ),

    INDEX idx_events_device (
        device_id
    ),

    INDEX idx_events_user (
        user_id
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- 17. ATTENDANCE NOTIFICATIONS
-- Notifikasi ke orang tua
-- ============================================================

CREATE TABLE attendance_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_attendance_id BIGINT UNSIGNED NOT NULL,

    parent_id BIGINT UNSIGNED NOT NULL,

    type ENUM(
        'check_in',
        'check_out',
        'late',
        'absent',
        'permission',
        'sick',
        'early_leave'
    ) NOT NULL,

    channel ENUM(
        'web',
        'email',
        'whatsapp',
        'push'
    ) NOT NULL DEFAULT 'web',

    status ENUM(
        'pending',
        'sent',
        'failed',
        'read'
    ) NOT NULL DEFAULT 'pending',

    title VARCHAR(255) NULL,

    message TEXT NULL,

    sent_at DATETIME NULL,

    read_at DATETIME NULL,

    error_message TEXT NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_attendance
        FOREIGN KEY (
            student_attendance_id
        )
        REFERENCES student_attendances(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_notification_parent
        FOREIGN KEY (
            parent_id
        )
        REFERENCES parents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_notification_parent (
        parent_id
    ),

    INDEX idx_notification_attendance (
        student_attendance_id
    ),

    INDEX idx_notification_status (
        status
    ),

    INDEX idx_notification_channel (
        channel
    ),

    INDEX idx_notification_created (
        created_at
    )
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- ============================================================
-- FINISH
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;