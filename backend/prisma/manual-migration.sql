-- Add missing fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS logged_hours DECIMAL(10, 2) DEFAULT 0;

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    dependent_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    blocking_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'BLOCKS',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(dependent_task_id, blocking_task_id)
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    hours DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create active_timers table
CREATE TABLE IF NOT EXISTS active_timers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    description TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking ON task_dependencies(blocking_task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_active_timers_user ON active_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_task ON active_timers(task_id);
