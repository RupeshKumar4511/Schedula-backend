-- SQL migration: create users table for Drizzle
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  password_hash TEXT;
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
