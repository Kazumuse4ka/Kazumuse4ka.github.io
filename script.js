const menuToggle = document.querySelector('#menu-toggle')
const nav = document.querySelector('#main-nav')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pageIntro = document.querySelector('.page-intro')
const languagePicker = document.querySelector('.language-picker')
const languageButton = document.querySelector('#language-toggle')
const languageMenu = document.querySelector('#language-menu')
const currentLanguageLabel = document.querySelector('#current-language')
const languageOptions = [...document.querySelectorAll('[data-language]')]
const translations = window.portfolioTranslations
const supportedLanguages = ['kk', 'ru', 'en']
const languageLabels = { kk: 'ҚАЗ', ru: 'РУС', en: 'ENG' }
const languageStorageKey = 'portfolio-language'
let currentLanguage = 'ru'

const translate = (key) => translations[currentLanguage]?.[key] ?? translations.ru[key] ?? key

const getStoredLanguage = () => {
  try {
    return localStorage.getItem(languageStorageKey)
  } catch {
    return null
  }
}

const getInitialLanguage = () => {
  const requestedLanguage = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
  if (supportedLanguages.includes(requestedLanguage)) return requestedLanguage

  const storedLanguage = getStoredLanguage()
  if (supportedLanguages.includes(storedLanguage)) return storedLanguage

  const browserLanguage = navigator.language.toLowerCase().split('-')[0]
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'ru'
}

const applyLanguage = (language, persist = true) => {
  currentLanguage = supportedLanguages.includes(language) ? language : 'ru'
  document.documentElement.lang = currentLanguage
  document.title = translate('meta.title')
  document.querySelector('meta[name="description"]').content = translate('meta.description')
  currentLanguageLabel.textContent = languageLabels[currentLanguage]
  languageOptions.forEach((option) => {
    if (option.dataset.language === currentLanguage) option.setAttribute('aria-current', 'true')
    else option.removeAttribute('aria-current')
  })

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translate(element.dataset.i18n)
  })

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel))
  })

  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.setAttribute('alt', translate(element.dataset.i18nAlt))
  })

  const menuIsOpen = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-label', translate(menuIsOpen ? 'aria.closeMenu' : 'aria.openMenu'))

  if (persist) {
    try {
      localStorage.setItem(languageStorageKey, currentLanguage)
    } catch {
      // The page still works if storage is unavailable.
    }
  }
}

applyLanguage(getInitialLanguage(), false)

const introSeen = (() => {
  try {
    const wasSeen = sessionStorage.getItem('portfolio-intro-seen') === 'true'
    sessionStorage.setItem('portfolio-intro-seen', 'true')
    return wasSeen
  } catch {
    return false
  }
})()

if (pageIntro) {
  if (reduceMotion || introSeen) {
    document.body.classList.remove('intro-active')
    pageIntro.remove()
  } else {
    window.setTimeout(() => {
      pageIntro.classList.add('is-leaving')
      document.body.classList.remove('intro-active')
      window.setTimeout(() => pageIntro.remove(), 550)
    }, 650)
  }
}

const closeMenu = () => {
  nav.classList.remove('open')
  menuToggle.classList.remove('open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', translate('aria.openMenu'))
  document.body.classList.remove('menu-open')
}

const closeLanguageMenu = () => {
  languageMenu.hidden = true
  languageButton.setAttribute('aria-expanded', 'false')
}

languageButton.addEventListener('click', () => {
  const willOpen = languageMenu.hidden
  if (willOpen) closeMenu()
  languageMenu.hidden = !willOpen
  languageButton.setAttribute('aria-expanded', String(willOpen))
  if (willOpen) languageMenu.querySelector('[aria-current="true"]')?.focus()
})

languageOptions.forEach((option) => {
  option.addEventListener('click', () => {
    applyLanguage(option.dataset.language)
    closeLanguageMenu()
    languageButton.focus()
  })
})

