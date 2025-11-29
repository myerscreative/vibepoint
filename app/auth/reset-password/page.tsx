'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, handleAuthError } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  // Force dark text on password fields after render
  useEffect(() => {
    const forceDarkText = (input: HTMLInputElement | null) => {
      if (input) {
        input.style.color = '#111827'
        input.style.webkitTextFillColor = '#111827'
        input.style.caretColor = '#111827'
      }
    }
    
    forceDarkText(passwordRef.current)
    forceDarkText(confirmPasswordRef.current)
    
    // Also set on any autofill
    const observer = new MutationObserver(() => {
      forceDarkText(passwordRef.current)
      forceDarkText(confirmPasswordRef.current)
    })
    
    if (passwordRef.current) {
      observer.observe(passwordRef.current, { attributes: true, attributeFilter: ['style', 'class'] })
    }
    if (confirmPasswordRef.current) {
      observer.observe(confirmPasswordRef.current, { attributes: true, attributeFilter: ['style', 'class'] })
    }
    
    return () => observer.disconnect()
  }, [])

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        setError(handleAuthError(updateError))
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      console.error('Password reset exception:', err)
      setError(handleAuthError(err))
      setLoading(false)
    }
  }

  const forceDarkText = (e: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e.target) {
      e.target.style.color = '#111827'
      e.target.style.webkitTextFillColor = '#111827'
      e.target.style.caretColor = '#111827'
    }
  }

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Main container */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <Logo variant="full" size="md" />
            </div>
            <h2 className="auth-title">Reset Your Password</h2>
            <p className="auth-subtitle">Enter your new password below</p>
          </div>

          {/* Error message */}
          {error && !success && (
            <div className="auth-message auth-message-error">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="auth-message" style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#16a34a'
            }}>
              Password reset successfully! Redirecting to login...
            </div>
          )}

          {/* Form */}
          {!success && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              {/* Password field */}
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`form-input password-input-dark ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    forceDarkText(e)
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined })
                    }
                  }}
                  onFocus={forceDarkText}
                  onBlur={forceDarkText}
                  style={{ color: '#111827', WebkitTextFillColor: '#111827', caretColor: '#111827' }}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              {/* Confirm Password field */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`form-input password-input-dark ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    forceDarkText(e)
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined })
                    }
                  }}
                  onFocus={forceDarkText}
                  onBlur={forceDarkText}
                  style={{ color: '#111827', WebkitTextFillColor: '#111827', caretColor: '#111827' }}
                />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`auth-button ${loading ? 'auth-button-loading' : ''}`}
              >
                {loading ? '' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Footer link */}
          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link href="/auth/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <Link href="/" className="back-home-link">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

