-- ============================================================
-- PROJECT ABSENSI
-- SEED DATA
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS project_absensi
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE project_absensi;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- CLEAN EXISTING DATA
-- ============================================================

TRUNCATE TABLE attendance_notifications;
TRUNCATE TABLE attendance_events;
TRUNCATE TABLE teacher_attendances;
TRUNCATE TABLE student_attendances;
TRUNCATE TABLE teaching_schedules;
TRUNCATE TABLE attendance_devices;
TRUNCATE TABLE student_parents;
TRUNCATE TABLE parents;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE subjects;
TRUNCATE TABLE rooms;
TRUNCATE TABLE school_sessions;
TRUNCATE TABLE classes;
TRUNCATE TABLE academic_years;
TRUNCATE TABLE users;


-- ============================================================
-- PASSWORD
-- ============================================================
-- Password semua akun:
-- password
--
-- bcrypt hash:
-- $2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS
-- ============================================================


-- ============================================================
-- 1. USERS
-- ============================================================

INSERT INTO users
(
    uuid,
    name,
    email,
    password,
    role,
    status,
    email_verified_at
)
VALUES

-- ADMIN
(
    UUID(),
    'Administrator',
    'admin@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'admin',
    'active',
    NOW()
),

-- TEACHERS
(
    UUID(),
    'Ahmad Fauzi',
    'ahmad@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'teacher',
    'active',
    NOW()
),

(
    UUID(),
    'Budi Santoso',
    'budi.guru@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'teacher',
    'active',
    NOW()
),

(
    UUID(),
    'Citra Lestari',
    'citra@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'teacher',
    'active',
    NOW()
),

-- PARENTS
(
    UUID(),
    'Ahmad Hidayat',
    'ayah.budi@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Siti Aminah',
    'ibu.budi@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Dedi Kurniawan',
    'ayah.andi@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Rina Marlina',
    'ibu.andi@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Eko Prasetyo',
    'ayah.dimas@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Dewi Lestari',
    'ibu.dimas@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Fajar Nugroho',
    'ayah.fajar@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

(
    UUID(),
    'Novi Anggraini',
    'ibu.fajar@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'parent',
    'active',
    NOW()
),

-- STUDENTS
(
    UUID(),
    'Budi Hidayat',
    'budi.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Andi Kurniawan',
    'andi.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Dimas Prasetyo',
    'dimas.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Fajar Nugraha',
    'fajar.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Rizky Ramadhan',
    'rizky.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Muhammad Ilham',
    'ilham.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Salsa Putri',
    'salsa.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
),

(
    UUID(),
    'Aulia Rahma',
    'aulia.siswa@absensi.test',
    '$2a$12$GOKLZVoYouWNzdJPn14KU.VT2h8E/rZWqMxnuFggPqMwQCY8Cs0SS',
    'student',
    'active',
    NOW()
);


-- ============================================================
-- 2. ACADEMIC YEAR
-- ============================================================

INSERT INTO academic_years
(
    name,
    start_date,
    end_date,
    is_active
)
VALUES
(
    '2026/2027',
    '2026-07-01',
    '2027-06-30',
    TRUE
);


-- ============================================================
-- 3. TEACHERS
-- ============================================================

INSERT INTO teachers
(
    user_id,
    nip,
    phone,
    gender,
    birth_date,
    address,
    status
)
VALUES
(
    (SELECT id FROM users WHERE email = 'ahmad@absensi.test'),
    '198501012010011001',
    '081200000001',
    'male',
    '1985-01-01',
    'Bogor',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'budi.guru@absensi.test'),
    '198703152012021002',
    '081200000002',
    'male',
    '1987-03-15',
    'Bogor',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'citra@absensi.test'),
    '199002202015032003',
    '081200000003',
    'female',
    '1990-02-20',
    'Depok',
    'active'
);


-- ============================================================
-- 4. CLASSES
-- ============================================================

INSERT INTO classes
(
    academic_year_id,
    code,
    name,
    grade,
    major,
    status
)
VALUES
(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    'XII-RPL-A',
    'XII RPL A',
    'XII',
    'Rekayasa Perangkat Lunak',
    'active'
),

