-- Création de la table "user" dans Supabase (PostgreSQL)
-- À exécuter dans Supabase : SQL Editor → New query → coller et Run

-- "user" est un mot réservé en SQL, d'où les guillemets
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(255),
    city VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index optionnel pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