document.addEventListener('click', (event) => {
  if (!languagePicker.contains(event.target)) closeLanguageMenu()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !languageMenu.hidden) {
    closeLanguageMenu()
    languageButton.focus()
  }
})

menuToggle.addEventListener('click', () => {
  const willOpen = !nav.classList.contains('open')
  closeLanguageMenu()
  nav.classList.toggle('open', willOpen)
  menuToggle.classList.toggle('open', willOpen)
  menuToggle.setAttribute('aria-expanded', String(willOpen))
  menuToggle.setAttribute('aria-label', translate(willOpen ? 'aria.closeMenu' : 'aria.openMenu'))
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
      status.textContent = translate('contacts.copied')
    } catch {
      status.textContent = button.dataset.copy
    }

    window.setTimeout(() => {
      status.textContent = translate('contacts.copy')
    }, 1800)
  })
})

const profileCard = document.querySelector('.profile-card')
const heroVisual = document.querySelector('.hero-visual')
const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

if (!reduceMotion && precisePointer) {
  let tiltFrame = 0

  heroVisual.addEventListener('pointermove', (event) => {
    if (tiltFrame) return

    tiltFrame = requestAnimationFrame(() => {
      const bounds = heroVisual.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5
      profileCard.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotateZ(3deg)`
      tiltFrame = 0
    })
  })

  heroVisual.addEventListener('pointerleave', () => {
    cancelAnimationFrame(tiltFrame)
    tiltFrame = 0
    profileCard.style.transform = 'rotate(3deg)'
  })
}

const canvas = document.querySelector('#aurora')
const context = canvas.getContext('2d', { alpha: true, desynchronized: true })
const mobileViewport = window.matchMedia('(max-width: 700px)')
const hasEnoughCores = (navigator.hardwareConcurrency ?? 4) > 2
let width = 0
let height = 0
let phase = 0
let animationFrame = 0
let resizeFrame = 0
let lastFrameTime = 0
let canvasIsVisible = true

const resizeCanvas = () => {
  const ratio = mobileViewport.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.25)
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
  const step = mobileViewport.matches ? 40 : 30
  for (let x = -60; x <= width + 60; x += step) {
    const normalized = x / width
    const y = height * offset + Math.sin(normalized * 5 + phase * speed) * amplitude + Math.sin(normalized * 11 - phase * speed * 0.55) * amplitude * 0.35
    if (x === -60) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.lineWidth = thickness
  context.strokeStyle = color
  context.stroke()
}

const shouldAnimateCanvas = () =>
  !reduceMotion && !mobileViewport.matches && hasEnoughCores && canvasIsVisible && !document.hidden

const scheduleCanvas = () => {
  if (animationFrame || !shouldAnimateCanvas()) return
  animationFrame = requestAnimationFrame(drawAurora)
}

const drawAurora = (time = 0) => {
  animationFrame = 0
  if (time && time - lastFrameTime < 33) {
    scheduleCanvas()
    return
  }

  lastFrameTime = time
  context.clearRect(0, 0, width, height)
  context.globalCompositeOperation = 'screen'
  drawBand(0.22, 90, 2, 'rgba(255, 255, 255, .16)', 0.012)
  drawBand(0.68, 120, 3, 'rgba(255, 255, 255, .10)', -0.009)
  drawBand(0.48, 65, 1.5, 'rgba(255, 255, 255, .07)', 0.007)
  context.globalCompositeOperation = 'source-over'
  phase += 1
  scheduleCanvas()
}

const canvasObserver = new IntersectionObserver(([entry]) => {
  canvasIsVisible = entry.isIntersecting
  scheduleCanvas()
})

canvasObserver.observe(document.querySelector('.hero'))

document.addEventListener('visibilitychange', scheduleCanvas)
window.addEventListener(
  'resize',
  () => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      cancelAnimationFrame(animationFrame)
      animationFrame = 0
      resizeCanvas()
      drawAurora(performance.now())
    })
  },
  { passive: true }
)

resizeCanvas()
drawAurora()
