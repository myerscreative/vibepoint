'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface MoodCoordinates {
  x: number // motivation (0-1)
  y: number // happiness (0-1)
}

interface GradientSelectorProps {
  onMoodSelect: (coordinates: MoodCoordinates) => void
  selectedMood?: MoodCoordinates
  showStats?: boolean
  showHeader?: boolean
  className?: string
  gradientClassName?: string
}

interface HSL {
  h: number // Hue: 0-360
  s: number // Saturation: 0-100
  l: number // Lightness: 0-100
}

interface RGB {
  r: number // Red: 0-255
  g: number // Green: 0-255
  b: number // Blue: 0-255
}

// Corner colors in HSL (Hue, Saturation, Lightness)
const cornersHSL = {
  topLeft: { h: 195, s: 70, l: 65 },      // Cyan/Sky Blue (happy + unmotivated)
  topRight: { h: 45, s: 100, l: 55 },     // Bright Yellow/Gold (happy + motivated)
  bottomLeft: { h: 260, s: 75, l: 35 },   // Deep Purple/Indigo (unhappy + unmotivated)
  bottomRight: { h: 348, s: 80, l: 50 }   // Vibrant Red/Crimson (unhappy + motivated)
}

// HSL to RGB conversion function
function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100
  l /= 100
  
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  
  let r = 0, g = 0, b = 0
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

// Bilinear interpolation in HSL space
function bilinearInterpolateHSL(
  x: number, 
  y: number, 
  c00: HSL, 
  c10: HSL, 
  c01: HSL, 
  c11: HSL
): RGB {
  // Interpolate Hue (handle circular nature - 0° = 360°)
  const interpolateHue = (h1: number, h2: number, h3: number, h4: number) => {
    // Convert to radians for circular interpolation
    const toRad = (h: number) => (h * Math.PI) / 180
    const toDeg = (r: number) => (r * 180) / Math.PI
    
    const h1r = toRad(h1), h2r = toRad(h2), h3r = toRad(h3), h4r = toRad(h4)
    
    // Interpolate in circular space
    const hx = Math.sin(h1r) * (1 - x) * (1 - y) +
               Math.sin(h2r) * x * (1 - y) +
               Math.sin(h3r) * (1 - x) * y +
               Math.sin(h4r) * x * y
    
    const hy = Math.cos(h1r) * (1 - x) * (1 - y) +
               Math.cos(h2r) * x * (1 - y) +
               Math.cos(h3r) * (1 - x) * y +
               Math.cos(h4r) * x * y
    
    let hue = toDeg(Math.atan2(hx, hy))
    if (hue < 0) hue += 360
    
    return hue
  }
  
  // Standard bilinear for Saturation and Lightness
  const h = interpolateHue(c00.h, c10.h, c01.h, c11.h)
  
  const s = c00.s * (1 - x) * (1 - y) +
            c10.s * x * (1 - y) +
            c01.s * (1 - x) * y +
            c11.s * x * y
  
  const l = c00.l * (1 - x) * (1 - y) +
            c10.l * x * (1 - y) +
            c01.l * (1 - x) * y +
            c11.l * x * y
  
  // Convert back to RGB
  return hslToRgb(h, s, l)
}