(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    'XII-RPL-B',
    'XII RPL B',
    'XII',
    'Rekayasa Perangkat Lunak',
    'active'
),

(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    'XI-TKJ-A',
    'XI TKJ A',
    'XI',
    'Teknik Komputer dan Jaringan',
    'active'
),

(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    'XI-RPL-A',
    'XI RPL A',
    'XI',
    'Rekayasa Perangkat Lunak',
    'active'
);


-- ============================================================
-- 5. SUBJECTS
-- ============================================================

INSERT INTO subjects
(
    code,
    name,
    description,
    status
)
VALUES
(
    'WEB',
    'Pemrograman Web',
    'Pembelajaran pengembangan aplikasi berbasis web.',
    'active'
),

(
    'DB',
    'Basis Data',
    'Pembelajaran database dan SQL.',
    'active'
),

(
    'PBO',
    'Pemrograman Berorientasi Objek',
    'Pembelajaran konsep object oriented programming.',
    'active'
),

(
    'ING',
    'Bahasa Inggris',
    'Pembelajaran Bahasa Inggris.',
    'active'
),

(
    'MAT',
    'Matematika',
    'Pembelajaran matematika.',
    'active'
),

(
    'JAR',
    'Jaringan Komputer',
    'Pembelajaran jaringan komputer.',
    'active'
);


-- ============================================================
-- 6. ROOMS
-- ============================================================

INSERT INTO rooms
(
    code,
    name,
    location,
    capacity,
    status
)
VALUES
(
    'LAB-01',
    'Laboratorium Komputer 1',
    'Gedung A Lantai 1',
    40,
    'active'
),

(
    'LAB-02',
    'Laboratorium Komputer 2',
    'Gedung A Lantai 2',
    40,
    'active'
),

(
    'R-201',
    'Ruang Kelas 201',
    'Gedung B Lantai 2',
    35,
    'active'
),

(
    'R-202',
    'Ruang Kelas 202',
    'Gedung B Lantai 2',
    35,
    'active'
);


-- ============================================================
-- 7. SCHOOL SESSION
-- ============================================================

INSERT INTO school_sessions
(
    name,
    start_time,
    late_after,
    end_time,
    check_out_start,
    check_out_end,
    is_active
)
VALUES
(
    'Jam Sekolah Reguler',
    '07:00:00',
    '07:15:00',
    '15:30:00',
    '14:30:00',
    '17:00:00',
    TRUE
);


-- ============================================================
-- 8. ATTENDANCE DEVICES
-- ============================================================

INSERT INTO attendance_devices
(
    uuid,
    code,
    name,
    type,
    location,
    api_key,
    status
)
VALUES
(
    UUID(),
    'GATE-01',
    'Scanner Gerbang Utama',
    'qr',
    'Gerbang Utama',
    'DEVICE-GATE-01-SECRET',
    'active'
),

(
    UUID(),
    'GATE-02',
    'Scanner Gerbang Belakang',
    'qr',
    'Gerbang Belakang',
    'DEVICE-GATE-02-SECRET',
    'active'
);


-- ============================================================
-- 9. STUDENTS
-- ============================================================

