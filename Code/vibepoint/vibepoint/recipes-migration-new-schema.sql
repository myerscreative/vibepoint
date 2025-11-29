-- Recipes Feature Migration
-- New schema for guided mood-shifting routines

-- Drop old recipes table if it exists (backup first!)
-- Note: This will delete existing recipe data. Run a backup first if needed.
-- DROP TABLE IF EXISTS recipe_attempts CASCADE;
-- DROP TABLE IF EXISTS recipes CASCADE;

-- Create new recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_duration INTEGER NOT NULL, -- total seconds
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipe_steps table
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_favorite ON recipes(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id, order_index);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can manage their own recipe steps" ON recipe_steps;

-- Create RLS policies
CREATE POLICY "Users can manage their own recipes"
  ON recipes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recipe steps"
  ON recipe_steps FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM recipes WHERE id = recipe_steps.recipe_id
    )
  );

-- Add updated_at trigger for recipes
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recipes_updated_at ON recipes;
CREATE TRIGGER trigger_update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_updated_at();

