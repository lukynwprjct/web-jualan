'use client'

import { useEffect, useRef } from 'react'

interface BlackHoleBackgroundProps {
  speed?: number
  showVideo?: boolean
}

export default function BlackHoleBackground({ 
  speed = 0.3, 
  showVideo = true 
}: BlackHoleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('webgl')
    if (!ctx) {
      console.log('WebGL not supported, showing fallback video')
      return
    }

    // Vertex shader — position vertices
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    // Fragment shader — black hole with accretion disk
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;

      // Rotate 2D point
      vec2 rotate(vec2 uv, float rotation) {
        float s = sin(rotation);
        float c = cos(rotation);
        return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
      }

      // Palette function — black to deep red
      vec3 palette(float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 0.0, 0.0); // Red edge
        vec3 d = vec3(0.0, 0.0, 0.0); // Black center
        return a + b * cos(6.28318 * (c * t + d + u_time * u_speed * 0.1));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        vec2 uv0 = uv;
        
        // Initialize color
        vec3 finalColor = vec3(0.0);
        
        // Fractal iterations
        for (float i = 0.0; i < 4.0; i++) {
          uv = rotate(uv, u_time * u_speed * 0.05 * (i + 1.0));
          
          // Distance field
          float dist = length(uv) * exp(-length(uv));
          
          // Create accretion disk pattern
          float ring = sin(dist * 8.0 + u_time * u_speed * 2.0);
          ring *= 0.1 / dist;
          
          // Black hole center (dark)
          float center = smoothstep(0.3, 0.0, length(uv));
          
          // Combine patterns
          float pattern = ring * center;
          pattern += 0.05 * sin(uv.x * 20.0 + u_time * u_speed);
          pattern += 0.05 * sin(uv.y * 20.0 + u_time * u_speed);
          
          // Color based on pattern
          vec3 color = palette(pattern);
          
          // Add to final color
          finalColor += color * 0.25;
          
          // Scale UV for fractal effect
          uv = uv * 1.5 + uv0 * 0.5;
        }

        // Brighter edges (accretion disk)
        float glow = 1.0 - smoothstep(0.0, 1.0, length(uv0) * 1.5);
        finalColor += vec3(0.8, 0.2, 0.2) * glow * 0.3;

        // Gamma correction
        finalColor = pow(finalColor, vec3(0.4545));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    // Compile shaders
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(ctx, ctx.VERTEX_SHADER, vertexShaderSource)!
    const fragmentShader = createShader(ctx, ctx.FRAGMENT_SHADER, fragmentShaderSource)!

    // Create program
    const program = ctx.createProgram()!
    ctx.attachShader(program, vertexShader)
    ctx.attachShader(program, fragmentShader)
    ctx.linkProgram(program)
    ctx.useProgram(program)

    // Set up full-screen quad
    const positionBuffer = ctx.createBuffer()
    ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer)
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), ctx.STATIC_DRAW)

    const positionLocation = ctx.getAttribLocation(program, 'a_position')
    ctx.enableVertexAttribArray(positionLocation)
    ctx.vertexAttribPointer(positionLocation, 2, ctx.FLOAT, false, 0, 0)

    // Uniforms
    const resolutionLocation = ctx.getUniformLocation(program, 'u_resolution')
    const timeLocation = ctx.getUniformLocation(program, 'u_time')
    const speedLocation = ctx.getUniformLocation(program, 'u_speed')

    // Resize handler
    function resize() {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
      ctx.viewport(0, 0, width, height)
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    const startTime = performance.now()

    function animate() {
      const currentTime = (performance.now() - startTime) / 1000
      ctx.uniform2f(resolutionLocation, canvas.width, canvas.height)
      ctx.uniform1f(timeLocation, currentTime)
      ctx.uniform1f(speedLocation, speed)

      ctx.drawArrays(ctx.TRIANGLES, 0, 6)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [speed])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Fallback Video */}
      {showVideo && (
        <video
          ref={videoRef}
          src="/bg-blackhole.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100"
          style={{ display: 'none' }} // Will be shown if WebGL fails
        />
      )}

      {/* Overlay gradient for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, #000000 100%)',
          opacity: 0.8
        }}
      />
    </div>
  )
}
