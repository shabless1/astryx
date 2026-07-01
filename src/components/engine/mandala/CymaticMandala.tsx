'use client'

/**
 * ASTRYX — Liquid Neon Sacred Geometry Mandala · 3D depth (Chamber visual)
 * ════════════════════════════════════════════════════════════════════════════
 * The approved look: each planet's sacred form rendered in soft neon gradient
 * (crisp lines, breathing glow, slow colour-shifting ground), then given real
 * depth — the form is drawn to an offscreen canvas and echoed back through a
 * Three.js depth tunnel (stacked additive planes) that gently turns and parallaxes
 * = a 3D kaleidoscope you look INTO.
 *
 *   • Per-planet 5-colour palette + sacred form (SHA-specified).
 *   • Pluto = a true 4D TESSERACT (cube-within-a-cube, rotating through 4D).
 *   • Planet change → dissolve / re-bloom ("the leap").
 *   • Cost scales with Animation Intensity (DPR, offscreen size, echo layers).
 *   • WebGL context loss → onContextLost → KaleidoscopeMandalaCanvas swaps to SVG.
 *
 * Ported 1:1 from the approved proofs. Pure visual layer — the planet + its shape
 * come from the frequency engine; nothing here touches calculations.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'

type Intensity = 'low' | 'medium' | 'high'
const TAU = Math.PI * 2

interface PData { cols: string[]; forms: string[]; kind?: 'tesseract' }
// Clean geometric shape per planet — the rose/orbital-ring "circle" decorations
// were removed (SHA), leaving just the core sacred form.
const PLANETS: Record<string, PData> = {
  Sun:     { cols: ['#E0431F','#FF7A1A','#FFC23D','#FFE9A8','#FFF6E6'], forms: ['seed'] },
  Moon:    { cols: ['#6E86A8','#9FB8D6','#C7D4E6','#E3ECF7','#FFFFFF'], forms: ['vesica'] },
  Mercury: { cols: ['#2FB46A','#7FD84B','#E7E25A','#CFD8D0','#F4FAF2'], forms: ['metatron'] },
  Venus:   { cols: ['#1FA978','#69D5A6','#F08CB6','#F8C2D8','#FFF5F9'], forms: ['flower'] },
  Mars:    { cols: ['#8E1B2E','#C92535','#FF3B30','#D86A2C','#F6E0D8'], forms: ['hexagram'] },
  Jupiter: { cols: ['#1E3A8A','#2F5FD0','#7E9AD8','#E6B422','#FBF3DA'], forms: ['spiral'] },
  Saturn:  { cols: ['#1A1712','#4A3B2A','#7A6E5E','#ADA79C','#EDEAE2'], forms: ['metatron'] },
  Uranus:  { cols: ['#1C3FA8','#2D8CFF','#5BC8FF','#B8C2CE','#EAF2FB'], forms: ['hexagram'] },
  Neptune: { cols: ['#241B5E','#4A36A8','#8A6CE0','#2F74C0','#ECE8FB'], forms: ['flower'] },
  Pluto:   { cols: ['#100C0E','#5A0F1E','#A11D2E','#8C8790','#F0E6C8'], forms: [], kind: 'tesseract' },
}
function dataFor(planet: string): PData {
  if (PLANETS[planet]) return PLANETS[planet]
  const p = (planet || '').toLowerCase()
  if (p.includes('moon')) return PLANETS.Moon
  if (p.includes('pluto')) return PLANETS.Pluto
  return PLANETS.Sun
}
function tierCfg(level: Intensity) {
  if (level === 'low') return { OS: 440, layers: 3, dpr: 1 }
  if (level === 'high') return { OS: 680, layers: 5, dpr: 2 }
  return { OS: 560, layers: 4, dpr: 1.5 }
}

export default function CymaticMandala({
  mandala, phaseProgress = 0, reducedMotion = false, fieldOpacity = 1, onContextLost,
}: {
  mandala: KaleidoscopeMandala
  phaseProgress?: number
  reducedMotion?: boolean
  fieldOpacity?: number
  onContextLost?: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const intensity = useAppStore((s) => s.settings.animationIntensity) as Intensity

  const ctrl = useRef({ planet: mandala.planet, reduced: reducedMotion, prog: phaseProgress })
  ctrl.current.planet = mandala.planet
  ctrl.current.reduced = reducedMotion
  ctrl.current.prog = phaseProgress

  const lostRef = useRef(onContextLost)
  lostRef.current = onContextLost

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const { OS, layers: LAYERS, dpr } = tierCfg(intensity)

    // ── offscreen 2D canvas (the mandala texture) ──
    const oc = document.createElement('canvas'); oc.width = OS; oc.height = OS
    const ctx = oc.getContext('2d')
    if (!ctx) return
    let glowPulse = 1, gStroke: CanvasGradient | string | null = null, gGlow = '#ffffff', gPrimary = false
    const D = OS / 460   // line-weight scale relative to the proof's reference size

    const wRing = (cx: number, cy: number, r: number) => { const N = 80, p: number[][] = []; for (let i=0;i<=N;i++){ const a=i/N*TAU; p.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]) } return p }
    const wLine = (x1: number, y1: number, x2: number, y2: number) => [[x1,y1],[x2,y2]]

    function neon(pts: number[][], color: string, cw: number, gw: number, a: number, closed?: boolean) {
      a *= glowPulse
      ctx!.globalCompositeOperation = 'lighter'; ctx!.lineJoin = 'round'; ctx!.lineCap = 'round'
      ctx!.strokeStyle = gStroke || color; ctx!.shadowColor = gStroke ? gGlow : color
      ctx!.beginPath(); pts.forEach((q,i) => i ? ctx!.lineTo(q[0],q[1]) : ctx!.moveTo(q[0],q[1])); if (closed) ctx!.closePath()
      ctx!.shadowBlur = gw*1.4; ctx!.globalAlpha = a*0.10; ctx!.lineWidth = gw; ctx!.stroke()
      ctx!.globalAlpha = a*0.24; ctx!.lineWidth = cw*2.2; ctx!.shadowBlur = gw*0.6; ctx!.stroke()
      ctx!.globalAlpha = a*0.62; ctx!.lineWidth = cw*1.1; ctx!.shadowBlur = gw*0.3; ctx!.stroke()
      ctx!.globalAlpha = 1; ctx!.shadowBlur = 0
    }
    const ringAt = (cx: number, cy: number, r: number, col: string, a: number) => neon(wRing(cx,cy,r), col, D*1.5, D*6, a, true)

    // ── 2D sacred forms ──
    function fSeed(R: number, c: string[], a: number) { const r=R*0.5,n=c.length; ringAt(0,0,r,c[2%n],a); for(let k=0;k<6;k++){ const g=k/6*TAU; ringAt(Math.cos(g)*r,Math.sin(g)*r,r,c[k%n],a) } }
    function fFlower(R: number, c: string[], a: number) { const r=R*0.34,n=c.length; ringAt(0,0,r,c[2%n],a); for(let k=0;k<6;k++){ const g=k/6*TAU; ringAt(Math.cos(g)*r,Math.sin(g)*r,r,c[k%n],a) } for(let k=0;k<12;k++){ const g=k/12*TAU,d=(k%2?r*Math.sqrt(3):r*2); ringAt(Math.cos(g)*d,Math.sin(g)*d,r,c[(k+1)%n],a*0.8) } }
    function fruit(R: number) { const r=R*0.32,c: number[][]=[[0,0]]; for(let k=0;k<6;k++){ const g=k/6*TAU; c.push([Math.cos(g)*r,Math.sin(g)*r]) } for(let k=0;k<6;k++){ const g=k/6*TAU; c.push([Math.cos(g)*r*2,Math.sin(g)*r*2]) } return { c, r } }
    function fMeta(R: number, c: string[], a: number) { const o=fruit(R),cc=o.c; for(let i=0;i<cc.length;i++) for(let j=i+1;j<cc.length;j++) neon(wLine(cc[i][0],cc[i][1],cc[j][0],cc[j][1]),c[0],D*0.7,D*3,a*0.16,false); cc.forEach((p,i)=>ringAt(p[0],p[1],o.r*0.5,c[i%c.length],a)) }
    function fVesica(R: number, c: string[], a: number) { const r=R*0.5,n=c.length; ringAt(-r*0.5,0,r,c[0],a); ringAt(r*0.5,0,r,c[1%n],a); ringAt(0,0,R*0.95,c[2%n],a*0.5) }
    function fHex(R: number, c: string[], a: number) { const n=c.length,tri=(rot: number,col: string)=>{ const p: number[][]=[]; for(let k=0;k<3;k++){ const g=rot+k/3*TAU; p.push([Math.cos(g)*R*0.9,Math.sin(g)*R*0.9]) } for(let k=0;k<3;k++) neon(wLine(p[k][0],p[k][1],p[(k+1)%3][0],p[(k+1)%3][1]),col,D*1.5,D*6,a,false) }; tri(-Math.PI/2,c[0]); tri(Math.PI/2,c[1%n]); ringAt(0,0,R*0.95,c[2%n],a*0.45) }
    function makeRose(pet: number) { return (R: number, c: string[], a: number) => { const n=c.length,N=240,p: number[][]=[]; for(let i=0;i<=N;i++){ const th=i/N*TAU,rr=R*Math.abs(Math.cos(pet*th)); p.push([Math.cos(th)*rr,Math.sin(th)*rr]) } neon(p,c[0],D*1.5,D*7,a,false); neon(p.map(q=>[q[0]*0.6,q[1]*0.6]),c[1%n],D*1.2,D*6,a*0.8,false) } }
    function fSpiral(R: number, c: string[], t: number, a: number) { const n=c.length,big=gPrimary,gr=big?2.95:1.5,r0=big?0.05:0.12,sp=big?0.12:0.06,arm=(dir: number)=>{ const p: number[][]=[]; for(let i=0;i<=260;i++){ const s=i/260,th=dir*s*3.4*TAU+t*sp,rr=R*r0*Math.exp(gr*s); p.push([Math.cos(th)*rr,Math.sin(th)*rr]) } neon(p,c[2%n],D*1.5,D*6,a,false) }; arm(1); arm(-1); if(big){ for(let k=0;k<5;k++){ const ph=((t*0.16+k/5)%1),fade=Math.sin(ph*Math.PI); ringAt(0,0,ph*R*0.98,c[k%n],a*fade*0.85) } } else ringAt(0,0,R*0.96,c[2%n],a*0.4) }
    function fRing(R: number, c: string[], a: number) { const n=c.length; ringAt(0,0,R*0.95,c[2%n],a*0.7); ringAt(0,0,R*0.6,c[1%n],a*0.6) }
    const r5 = makeRose(5), r6 = makeRose(6), r8 = makeRose(8)
    function runForm(fk: string, R: number, c: string[], t: number, a: number) {
      switch (fk) {
        case 'seed': return fSeed(R,c,a); case 'flower': return fFlower(R,c,a); case 'metatron': return fMeta(R,c,a)
        case 'vesica': return fVesica(R,c,a); case 'hexagram': return fHex(R,c,a)
        case 'rose5': return r5(R,c,a); case 'rose6': return r6(R,c,a); case 'rose8': return r8(R,c,a)
        case 'spiral': return fSpiral(R,c,t,a); case 'ring': return fRing(R,c,a)
      }
    }
    function gradFor(R: number, t: number) { const ang=t*0.07,dx=Math.cos(ang)*R,dy=Math.sin(ang)*R,g=ctx!.createLinearGradient(OS/2-dx,OS/2-dy,OS/2+dx,OS/2+dy); const cols=curCols(); cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c)); return g }
    let curCols: () => string[] = () => PLANETS.Sun.cols

    function drawSacred(P: PData, t: number, alpha: number) {
      const R = OS*0.34, br = 1+0.04*Math.sin(t*0.5)
      gGlow = P.cols[2]; curCols = () => P.cols; gStroke = gradFor(R*br, t)
      ctx!.save(); ctx!.translate(OS/2,OS/2); ctx!.rotate(t*0.05); ctx!.scale(br,br)
      P.forms.forEach((fk,idx)=>{ gPrimary=(idx===0); ctx!.save(); runForm(fk, R*(idx?0.78:1)/1*(1), P.cols, t+idx*1.7, alpha); ctx!.restore(); gPrimary=false })
      ctx!.restore(); gStroke = null
    }

    // ── Pluto: 4D tesseract ──
    const V4: number[][] = []; for (let i=0;i<16;i++) V4.push([(i&1?1:-1),(i&2?1:-1),(i&4?1:-1),(i&8?1:-1)])
    const E4: number[][] = []; for (let i=0;i<16;i++) for (let j=i+1;j<16;j++){ let d=0; for(let k=0;k<4;k++) if(V4[i][k]!==V4[j][k]) d++; if(d===1) E4.push([i,j]) }
    function drawTesseract(P: PData, t: number, alpha: number) {
      gGlow = P.cols[2]; curCols = () => P.cols; gStroke = gradFor(OS*0.42, t)
      const aXW=t*0.16, aYZ=t*0.11, R=OS*0.42, F=4.4
      const pr = V4.map((v) => {
        const x=v[0], y=v[1], z=v[2], w=v[3]
        const x1=x*Math.cos(aXW)-w*Math.sin(aXW), w1=x*Math.sin(aXW)+w*Math.cos(aXW)
        const y1=y*Math.cos(aYZ)-z*Math.sin(aYZ), z1=y*Math.sin(aYZ)+z*Math.cos(aYZ)
        const k=1/(2.7-w1); let X=x1*k, Y=y1*k, Z=z1*k
        const sp=t*0.05; const X2=X*Math.cos(sp)+Z*Math.sin(sp), Z2=-X*Math.sin(sp)+Z*Math.cos(sp)
        const persp=F/(F-Z2); return { sx:OS/2+X2*persp*R, sy:OS/2+Y*persp*R, z:Z2 }
      })
      E4.map((e,i)=>({ i, z:(pr[e[0]].z+pr[e[1]].z)/2 })).sort((a,b)=>a.z-b.z).forEach((o)=>{
        const e=E4[o.i], p1=pr[e[0]], p2=pr[e[1]], depth=Math.max(0,Math.min(1,(o.z+1.2)/2.4)), a=(0.4+0.6*depth)*alpha
        neon(wLine(p1.sx,p1.sy,p2.sx,p2.sy), P.cols[2], D*1.2, D*6, a, false)
      })
      gStroke = null
    }
    const drawContent = (P: PData, t: number, alpha: number) => P.kind === 'tesseract' ? drawTesseract(P,t,alpha) : drawSacred(P,t,alpha)

    // ── Three.js depth tunnel ──
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    wrap.appendChild(canvas)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(dpr, window.devicePixelRatio || 1))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100); camera.position.set(0, 0, 3.1)
    const tex = new THREE.CanvasTexture(oc); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter
    const group = new THREE.Group(); scene.add(group)
    const geo = new THREE.PlaneGeometry(3.0, 3.0)
    const mats: THREE.MeshBasicMaterial[] = []
    const planes: THREE.Mesh[] = []
    for (let k=0;k<LAYERS;k++){ const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: k===0?0.82:0.32*Math.pow(0.6,k-1) }); const mesh = new THREE.Mesh(geo, m); mesh.position.z = -k*0.6; mesh.scale.setScalar(Math.pow(0.88,k)); mats.push(m); planes.push(mesh); group.add(mesh) }

    const onLost = (e: Event) => { e.preventDefault(); lostRef.current?.() }
    canvas.addEventListener('webglcontextlost', onLost, { once: true })

    function resize() { const r = wrap!.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = (r.width || 1) / (r.height || 1); camera.updateProjectionMatrix() }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    ro?.observe(wrap); resize()

    // ── leap state ──
    let curPlanet = ctrl.current.planet, nextPlanet = ctrl.current.planet, morph = 1, morphing = false
    const FROZEN = 6.0
    let raf = 0

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      const reduced = ctrl.current.reduced
      const t = reduced ? FROZEN : now / 1000
      if (ctrl.current.planet !== nextPlanet) { nextPlanet = ctrl.current.planet; morph = 0; morphing = true }
      const settle = 1 - 0.18 * Math.max(0, Math.min(1, ctrl.current.prog))
      glowPulse = (0.30 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.8))) * settle

      // draw the mandala (or the leap blend) to the offscreen texture
      ctx!.clearRect(0, 0, OS, OS)
      if (morphing && !reduced) {
        morph = Math.min(1, morph + 0.012); const e = morph*morph*(3-2*morph)
        drawContent(dataFor(curPlanet), t, 1 - e)
        drawContent(dataFor(nextPlanet), t, e)
        if (morph >= 1) { morphing = false; curPlanet = nextPlanet }
      } else {
        if (morphing) { morphing = false; curPlanet = nextPlanet }
        drawContent(dataFor(curPlanet), t, 1)
      }
      tex.needsUpdate = true

      // pure black background
      renderer.setClearColor(0x000000, 1)
      // tunnel motion (frozen when reduced)
      planes.forEach((m,k)=>{ m.rotation.z = reduced ? k*0.4 : (k%2?-1:1)*t*(0.025+k*0.01) })
      group.rotation.x = reduced ? 0.12 : 0.18*Math.sin(t*0.16)
      group.rotation.y = reduced ? 0 : 0.20*Math.sin(t*0.12)
      camera.position.x = reduced ? 0 : 0.22*Math.sin(t*0.1)
      camera.position.y = reduced ? 0 : 0.14*Math.cos(t*0.13)
      camera.lookAt(0,0,0)
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      tex.dispose(); geo.dispose(); mats.forEach((m)=>m.dispose()); renderer.dispose()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity])

  return <div ref={wrapRef} style={{ position: 'absolute', inset: 0, opacity: fieldOpacity }} />
}
