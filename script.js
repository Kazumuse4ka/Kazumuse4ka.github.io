const menuToggle = document.querySelector('#menu-toggle')
const nav = document.querySelector('#main-nav')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pageIntro = document.querySelector('.page-intro')

window.setTimeout(() => {
  pageIntro.classList.add('is-leaving')
  document.body.classList.remove('intro-active')

  window.setTimeout(() => pageIntro.remove(), reduceMotion ? 0 : 900)
}, reduceMotion ? 0 : 1300)

const closeMenu = () => {
  nav.classList.remove('open')
  menuToggle.classList.remove('open')
  menuToggle.setAttribute('aria-expanded', 'false')
  document.body.classList.remove('menu-open')
}

menuToggle.addEventListener('click', () => {
  const willOpen = !nav.classList.contains('open')
  nav.classList.toggle('open', willOpen)
  menuToggle.classList.toggle('open', willOpen)
  menuToggle.setAttribute('aria-expanded', String(willOpen))
  document.body.classList.toggle('menu-open', willOpen)
})

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))

document.querySelectorAll('[data-delay]').forEach((element) => {
  element.style.setProperty('--delay', `${element.dataset.delay}ms`)
})

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.13 }
)

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element))

const sections = [...document.querySelectorAll('main section[id]')]
const navLinks = [...nav.querySelectorAll('a')]

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const current = entries.find((entry) => entry.isIntersecting)
    if (!current) return

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.target.id}`)
    })
  },
  { rootMargin: '-35% 0px -55% 0px' }
)

sections.forEach((section) => sectionObserver.observe(section))

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const status = button.querySelector('.copy-status')

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(button.dataset.copy)
      } else {
        const field = document.createElement('textarea')
        field.value = button.dataset.copy
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.append(field)
        field.select()
        document.execCommand('copy')
        field.remove()
      }
      status.textContent = 'Скопировано'
    } catch {
      status.textContent = button.dataset.copy
    }

    window.setTimeout(() => {
      status.textContent = 'Копировать'
    }, 1800)
  })
})

const profileCard = document.querySelector('.profile-card')
const heroVisual = document.querySelector('.hero-visual')

if (!reduceMotion) {
  heroVisual.addEventListener('pointermove', (event) => {
    const bounds = heroVisual.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    profileCard.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotateZ(3deg)`
  })

  heroVisual.addEventListener('pointerleave', () => {
    profileCard.style.transform = 'rotate(3deg)'
  })
}

const canvas = document.querySelector('#aurora')
const context = canvas.getContext('2d')
let width = 0
let height = 0
let frame = 0

const resizeCanvas = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
}

const drawBand = (offset, amplitude, thickness, color, speed) => {
  context.beginPath()
  for (let x = -60; x <= width + 60; x += 24) {
    const normalized = x / width
    const y = height * offset + Math.sin(normalized * 5 + frame * speed) * amplitude + Math.sin(normalized * 11 - frame * speed * 0.55) * amplitude * 0.35
    if (x === -60) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.lineWidth = thickness
  context.strokeStyle = color
  context.shadowBlur = thickness * 1.8
  context.shadowColor = color
  context.stroke()
}

const drawAurora = () => {
  context.clearRect(0, 0, width, height)
  context.globalCompositeOperation = 'screen'
  drawBand(0.22, 90, 2, 'rgba(255, 255, 255, .16)', 0.012)
  drawBand(0.68, 120, 3, 'rgba(255, 255, 255, .10)', -0.009)
  drawBand(0.48, 65, 1.5, 'rgba(255, 255, 255, .07)', 0.007)
  context.globalCompositeOperation = 'source-over'
  frame += 1
  if (!reduceMotion) requestAnimationFrame(drawAurora)
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()
drawAurora()