INSERT INTO students
(
    user_id,
    class_id,
    nis,
    nisn,
    gender,
    birth_place,
    birth_date,
    phone,
    address,
    admission_date,
    status
)
VALUES
(
    (SELECT id FROM users WHERE email = 'budi.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-A'),
    '20260001',
    '0061234501',
    'male',
    'Bogor',
    '2009-01-15',
    '081300000001',
    'Bogor',
    '2024-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'andi.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-A'),
    '20260002',
    '0061234502',
    'male',
    'Bogor',
    '2009-03-12',
    '081300000002',
    'Bogor',
    '2024-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'dimas.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-B'),
    '20260003',
    '0061234503',
    'male',
    'Depok',
    '2009-04-20',
    '081300000003',
    'Depok',
    '2024-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'fajar.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-B'),
    '20260004',
    '0061234504',
    'male',
    'Jakarta',
    '2009-05-11',
    '081300000004',
    'Jakarta',
    '2024-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'rizky.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XI-TKJ-A'),
    '20260005',
    '0061234505',
    'male',
    'Bogor',
    '2010-02-14',
    '081300000005',
    'Bogor',
    '2025-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ilham.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XI-TKJ-A'),
    '20260006',
    '0061234506',
    'male',
    'Bogor',
    '2010-06-18',
    '081300000006',
    'Bogor',
    '2025-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'salsa.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XI-RPL-A'),
    '20260007',
    '0061234507',
    'female',
    'Depok',
    '2010-07-20',
    '081300000007',
    'Depok',
    '2025-07-01',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'aulia.siswa@absensi.test'),
    (SELECT id FROM classes WHERE code = 'XI-RPL-A'),
    '20260008',
    '0061234508',
    'female',
    'Jakarta',
    '2010-08-10',
    '081300000008',
    'Jakarta',
    '2025-07-01',
    'active'
);


-- ============================================================
-- 10. PARENTS
-- ============================================================

INSERT INTO parents
(
    user_id,
    nik,
    phone,
    gender,
    address,
    occupation,
    status
)
VALUES
(
    (SELECT id FROM users WHERE email = 'ayah.budi@absensi.test'),
    '3271010101800001',
    '081400000001',
    'male',
    'Bogor',
    'Wiraswasta',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ibu.budi@absensi.test'),
    '3271010202820002',
    '081400000002',
    'female',
    'Bogor',
    'Ibu Rumah Tangga',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ayah.andi@absensi.test'),
    '3271010301790003',
    '081400000003',
    'male',
    'Bogor',
    'Pegawai Swasta',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ibu.andi@absensi.test'),
    '3271010402810004',
    '081400000004',
    'female',
    'Bogor',
    'Ibu Rumah Tangga',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ayah.dimas@absensi.test'),
    '3271010501780005',
    '081400000005',
    'male',
    'Depok',
    'Wiraswasta',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ibu.dimas@absensi.test'),
    '3271010602800006',
    '081400000006',
    'female',
    'Depok',
    'Guru',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ayah.fajar@absensi.test'),
    '3271010701770007',
    '081400000007',
    'male',
    'Jakarta',
    'Pegawai Swasta',
    'active'
),

(
    (SELECT id FROM users WHERE email = 'ibu.fajar@absensi.test'),
    '3271010802790008',
    '081400000008',
    'female',
    'Jakarta',
    'Ibu Rumah Tangga',
    'active'
);


-- ============================================================
-- 11. STUDENT PARENTS
-- ============================================================

-- Budi
INSERT INTO student_parents
(
    student_id,
    parent_id,
    relationship,
    is_primary,
    can_view_attendance,
    can_receive_notification
)
VALUES
(
    (SELECT id FROM students WHERE nis = '20260001'),
    (SELECT id FROM parents WHERE nik = '3271010101800001'),
    'father',
    TRUE,
    TRUE,
    TRUE
),

(
    (SELECT id FROM students WHERE nis = '20260001'),
    (SELECT id FROM parents WHERE nik = '3271010202820002'),
    'mother',
    FALSE,
    TRUE,
    TRUE
);

-- Andi
INSERT INTO student_parents
(
    student_id,
    parent_id,
    relationship,
    is_primary,
    can_view_attendance,
    can_receive_notification
)
VALUES
(
    (SELECT id FROM students WHERE nis = '20260002'),
    (SELECT id FROM parents WHERE nik = '3271010301790003'),
    'father',
    TRUE,
    TRUE,
    TRUE
),

(
    (SELECT id FROM students WHERE nis = '20260002'),
    (SELECT id FROM parents WHERE nik = '3271010402810004'),
    'mother',
    FALSE,
    TRUE,
    TRUE
);

-- Dimas
INSERT INTO student_parents
(
    student_id,
    parent_id,
    relationship,
    is_primary,
    can_view_attendance,
    can_receive_notification
)
VALUES
(
    (SELECT id FROM students WHERE nis = '20260003'),
    (SELECT id FROM parents WHERE nik = '3271010501780005'),
    'father',
    TRUE,
    TRUE,
    TRUE
),

