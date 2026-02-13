import './style.css'

const projects = {
  'haunted-house': {
    name: 'Haunted House',
    description: 'Une maison hantée avec fantômes, ombres et brouillard',
    image: './screen/haunted_house.png',
    video: './screen/video/haunted_house.mp4',
    load: () => import('./projects/haunted-house.js'),
  },
  particles: {
    name: 'Particles',
    description: 'Expérimentations avec des systèmes de particules',
    image: './screen/particles.png',
    video: './screen/video/particles.mp4',
    load: () => import('./projects/particles.js'),
  },
  'galaxy-generator': {
    name: 'Galaxy Generator',
    description: 'Un générateur de galaxies avec des particules',
    image: './screen/galaxy.png',
    video: './screen/video/galaxy.mp4',
    load: () => import('./projects/galaxy-generator.js'),
  },
}

// DOM elements
const menu = document.getElementById('menu')
const canvas = document.querySelector('canvas.webgl')
const backButton = document.getElementById('back-button')
const projectList = document.getElementById('project-list')

/**
 * current project dispose
 */
let currentDispose = null

/**
 * build menu dynamically
 */
const buildMenu = () => {
  projectList.innerHTML = ''

  for (const [key, project] of Object.entries(projects).reverse()) {
    const card = document.createElement('a')
    card.href = `?project=${key}`
    card.className = 'project-card'
    card.addEventListener('click', (e) => {
      e.preventDefault()
      loadProject(key)
    })

    card.innerHTML = `
      <div class="project-card-media">
        ${project.image ? `<img src="${project.image}" alt="${project.name}" />` : ''}
        ${project.video ? `<video src="${project.video}" muted loop playsinline preload="none"></video>` : ''}
      </div>
      <div class="project-card-content">
        <h2>${project.name}</h2>
        <p>${project.description}</p>
      </div>
    `

    // Hover video play/pause (desktop)
    if (project.video) {
      const video = card.querySelector('video')
      card.addEventListener('mouseenter', () => {
        video.currentTime = 0
        video.play()
      })
      card.addEventListener('mouseleave', () => {
        video.pause()
      })
    }

    projectList.appendChild(card)
  }

  setupScrollVisibility()
}

/**
 * On mobile: detect visible card on scroll, add selection border and play video
 */
function setupScrollVisibility() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile) return

  const cards = projectList.querySelectorAll('.project-card')

  const visibilityMap = new Map()

  const updateVisibleCard = () => {
    let bestCard = null
    let bestRatio = 0
    for (const [card, ratio] of visibilityMap) {
      if (ratio > bestRatio) {
        bestRatio = ratio
        bestCard = card
      }
    }

    cards.forEach((card) => {
      const video = card.querySelector('video')
      const isVisible = card === bestCard && bestRatio > 0.3
      card.classList.toggle('is-visible', isVisible)
      if (video) {
        if (isVisible) {
          video.currentTime = 0
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visibilityMap.set(entry.target, entry.intersectionRatio)
      }
      updateVisibleCard()
    },
    {
      root: projectList,
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '0px',
    },
  )

  cards.forEach((card) => observer.observe(card))

  // Initial check (observer callback may be async)
  requestAnimationFrame(() => {
    cards.forEach((card) => {
      const listRect = projectList.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const overlap = Math.max(
        0,
        Math.min(cardRect.right, listRect.right) - Math.max(cardRect.left, listRect.left),
      )
      visibilityMap.set(card, overlap / cardRect.width)
    })
    updateVisibleCard()
  })
}

const cleanCurrentProject = () => {
  if (currentDispose) {
    currentDispose()
    currentDispose = null
  }
}

// load project
async function loadProject(key) {
  cleanCurrentProject()

  // update url without reloading the page
  window.history.pushState({}, '', `?project=${key}`)

  // hide menu, show canvas and back button
  menu.style.display = 'none'
  canvas.style.display = 'block'
  backButton.style.display = 'flex'

  // load project module dynamically
  const module = await projects[key].load()
  currentDispose = module.default(canvas)
}

// back to menu
function showMenu() {
  cleanCurrentProject()

  // update url without reloading the page
  window.history.pushState({}, '', window.location.pathname)

  // show menu, hide canvas and back button
  menu.style.display = 'flex'
  canvas.style.display = 'none'
  backButton.style.display = 'none'
}

// events
backButton.addEventListener('click', showMenu)

// handle back button of the browser
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search)
  const projectKey = urlParams.get('project')

  if (projectKey && projects[projectKey]) {
    loadProject(projectKey)
  } else {
    showMenu()
  }
})

// initialize
buildMenu()

const urlParams = new URLSearchParams(window.location.search)
const projectKey = urlParams.get('project')

if (projectKey && projects[projectKey]) {
  loadProject(projectKey)
} else {
  // show menu
  menu.style.display = 'flex'
  canvas.style.display = 'none'
  backButton.style.display = 'none'
}
