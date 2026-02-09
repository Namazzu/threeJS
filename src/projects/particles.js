import * as THREE from 'three'
import { Timer } from 'three/addons/misc/Timer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function particles(canvas) {
  // textures

  const textureLoader = new THREE.TextureLoader()
  const particleTexture = textureLoader.load('./particles/2.png')
  console.log(particleTexture)

  /**
   * Scene
   */
  const scene = new THREE.Scene()

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  const onResize = () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  window.addEventListener('resize', onResize)

  /**
   * Camera
   */
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100,
  )
  camera.position.z = 3
  scene.add(camera)

  /**
   * Controls
   */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  /**
   * Particle
   */

  // const particlesGeometry = new THREE.SphereGeometry(1, 32, 32)
  const particlesGeometry = new THREE.BufferGeometry()
  const count = 6000

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10
    colors[i] = Math.random()
  }

  particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    sizeAttenuation: true,
    vertexColors: true,
  })
  // By default, particles are squares, so we need to make them transparent to see behind them.
  // Several solutions are viable depending on the use case.
  particlesMaterial.transparent = true
  particlesMaterial.alphaMap = particleTexture
  // When we add alphaMap, it works but we encounter a rendering problem;
  // it's a bug in the particle rendering order.
  // every next solutions are ok perf.

  // one solution is to use .alphaTest . That will be great but not perfect.
  // is you use a circle particle, you can see an small "halo" around him.
  // if your particles moves its ok, but if they are fixe you need another solution
  // particlesMaterial.alphaTest = 0.001

  // you can use .depthTest
  // but that can create bugs if you have other objects in your scene or another particles with different colors.
  // particlesMaterial.depthTest = false

  // The depth of what's being drawn is stored in depth buffer.
  // instead of not testing if the particle is closer than what's in this depth buffer,
  // we can tell the webGL not to write particles in that depth buffer with .depthWrite
  // particlesMaterial.depthWrite = false

  // the last solution is to combining pixels
  // that give a highlight effect
  // but can have performance impact.
  // particlesMaterial.depthWrite = false
  // particlesMaterial.blending = THREE.AdditiveBlending

  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)

  /**
   * Animate
   */
  const timer = new Timer()
  let animationFrameId = null

  const tick = () => {
    timer.update()
    const elapsedTime = timer.getElapsed()

    // update particles
    // particles.rotation.y = elapsedTime * 0.02

    // solution to do a wave
    // ! Its a bad solutions for more than 50 or 100 particles
    // const particlesPositionArr = particlesGeometry.attributes.position.array
    // for (let i = 0; i < count; i++) {
    //   const i3 = i * 3
    //   // use x to add a offset
    //   const x = particlesPositionArr[i3]
    //   particlesPositionArr[i3 + 1] = Math.sin(elapsedTime + x)
    // }
    // particlesGeometry.attributes.position.needsUpdate = true

    // the better solution is to use custom shader to do that.

    controls.update()
    renderer.render(scene, camera)

    animationFrameId = window.requestAnimationFrame(tick)
  }

  tick()

  /**
   * Cleanup
   */
  return function dispose() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
    }
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose()
        if (child.material.isMaterial) {
          for (const key of Object.keys(child.material)) {
            const value = child.material[key]
            if (value && typeof value.dispose === 'function') {
              value.dispose()
            }
          }
          child.material.dispose()
        }
      }
    })
  }
}