(
    (SELECT id FROM students WHERE nis = '20260003'),
    (SELECT id FROM parents WHERE nik = '3271010602800006'),
    'mother',
    FALSE,
    TRUE,
    TRUE
);

-- Fajar
INSERT INTO student_parents
(
    student_id,
    parent_id,
    relationship,
    is_primary,
    can_view_attendance,
    can_receive_notification
)
VALUES
(
    (SELECT id FROM students WHERE nis = '20260004'),
    (SELECT id FROM parents WHERE nik = '3271010701770007'),
    'father',
    TRUE,
    TRUE,
    TRUE
),

(
    (SELECT id FROM students WHERE nis = '20260004'),
    (SELECT id FROM parents WHERE nik = '3271010802790008'),
    'mother',
    FALSE,
    TRUE,
    TRUE
);


-- ============================================================
-- 12. TEACHING SCHEDULES
-- ============================================================

INSERT INTO teaching_schedules
(
    academic_year_id,
    teacher_id,
    subject_id,
    class_id,
    room_id,
    date,
    start_time,
    end_time,
    attendance_open_before,
    attendance_close_after,
    status
)
VALUES

-- Ahmad - Pemrograman Web - XII RPL A
(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    (SELECT id FROM teachers WHERE nip = '198501012010011001'),
    (SELECT id FROM subjects WHERE code = 'WEB'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-A'),
    (SELECT id FROM rooms WHERE code = 'LAB-01'),
    '2026-08-18',
    '08:00:00',
    '09:30:00',
    30,
    30,
    'completed'
),

-- Budi - Basis Data - XII RPL A
(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    (SELECT id FROM teachers WHERE nip = '198703152012021002'),
    (SELECT id FROM subjects WHERE code = 'DB'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-A'),
    (SELECT id FROM rooms WHERE code = 'LAB-01'),
    '2026-08-18',
    '10:00:00',
    '11:30:00',
    30,
    30,
    'completed'
),

-- Citra - Bahasa Inggris - XII RPL B
(
    (SELECT id FROM academic_years WHERE name = '2026/2027'),
    (SELECT id FROM teachers WHERE nip = '199002202015032003'),
    (SELECT id FROM subjects WHERE code = 'ING'),
    (SELECT id FROM classes WHERE code = 'XII-RPL-B'),
    (SELECT id FROM rooms WHERE code = 'R-201'),
    '2026-08-18',
    '08:00:00',
    '09:30:00',
    30,
    30,
    'completed'
);


-- ============================================================
-- 13. STUDENT ATTENDANCES
-- ============================================================

INSERT INTO student_attendances
(
    student_id,
    school_session_id,
    date,
    check_in_at,
    check_out_at,
    check_in_status,
    check_out_status,
    check_in_method,
    check_out_method,
    check_in_device_id,
    check_out_device_id,
    note
)
VALUES

-- Budi
(
    (SELECT id FROM students WHERE nis = '20260001'),
    (SELECT id FROM school_sessions WHERE name = 'Jam Sekolah Reguler'),
    '2026-08-18',
    '2026-08-17 23:58:12',
    '2026-08-18 08:32:10',
    'present',
    'completed',
    'qr',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    NULL
),

-- Andi terlambat
(
    (SELECT id FROM students WHERE nis = '20260002'),
    (SELECT id FROM school_sessions WHERE name = 'Jam Sekolah Reguler'),
    '2026-08-18',
    '2026-08-18 00:24:31',
    '2026-08-18 08:35:12',
    'late',
    'completed',
    'qr',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    'Terlambat'
),

-- Dimas
(
    (SELECT id FROM students WHERE nis = '20260003'),
    (SELECT id FROM school_sessions WHERE name = 'Jam Sekolah Reguler'),
    '2026-08-18',
    '2026-08-18 00:02:44',
    '2026-08-18 08:28:42',
    'present',
    'completed',
    'qr',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-02'),
    (SELECT id FROM attendance_devices WHERE code = 'GATE-02'),
    NULL
),

-- Fajar terlambat dan pulang lebih awal
(
    (SELECT id FROM students WHERE nis = '20260004'),
    (SELECT id FROM school_sessions WHERE name = 'Jam Sekolah Reguler'),
    '2026-08-18',
    '2026-08-18 00:31:22',
    '2026-08-18 07:20:10',
    'late',
    'early_leave',
    'qr',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    'Pulang lebih awal'
),

-- Rizky
(
    (SELECT id FROM students WHERE nis = '20260005'),
    (SELECT id FROM school_sessions WHERE name = 'Jam Sekolah Reguler'),
    '2026-08-18',
    '2026-08-17 23:55:21',
    '2026-08-18 08:31:05',
    'present',
    'completed',
    'qr',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    NULL
);


-- ============================================================
-- 14. TEACHER ATTENDANCES
-- ============================================================

INSERT INTO teacher_attendances
(
    teaching_schedule_id,
    teacher_id,
    check_in_at,
    check_out_at,
    status,
    method,
    device_id,
    note
)
VALUES

-- Ahmad tepat waktu
(
    (
        SELECT ts.id
        FROM teaching_schedules ts
        JOIN teachers t
            ON t.id = ts.teacher_id
        WHERE t.nip = '198501012010011001'
          AND ts.date = '2026-08-18'
          AND ts.start_time = '08:00:00'
        LIMIT 1
    ),
    (SELECT id FROM teachers WHERE nip = '198501012010011001'),
    '2026-08-18 00:52:10',
    '2026-08-18 02:35:00',
    'on_time',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    NULL
),

-- Budi guru terlambat
(
    (
        SELECT ts.id
        FROM teaching_schedules ts
        JOIN teachers t
            ON t.id = ts.teacher_id
        WHERE t.nip = '198703152012021002'
          AND ts.date = '2026-08-18'
          AND ts.start_time = '10:00:00'
        LIMIT 1
    ),
    (SELECT id FROM teachers WHERE nip = '198703152012021002'),
    '2026-08-18 03:07:21',
    '2026-08-18 04:35:00',
    'late',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),
    'Terlambat 7 menit'
),

-- Citra tepat waktu
(
    (
        SELECT ts.id
        FROM teaching_schedules ts
        JOIN teachers t
            ON t.id = ts.teacher_id
        WHERE t.nip = '199002202015032003'
          AND ts.date = '2026-08-18'
          AND ts.start_time = '08:00:00'
        LIMIT 1
    ),
    (SELECT id FROM teachers WHERE nip = '199002202015032003'),
    '2026-08-18 00:55:00',
    '2026-08-18 02:32:00',
    'on_time',
    'qr',
    (SELECT id FROM attendance_devices WHERE code = 'GATE-02'),
    NULL
);


-- ============================================================
-- 15. ATTENDANCE EVENTS
-- ============================================================

INSERT INTO attendance_events
(
    event_type,
    student_attendance_id,
    teacher_attendance_id,
    user_id,
    device_id,
    occurred_at,
    method,
    ip_address,
    user_agent,
    metadata
)
VALUES

-- Budi check in
(
    'student_check_in',

    (
        SELECT sa.id
        FROM student_attendances sa
        JOIN students s
            ON s.id = sa.student_id
        WHERE s.nis = '20260001'
          AND sa.date = '2026-08-18'
        LIMIT 1
    ),

    NULL,

    (
        SELECT u.id
        FROM users u
        JOIN students s
            ON s.user_id = u.id
        WHERE s.nis = '20260001'
        LIMIT 1
    ),

    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),

    '2026-08-17 23:58:12',

    'qr',

    NULL,

    NULL,

    JSON_OBJECT(
        'action', 'check_in',
        'source', 'gate'
    )
),

