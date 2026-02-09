import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Timer } from 'three/addons/misc/Timer.js'

export default function galaxyGenerator(canvas) {
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
    100
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
   * TODO: Ajoute ton code galaxy generator ici
   */

  /**
   * Animate
   */
  const timer = new Timer()
  let animationFrameId = null

  const tick = () => {
    timer.update()
    const elapsedTime = timer.getElapsed()

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
