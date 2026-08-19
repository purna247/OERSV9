require('dotenv').config();

const db = require('./db');

const schemaSql = `
-- programs
CREATE TABLE IF NOT EXISTS programs (
  program_code VARCHAR(20) PRIMARY KEY,
  degree_type  VARCHAR(50)  NOT NULL,
  branch_name  VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- users (admin, advisor)
CREATE TABLE IF NOT EXISTS users (
  user_id      SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'advisor')),
  program_code  VARCHAR(20) REFERENCES programs(program_code) ON UPDATE CASCADE,
  semester      INT         CHECK (semester BETWEEN 1 AND 10 OR semester IS NULL),
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- students
CREATE TABLE IF NOT EXISTS students (
  student_id   SERIAL PRIMARY KEY,
  reg_no       VARCHAR(20) UNIQUE NOT NULL,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100),
  program_code VARCHAR(20) NOT NULL REFERENCES programs(program_code) ON UPDATE CASCADE,
  semester     INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
              CHECK (status IN ('ACTIVE', 'DETAINED', 'GRADUATED')),
  admission_year INT NOT NULL DEFAULT 2023,
  profile_photo_url VARCHAR(255) NULL,
  cgpa         NUMERIC(4,2) DEFAULT 0.00,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- subjects
CREATE TABLE IF NOT EXISTS subjects (
  subject_id   SERIAL PRIMARY KEY,
  subject_code VARCHAR(20) NOT NULL,
  short_code   VARCHAR(20),
  subject_name VARCHAR(100) NOT NULL,
  program_code VARCHAR(20) NOT NULL REFERENCES programs(program_code) ON UPDATE CASCADE,
  semester     INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
  type         VARCHAR(20) NOT NULL CHECK (type IN ('THEORY', 'LAB')),
  credits      INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (subject_code, program_code, semester)
);

-- exam_events
CREATE TABLE IF NOT EXISTS exam_events (
  event_id           SERIAL PRIMARY KEY,
  program_code       VARCHAR(20) NOT NULL REFERENCES programs(program_code) ON UPDATE CASCADE,
  semester           INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
  academic_year      VARCHAR(9)  NOT NULL,
  registration_start DATE NOT NULL,
  registration_end   DATE NOT NULL,
  late_fee_end       DATE NOT NULL,
  exam_start         DATE NOT NULL,
  exam_end           DATE NOT NULL,
  base_fee           INT NOT NULL DEFAULT 1000,
  late_fee           INT NOT NULL DEFAULT 0,
  event_type         VARCHAR(20) NOT NULL CHECK (event_type IN ('REGULAR', 'ARREAR')),
  minimum_cgpa       NUMERIC(4,2) DEFAULT 0.00,
  minimum_attendance NUMERIC(5,2) DEFAULT 75.00,
  is_cancelled       BOOLEAN DEFAULT FALSE,
  admit_cards_released BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (program_code, semester, event_type, academic_year)
);

-- registrations
CREATE TABLE IF NOT EXISTS registrations (
  registration_id   SERIAL PRIMARY KEY,
  student_id        INT NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
  event_id          INT NOT NULL REFERENCES exam_events(event_id) ON DELETE RESTRICT,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status    VARCHAR(20) NOT NULL DEFAULT 'INITIATED'
                   CHECK (payment_status IN ('INITIATED', 'CONFIRMED', 'FAILED')),
  fee_paid          INT NOT NULL DEFAULT 0,
  payment_order_id  VARCHAR(100),
  payment_reference VARCHAR(100),
  arrear_subject_ids JSONB NULL,
  fee_locked        INT NOT NULL DEFAULT 0,
  is_grace          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, event_id)
);

-- registration_subjects snapshot
CREATE TABLE IF NOT EXISTS registration_subjects (
  registration_id INT NOT NULL REFERENCES registrations(registration_id) ON DELETE CASCADE,
  subject_id      INT NOT NULL REFERENCES subjects(subject_id),
  PRIMARY KEY (registration_id, subject_id)
);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id         SERIAL PRIMARY KEY,
  student_id            INT NOT NULL REFERENCES students(student_id),
  subject_id            INT NOT NULL REFERENCES subjects(subject_id),
  event_id              INT NOT NULL REFERENCES exam_events(event_id),
  attendance_percentage NUMERIC(5,2) NOT NULL
                       CHECK (attendance_percentage BETWEEN 0 AND 100),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, subject_id, event_id)
);

-- exam_schedule
CREATE TABLE IF NOT EXISTS exam_schedule (
  schedule_id SERIAL PRIMARY KEY,
  event_id    INT NOT NULL REFERENCES exam_events(event_id),
  subject_id  INT NOT NULL REFERENCES subjects(subject_id),
  exam_date   DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  session     VARCHAR(20) NOT NULL CHECK (session IN ('MORNING', 'EVENING')),
  is_honors   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, subject_id)
);

-- student_backlogs
CREATE TABLE IF NOT EXISTS student_backlogs (
  backlog_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLEARED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, subject_id)
);

-- audit_logs (optional)
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id      SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(user_id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_students_regno        ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_exam_events_prog_sem  ON exam_events(program_code, semester);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event   ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student    ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event      ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_subjects_prog_sem     ON subjects(program_code, semester);
CREATE INDEX IF NOT EXISTS idx_backlogs_student      ON student_backlogs(student_id);
`;

async function initDb() {
  await db.query(schemaSql);
  // eslint-disable-next-line no-console
  console.log('DB init complete.');
  process.exit(0);
}

initDb().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('DB init failed:', err);
  process.exit(1);
});

