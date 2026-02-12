import GUI from 'lil-gui'
import * as THREE from 'three'
import { Timer } from 'three/addons/misc/Timer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function galaxyGenerator(canvas) {
  /**
   * Scene
   */
  // debug
  const gui = new GUI({ width: 480 })
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
  camera.position.z = 5
  camera.position.x = 7
  camera.position.y = 5
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
   * Galaxy
   */

  const parameters = {
    count: 100000,
    size: 0.02,
    radius: 5,
    branches: 4,
    spin: 1,
    randomness: 0.2,
    randomnessPower: 2.5,
    insideColor: '#ff6030',
    outsideColor: '#1b3984',
    rotationSpeed: 0.1,
  }

  let geometry
  let material
  let points

  const generateGalaxy = () => {
    // clean the old galaxy
    if (points) {
      geometry.dispose()
      material.dispose()
      scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3
      // positions
      const radius = Math.random() * parameters.radius
      const spinAngle = radius * parameters.spin
      const branchAngle =
        ((i % parameters.branches) / parameters.branches) * Math.PI * 2

      const randomX =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1)
      const randomY =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1)
      const randomZ =
        Math.pow(Math.random(), parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1)

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

      // color
      // we need to clone colorInside because that change the original object
      const mixedColor = colorInside.clone()
      mixedColor.lerp(colorOutside, radius / parameters.radius)

      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    /**
     * Material
     */

    material = new THREE.PointsMaterial({
      size: parameters.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    scene.add(points)
  }

  generateGalaxy()

  gui
    .add(parameters, 'count')
    .min(100)
    .max(1000000)
    .step(100)
    .onFinishChange(generateGalaxy)
  gui
    .add(parameters, 'size')
    .min(0.001)
    .max(0.1)
    .step(0.001)
    .onFinishChange(generateGalaxy)

  gui
    .add(parameters, 'radius')
    .min(0.01)
    .max(20)
    .step(0.01)
    .onFinishChange(generateGalaxy)

  gui
    .add(parameters, 'branches')
    .min(2)
    .max(20)
    .step(1)
    .onFinishChange(generateGalaxy)

  gui
    .add(parameters, 'spin')
    .min(-5)
    .max(5)
    .step(0.001)
    .onFinishChange(generateGalaxy)
  gui
    .add(parameters, 'randomness')
    .min(0)
    .max(2)
    .step(0.001)
    .onFinishChange(generateGalaxy)

  gui
    .add(parameters, 'randomnessPower')
    .min(1)
    .max(10)
    .step(0.001)
    .onFinishChange(generateGalaxy)
  gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
  gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)
  gui
    .add(parameters, 'rotationSpeed')
    .min(0)
    .max(1)
    .step(0.001)
    .name('Rotation Speed')
  /**
   * Animate
   */
  const timer = new Timer()
  let animationFrameId = null

  console.log('------------------START-------------------')
  console.log(scene)
  console.log('--------------------END-------------------')

  const tick = () => {
    timer.update()
    const elapsedTime = timer.getElapsed()

    points.rotation.y = elapsedTime * parameters.rotationSpeed
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
