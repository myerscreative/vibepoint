/**
 * Script to create a dev user account in Supabase
 * 
 * Option 1: Run this with your service role key (from Supabase Dashboard > Settings > API)
 *   SERVICE_ROLE_KEY=your_service_role_key node create-dev-user.js
 * 
 * Option 2: Create manually in Supabase Dashboard:
 *   1. Go to Authentication > Users
 *   2. Click "Add User" > "Create new user"
 *   3. Email: dev@vibepoint.local
 *   4. Password: dev123456
 *   5. Auto-confirm: ON
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfofqbnimxcgkqalpoze.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.log(`
❌ No service role key provided.

To create the dev user, you have two options:

OPTION 1: Create via Supabase Dashboard (Easiest)
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Go to Authentication > Users
  4. Click "Add User" > "Create new user"
  5. Fill in:
     - Email: dev@vibepoint.local
     - Password: dev123456
     - Auto-confirm: ON (important!)
  6. Click "Create user"

OPTION 2: Run this script with service role key
  1. Get your service role key from Supabase Dashboard > Settings > API
  2. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node create-dev-user.js
  `)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDevUser() {
  try {
    console.log('🔍 Checking if dev user exists...')
    
    // First, try to find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    const devUser = users.users.find(user => user.email === 'dev@vibepoint.local')
    
    if (devUser) {
      console.log('✅ Dev user already exists!')
      console.log('User ID:', devUser.id)
      console.log('Email:', devUser.email)
      console.log('\nTo reset the password, run: node reset-dev-password.js')
      console.log('Or use the dev sign-in button on the login page.')
      return
    }

    console.log('Creating new dev user account...')
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'dev@vibepoint.local',
      password: 'dev123456',
      email_confirm: true, // Auto-confirm the email
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
    } else {
      console.log('✅ Dev user created successfully!')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      console.log('Password: dev123456')
      console.log('\nYou can now use the dev sign-in button on the login page.')
    }
  } catch (err) {
    console.error('❌ Failed to create user:', err.message)
  }
}

createDevUser()


