/**
 * Script to reset the dev user password in Supabase
 * 
 * Option 1: Run this with your service role key (from Supabase Dashboard > Settings > API)
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node reset-dev-password.js
 * 
 * Option 2: Reset manually in Supabase Dashboard:
 *   1. Go to Authentication > Users
 *   2. Find dev@vibepoint.local
 *   3. Click on the user row to open user details
 *   4. Click "Change password" or "Reset password" button
 *   5. Enter new password: dev123456
 *   6. Click "Update" or "Save"
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfofqbnimxcgkqalpoze.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const newPassword = process.env.DEV_PASSWORD || 'dev123456'

if (!serviceRoleKey) {
  console.log(`
❌ No service role key provided.

To reset the dev user password, you have two options:

OPTION 1: Reset via Supabase Dashboard (Easiest)
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Go to Authentication > Users
  4. Find dev@vibepoint.local in the list
  5. Click on the user row (or the email) to open the user details
  6. In the user details panel, look for the "Password" section
  7. Click "Change password" or "Reset password" button
  8. Enter the new password: dev123456
  9. Click "Update" or "Save"
  10. Make sure "Email Confirmed" is checked (or "Auto-confirm" is ON)
  
  Alternative: If you can't find the reset option:
  - Click on the user to edit
  - Look for a password field and update it directly
  - Or delete the user and create a new one with the same email

OPTION 2: Run this script with service role key
  1. Get your service role key from Supabase Dashboard > Settings > API
  2. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node reset-dev-password.js
  3. Or set a custom password: SUPABASE_SERVICE_ROLE_KEY=your_key DEV_PASSWORD=your_password node reset-dev-password.js
  `)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetDevPassword() {
  try {
    console.log('🔍 Looking for dev user...')
    
    // First, try to find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    const devUser = users.users.find(user => user.email === 'dev@vibepoint.local')
    
    if (!devUser) {
      console.log('❌ Dev user not found!')
      console.log('Creating new dev user...')
      
      // Create the user if it doesn't exist
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'dev@vibepoint.local',
        password: newPassword,
        email_confirm: true,
      })

      if (createError) {
        console.error('❌ Error creating user:', createError.message)
        return
      }

      console.log('✅ Dev user created successfully!')
      console.log('User ID:', newUser.user.id)
      console.log('Email:', newUser.user.email)
      console.log('Password:', newPassword)
      console.log('\nYou can now use the dev sign-in button on the login page.')
      return
    }

    console.log('✅ Found dev user!')
    console.log('User ID:', devUser.id)
    console.log('Email:', devUser.email)
    console.log('\n🔄 Resetting password...')
    
    // Update the user's password
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      devUser.id,
      {
        password: newPassword,
        email_confirm: true, // Ensure email is confirmed
      }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message)
      return
    }

    console.log('✅ Password reset successfully!')
    console.log('New password:', newPassword)
    console.log('\nYou can now use the dev sign-in button on the login page.')
    console.log('Email: dev@vibepoint.local')
    console.log('Password: dev123456')
  } catch (err) {
    console.error('❌ Failed to reset password:', err.message)
  }
}

resetDevPassword()