// Get color at specific position in gradient (x and y are 0-1 values)
function getColorAtPosition(x: number, y: number): string {
  const color = bilinearInterpolateHSL(
    x,
    y,
    cornersHSL.topLeft,
    cornersHSL.topRight,
    cornersHSL.bottomLeft,
    cornersHSL.bottomRight
  )
  
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

export default function GradientSelector({
  onMoodSelect,
  selectedMood,
  showStats = true,
  showHeader = true,
  className = '',
  gradientClassName = '',
}: GradientSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gradientContainerRef = useRef<HTMLDivElement>(null)
  const [internalMood, setInternalMood] = useState<MoodCoordinates | null>(null)
  const [happiness, setHappiness] = useState(50)
  const [motivation, setMotivation] = useState(50)
  const [selectedColor, setSelectedColor] = useState('rgb(0, 0, 0)')
  const [displayHappiness, setDisplayHappiness] = useState(50)
  const [displayMotivation, setDisplayMotivation] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  
  // Use controlled state if provided, otherwise internal state
  const currentMood = selectedMood !== undefined ? selectedMood : internalMood

  // Derive happiness and motivation from currentMood for display
  // In uncontrolled mode, use state; in controlled mode, derive from prop
  const targetHappiness = currentMood ? Math.round(currentMood.y * 100) : 50
  const targetMotivation = currentMood ? Math.round(currentMood.x * 100) : 50

  // Update state when target values change (but only if they differ)
  // This is necessary for smooth animation when in controlled mode
  useEffect(() => {
    if (selectedMood !== undefined && currentMood) {
      // In controlled mode, sync state to target for animation
      setHappiness(targetHappiness)
      setMotivation(targetMotivation)
      // Sync selected color when mood is controlled externally
      const color = getColorAtPosition(
        currentMood.x,
        1 - currentMood.y // Inverted for gradient space
      )
      setSelectedColor(color)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHappiness, targetMotivation, selectedMood])

  // Smooth percentage animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayHappiness(prev => {
        const diff = happiness - prev
        if (Math.abs(diff) < 0.5) return happiness
        return prev + diff * 0.15
      })
      setDisplayMotivation(prev => {
        const diff = motivation - prev
        if (Math.abs(diff) < 0.5) return motivation
        return prev + diff * 0.15
      })
    }, 16)
    
    return () => clearInterval(interval)
  }, [happiness, motivation])

  // Draw bilinear gradient to canvas using HSL interpolation
  const drawGradient = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height

    if (displayWidth === 0 || displayHeight === 0) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = displayWidth + 'px'
    canvas.style.height = displayHeight + 'px'
    
    ctx.scale(dpr, dpr)

    const width = displayWidth
    const height = displayHeight

    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = px / (width - 1)
        const y = py / (height - 1)

        // Use HSL interpolation
        const color = bilinearInterpolateHSL(
          x,
          y,
          cornersHSL.topLeft,
          cornersHSL.topRight,
          cornersHSL.bottomLeft,
          cornersHSL.bottomRight
        )

        const index = (py * width + px) * 4
        data[index] = color.r
        data[index + 1] = color.g
        data[index + 2] = color.b
        data[index + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [])

  useEffect(() => {
    drawGradient()

    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        drawGradient()
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [drawGradient])

  useEffect(() => {
    const stopDragging = () => {
      isDraggingRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mouseup', stopDragging)
    window.addEventListener('touchend', stopDragging)

    return () => {
      window.removeEventListener('mouseup', stopDragging)
      window.removeEventListener('touchend', stopDragging)
    }
  }, [])

  const createRipple = useCallback((x: number, y: number) => {
    const container = gradientContainerRef.current
    if (!container) return

    const ripple = document.createElement('div')
    ripple.className = 'click-ripple'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    
    container.appendChild(ripple)
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
    
    setTimeout(() => {
      ripple.remove()
    }, 800)
  }, [])

  const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, isClick = false) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    let clientX: number
    let clientY: number

    if ('touches' in e) {
      if (e.touches.length === 0) return
      if (typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const clickX = clientX - rect.left
    const clickY = clientY - rect.top

    const x = Math.max(0, Math.min(1, clickX / rect.width))
    const y = Math.max(0, Math.min(1, 1 - (clickY / rect.height))) // Invert so top = happy

    // Update mood coordinates first for immediate marker update
    const mood = { x, y }
    if (selectedMood === undefined) {
      setInternalMood(mood)
    }

    // Update percentage displays (derive from mood coordinates)
    const motivationValue = Math.round(x * 100)
    const happinessValue = Math.round(y * 100)
    setMotivation(motivationValue)
    setHappiness(happinessValue)

    // Update selected color based on current position using HSL interpolation
    const xRatio = x
    const yRatio = 1 - y // Inverted for gradient space

    const color = bilinearInterpolateHSL(
      xRatio,
      yRatio,
      cornersHSL.topLeft,
      cornersHSL.topRight,
      cornersHSL.bottomLeft,
      cornersHSL.bottomRight
    )

    setSelectedColor(`rgb(${color.r}, ${color.g}, ${color.b})`)

    // Create ripple effect on click
    if (isClick) {
      createRipple(clickX, clickY)
    }

    // Call callback after state updates
    onMoodSelect(mood)
  }

  const handlePointerDown = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    setIsDragging(true)
    handleInteraction(event, true)
  }

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    handleInteraction(event)
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }


  return (
    <div className={`w-full ${showHeader ? 'max-w-2xl mx-auto px-4 py-8' : ''} ${className}`}>
      {showHeader && (
        <div className="text-center" style={{ marginBottom: '16px' }}>
          <h1 className="mb-3 text-4xl font-bold">How are you feeling?</h1>
          <p className="mood-mapping-title">Tap anywhere on the gradient to show your current mood</p>
        </div>
      )}

      {/* Wrapper with axis labels outside gradient */}
      <div className="relative w-full">
        {/* Top: Happy - positioned 8px above gradient */}
        <div
          className="pointer-events-none z-20 axis-label axis-top"
          style={{ 
            zIndex: 20,
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          HAPPY
        </div>

        {/* Gradient Container wrapper - centered with absolutely positioned labels */}
        <div
          className="relative"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '480px',
          }}
        >
          {/* Left: Unmotivated - absolutely positioned */}
          <div
            className="pointer-events-none z-20 axis-label axis-left"
            style={{
              zIndex: 20,
            }}
          >
            UNMOTIVATED
          </div>

          {/* Gradient Frame wrapper */}
          <div className="gradient-frame" style={{ maxWidth: '480px', width: '100%', position: 'relative' }}>
            <div className="gradient-inner" style={{ position: 'relative' }}>
              {/* Gradient Container */}
              <div
                ref={containerRef}
                className={`relative aspect-square cursor-crosshair overflow-hidden gradient-container mood-canvas ${gradientClassName}`}
                style={{
                  maxWidth: '100%',
                  width: '100%',
                  borderRadius: '40px',
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <div ref={gradientContainerRef} className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            display: 'block',
            zIndex: 0,
            borderRadius: '40px',
          }}
        />

        {/* Tick marks - inside gradient container, pointing inward */}
        {/* Top edge - ticks point down (inward) */}
        {[25, 50, 75].map((percent) => (
          <div key={`top-tick-${percent}`} className="pointer-events-none absolute z-10" style={{ zIndex: 10, left: `${percent}%`, top: 0, transform: 'translateX(-50%)' }}>
            <div
              style={{
                width: '1px',
                height: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            />
          </div>
        ))}

        {/* Bottom edge - ticks point up (inward) */}
        {[25, 50, 75].map((percent) => (
          <div key={`bottom-tick-${percent}`} className="pointer-events-none absolute z-10" style={{ zIndex: 10, left: `${percent}%`, bottom: 0, transform: 'translateX(-50%)' }}>
            <div
              style={{
                width: '1px',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
          </div>
        ))}

        {/* Left edge - ticks point right (inward) */}
        {[0, 25, 50, 75, 100].map((percent) => {
          if (percent === 0 || percent === 100) return null
          return (
            <div key={`left-tick-${percent}`} className="pointer-events-none absolute z-10" style={{ zIndex: 10, top: `${percent}%`, left: 0, transform: 'translateY(-50%)' }}>
              <div
                style={{
                  width: '8px',
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.3)',
                }}
              />
            </div>
          )
        })}

        {/* Right edge - ticks point left (inward) */}
        {[0, 25, 50, 75, 100].map((percent) => {
          if (percent === 0 || percent === 100) return null
          return (
            <div key={`right-tick-${percent}`} className="pointer-events-none absolute z-10" style={{ zIndex: 10, top: `${percent}%`, right: 0, transform: 'translateY(-50%)' }}>
              <div
                style={{
                  width: '8px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              />
            </div>
          )
        })}

        {/* Percentage labels - positioned 12px inside gradient edges */}
        {/* Top labels (25%, 50%, 75%) */}
        {[25, 50, 75].map((percent) => (
          <span
            key={`top-label-${percent}`}
            className="pointer-events-none percentage-label percentage-label-top absolute z-10"
            style={{
              color: 'rgba(0, 0, 0, 0.4)',
              fontSize: '11px',
              top: '12px',
              left: `${percent}%`,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {percent}%
          </span>
        ))}

        {/* Right labels (75%, 50%, 25% - inverted to match happiness scale) */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const invertedPercent = 100 - percent
          if (percent === 0 || percent === 100) return null
          return (
            <span
              key={`right-label-${percent}`}
              className="pointer-events-none percentage-label percentage-label-right absolute z-10"
              style={{
                color: 'rgba(0, 0, 0, 0.35)',
                fontSize: '11px',
                right: '12px',
                top: `${percent}%`,
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}
            >
              {invertedPercent}%
            </span>
          )
        })}

        {/* Bottom labels (25%, 50%, 75%) */}
        {[25, 50, 75].map((percent) => (
          <span
            key={`bottom-label-${percent}`}
            className="pointer-events-none percentage-label percentage-label-bottom absolute z-10"
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '11px',
              bottom: '12px',
              left: `${percent}%`,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {percent}%
          </span>
        ))}

        {/* Left labels (75%, 50%, 25% - inverted to match happiness scale) */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const invertedPercent = 100 - percent
          if (percent === 0 || percent === 100) return null
          return (
            <span
              key={`left-label-${percent}`}
              className="pointer-events-none percentage-label percentage-label-left absolute z-10"
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '11px',
                left: '12px',
                top: `${percent}%`,
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}
            >
              {invertedPercent}%
            </span>
          )
        })}

        {/* Grid lines - appear on hover */}
        <div className="grid-overlay pointer-events-none absolute inset-0 z-5">
          {/* Vertical lines at 25%, 50%, 75% */}
          {[25, 50, 75].map((percent) => (
            <div
              key={`v-${percent}`}
              className="grid-line absolute top-0 bottom-0"
              style={{
                left: `${percent}%`,
                width: '0.5px',
                background: 'rgba(255, 255, 255, 0.12)',
              }}
            />
          ))}
          {/* Horizontal lines at 25%, 50%, 75% */}
          {[25, 50, 75].map((percent) => (
            <div
              key={`h-${percent}`}
              className="grid-line absolute left-0 right-0"
              style={{
                top: `${percent}%`,
                height: '0.5px',
                background: 'rgba(255, 255, 255, 0.12)',
              }}
            />
          ))}
        </div>

        {/* Mood Marker - Clean and simple with smooth transitions */}
        {currentMood && (
          <div
            className="pointer-events-none absolute z-30 mood-marker"
            style={{
              left: `${currentMood.x * 100}%`,
              top: `${(1 - currentMood.y) * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 30,
              // Disable transitions during drag for instant updates, enable when not dragging
              transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
            }}
          >
            <div className="marker-ring" />
            <div className="marker-dot" />
          </div>
        )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Motivated - absolutely positioned */}
          <div
            className="pointer-events-none z-20 axis-label axis-right"
            style={{
              zIndex: 20,
            }}
          >
            MOTIVATED
          </div>
        </div>
        
        {/* Bottom: Unhappy - positioned 8px below gradient */}
        <div
          className="pointer-events-none z-20 axis-label axis-bottom"
          style={{ 
            zIndex: 20,
            textAlign: 'center',
            marginTop: '8px',
          }}
        >
          UNHAPPY
        </div>
      </div>

      {/* Instruction text */}
      {showStats && (
        <p className="instruction-text" style={{ marginTop: '24px' }}>
          Tap anywhere to capture your current state
        </p>
      )}

      {/* Percentage Readout - Combined compact layout (exact structure) */}
      {showStats && currentMood && (
        <div className="percentage-readout-combined">
          <div className="readout-row">
            <div className="readout-item">
              <span className="readout-label">HAPPINESS</span>
              <span className="readout-value" style={{ color: selectedColor }}>
                {Math.round(displayHappiness)}<span className="readout-percent">%</span>
              </span>
            </div>
            <span className="readout-divider">•</span>
            <div className="readout-item">
              <span className="readout-label">MOTIVATION</span>
              <span className="readout-value" style={{ color: selectedColor }}>
                {Math.round(displayMotivation)}<span className="readout-percent">%</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
