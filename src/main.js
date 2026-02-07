import './style.css'

const projects = {
  'haunted-house': {
    name: 'Haunted House',
    description: 'Une maison hantée avec fantômes, ombres et brouillard',
    image: './screen/haunted_house.png',
    load: () => import('./projects/haunted-house.js'),
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

  for (const [key, project] of Object.entries(projects)) {
    const card = document.createElement('a')
    card.href = `?project=${key}`
    card.className = 'project-card'
    card.addEventListener('click', (e) => {
      e.preventDefault()
      loadProject(key)
    })

    card.innerHTML = `
      ${project.image ? `<img src="${project.image}" alt="${project.name}" />` : ''}
      <div class="project-card-content">
        <h2>${project.name}</h2>
        <p>${project.description}</p>
      </div>
    `

    projectList.appendChild(card)
  }
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