-- Budi check out
(
    'student_check_out',

    (
        SELECT sa.id
        FROM student_attendances sa
        JOIN students s
            ON s.id = sa.student_id
        WHERE s.nis = '20260001'
          AND sa.date = '2026-08-18'
        LIMIT 1
    ),

    NULL,

    (
        SELECT u.id
        FROM users u
        JOIN students s
            ON s.user_id = u.id
        WHERE s.nis = '20260001'
        LIMIT 1
    ),

    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),

    '2026-08-18 08:32:10',

    'qr',

    NULL,

    NULL,

    JSON_OBJECT(
        'action', 'check_out',
        'source', 'gate'
    )
),

-- Andi check in
(
    'student_check_in',

    (
        SELECT sa.id
        FROM student_attendances sa
        JOIN students s
            ON s.id = sa.student_id
        WHERE s.nis = '20260002'
          AND sa.date = '2026-08-18'
        LIMIT 1
    ),

    NULL,

    (
        SELECT u.id
        FROM users u
        JOIN students s
            ON s.user_id = u.id
        WHERE s.nis = '20260002'
        LIMIT 1
    ),

    (SELECT id FROM attendance_devices WHERE code = 'GATE-01'),

    '2026-08-18 00:24:31',

    'qr',

    NULL,

    NULL,

    JSON_OBJECT(
        'action', 'check_in',
        'source', 'gate',
        'late', TRUE
    )
);


