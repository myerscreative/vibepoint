'use client'

export function GradientBackground() {
  return (
    <>
      {/* Main gradient background using emotion_gradent_v2.jpg */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          backgroundImage: 'url(/emotion_gradent_v2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Floating orbs - use SOFT muted colors, NOT the mood gradient colors */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full animate-float"
          style={{ background: '#a8e0eb', filter: 'blur(80px)', opacity: 0.25 }}
        />
        <div 
          className="absolute top-[20%] -right-36 w-96 h-96 rounded-full animate-float"
          style={{ background: '#f0c6d8', filter: 'blur(80px)', opacity: 0.2, animationDelay: '-5s' }}
        />
        <div 
          className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full animate-float"
          style={{ background: '#e8d4c8', filter: 'blur(80px)', opacity: 0.2, animationDelay: '-10s' }}
        />
      </div>
    </>
  )
}


