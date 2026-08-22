CREATE TABLE IF NOT EXISTS community_users (
 id SERIAL PRIMARY KEY, registration_number SERIAL UNIQUE, name VARCHAR(100) NOT NULL,
 username VARCHAR(50) NOT NULL UNIQUE, password_hash TEXT NOT NULL, avatar_url TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_users_username_lower ON community_users (LOWER(username));
CREATE TABLE IF NOT EXISTS community_posts (
 id SERIAL PRIMARY KEY, content TEXT NOT NULL CHECK(char_length(content) BETWEEN 1 AND 500),
 author_user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE,
 author_admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
 is_admin_post BOOLEAN NOT NULL DEFAULT FALSE,
 status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active','reported','approved','removed')),
 created_at TIMESTAMPTZ DEFAULT NOW(),
 CONSTRAINT chk_one_author CHECK(
  (author_user_id IS NOT NULL AND author_admin_id IS NULL AND is_admin_post=FALSE) OR
  (author_admin_id IS NOT NULL AND author_user_id IS NULL AND is_admin_post=TRUE)
 )
);
CREATE TABLE IF NOT EXISTS community_likes (
 id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 user_id INTEGER REFERENCES community_users(id) ON DELETE CASCADE,
 admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(),
 CONSTRAINT chk_like_one_author CHECK((user_id IS NOT NULL AND admin_id IS NULL) OR (admin_id IS NOT NULL AND user_id IS NULL)),
 CONSTRAINT uq_like_user UNIQUE(post_id,user_id), CONSTRAINT uq_like_admin UNIQUE(post_id,admin_id)
);
CREATE TABLE IF NOT EXISTS community_reports (
 id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 reporter_user_id INTEGER REFERENCES community_users(id) ON DELETE SET NULL,
 reporter_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL, reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW(),
 CONSTRAINT chk_reporter CHECK((reporter_user_id IS NOT NULL AND reporter_admin_id IS NULL) OR (reporter_admin_id IS NOT NULL AND reporter_user_id IS NULL))
);