-- ============================================================
-- 16. ATTENDANCE NOTIFICATIONS
-- ============================================================

INSERT INTO attendance_notifications
(
    student_attendance_id,
    parent_id,
    type,
    channel,
    status,
    title,
    message,
    sent_at
)
VALUES

-- Budi check in
(
    (
        SELECT sa.id
        FROM student_attendances sa
        JOIN students s
            ON s.id = sa.student_id
        WHERE s.nis = '20260001'
          AND sa.date = '2026-08-18'
        LIMIT 1
    ),

    (
        SELECT p.id
        FROM parents p
        JOIN users u
            ON u.id = p.user_id
        WHERE u.email = 'ayah.budi@absensi.test'
        LIMIT 1
    ),

    'check_in',
    'web',
    'read',
    'Kehadiran Budi',
    'Budi telah melakukan absensi masuk pada pukul 06:58.',
    '2026-08-17 23:59:00'
),

-- Andi terlambat
(
    (
        SELECT sa.id
        FROM student_attendances sa
        JOIN students s
            ON s.id = sa.student_id
        WHERE s.nis = '20260002'
          AND sa.date = '2026-08-18'
        LIMIT 1
    ),

    (
        SELECT p.id
        FROM parents p
        JOIN users u
            ON u.id = p.user_id
        WHERE u.email = 'ayah.andi@absensi.test'
        LIMIT 1
    ),

    'late',
    'web',
    'sent',
    'Andi Terlambat',
    'Andi melakukan absensi masuk pada pukul 07:24 dan tercatat terlambat.',
    '2026-08-18 00:25:00'
);


-- ============================================================
-- FINISH
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'users' AS table_name, COUNT(*) AS total
FROM users

UNION ALL

SELECT 'teachers', COUNT(*)
FROM teachers

UNION ALL

SELECT 'students', COUNT(*)
FROM students

UNION ALL

SELECT 'parents', COUNT(*)
FROM parents

UNION ALL

SELECT 'student_parents', COUNT(*)
FROM student_parents

UNION ALL

SELECT 'classes', COUNT(*)
FROM classes

UNION ALL

SELECT 'subjects', COUNT(*)
FROM subjects

UNION ALL

SELECT 'rooms', COUNT(*)
FROM rooms

UNION ALL

SELECT 'school_sessions', COUNT(*)
FROM school_sessions

UNION ALL

SELECT 'attendance_devices', COUNT(*)
FROM attendance_devices

UNION ALL

SELECT 'teaching_schedules', COUNT(*)
FROM teaching_schedules

UNION ALL

SELECT 'student_attendances', COUNT(*)
FROM student_attendances

UNION ALL

SELECT 'teacher_attendances', COUNT(*)
FROM teacher_attendances

UNION ALL

SELECT 'attendance_events', COUNT(*)
FROM attendance_events

UNION ALL

SELECT 'attendance_notifications', COUNT(*)
FROM attendance_notifications;