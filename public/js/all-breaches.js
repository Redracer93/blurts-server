import { sendPing } from './fxa-analytics.js'
import { replaceLogo } from './monitor.js'

const makeBreachInfoSpans = (className, spanContent, wrapper) => {
  const span = document.createElement('span')
  span.classList = className
  span.textContent = spanContent
  wrapper.appendChild(span)
  return span
}

function makeDiv (className, wrapper) {
  const div = document.createElement('div')
  div.classList = className
  wrapper.appendChild(div)
  return div
}

function clearBreaches (wrapper) {
  while (wrapper.firstChild) {
    wrapper.removeChild(wrapper.firstChild)
  }
}

function makeBreaches (breaches, LocalizedBreachCardStrings, breachCardWrapper) {
  breachCardWrapper.classList.toggle('hide-breaches')
  clearBreaches(breachCardWrapper)

  const fragment = document.createDocumentFragment()
  fragment.id = 'all-breaches'

  const logosOrigin = document.body.dataset.logosOrigin

  for (const breach of breaches) {
    const card = document.createElement('a')

    card.classList = 'breach-card three-up ab drop-shadow send-ga-ping'
    card.href = `/breach-details/${breach.Name}`
    card.dataset.eventCategory = 'All Breaches: More about this breach'
    card.dataset.eventAction = 'Click'
    card.dataset.eventLabel = breach.Title
    fragment.appendChild(card)

    const logoWrapper = makeDiv('breach-logo-wrapper', card)

    const breachLogo = document.createElement('img')
    breachLogo.addEventListener('error', replaceLogo)
    breachLogo.alt = `${breach.Title} logo`
    breachLogo.classList = 'breach-logo'
    breachLogo.loading = 'lazy'
    breachLogo.src = `${logosOrigin}/img/logos/${breach.LogoPath}`
    logoWrapper.appendChild(breachLogo)

    // make wrapper for the breach-info and link
    const breachInfoWrapper = makeDiv('breach-info-wrapper flx flx-col', card)

    // make wrapper for the Added Date, Compromised Accounts etc info...
    let wrapper = makeDiv('flx flx-col', breachInfoWrapper)
    makeBreachInfoSpans('breach-title', breach.Title, wrapper)

    // added date
    makeBreachInfoSpans('breach-key', LocalizedBreachCardStrings.BreachAdded, wrapper)
    makeBreachInfoSpans('breach-value', breach.AddedDate, wrapper)

    // compromised data
    makeBreachInfoSpans('breach-key', LocalizedBreachCardStrings.CompromisedData, wrapper)
    makeBreachInfoSpans('breach-value', breach.DataClasses, wrapper)

    // add link at bottom of card
    wrapper = makeDiv('breach-card-link-wrap', breachInfoWrapper)
    makeBreachInfoSpans('blue-link more-about-this-breach', LocalizedBreachCardStrings.MoreInfoLink, wrapper)
  }

  breachCardWrapper.appendChild(fragment)
  breachCardWrapper.classList.toggle('hide-breaches')
  const loader = document.getElementById('breaches-loader')

  loader.classList = ['hide']
  return breaches
}

function initBreaches () {
  const breachCardWrapper = document.querySelector('#all-breaches')
  if (breachCardWrapper) {
    const breachWrapper = document.getElementById('breach-array-json')
    const { LocalizedBreachCardStrings, breaches } = JSON.parse(breachWrapper.dataset.breachArray)

    const doBreaches = (arr) => {
      makeBreaches(arr, LocalizedBreachCardStrings, breachCardWrapper)
    }

    const firstFifteen = breaches.slice(0, 15)
    doBreaches(firstFifteen)

    const noResultsBlurb = document.getElementById('no-results-blurb')

    const fuzzyFindInput = document.getElementById('fuzzy-find-input')
    const fuzzyFinder = document.getElementById('fuzzy-form')

    const [fuzzyShowAll, showHiddenBreaches] = document.querySelectorAll('.show-all-breaches')

    showHiddenBreaches.addEventListener('click', (e) => {
      sendPing(e.target, 'Click', 'All Breaches Page')
      doBreaches(breaches)
      showHiddenBreaches.classList.add('hide')
    })

    fuzzyShowAll.addEventListener('click', (e) => {
      e.preventDefault()
      fuzzyFindInput.value = ''
      doBreaches(breaches)
      noResultsBlurb.classList = ['']
      fuzzyShowAll.classList = ['fuzzy-find-show-breaches']
    })

    const searchBreaches = (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()

      // hide purple "Show All" button
      // show button to clear fuzzy input
      showHiddenBreaches.classList = ['hide']
      fuzzyShowAll.classList = ['fuzzy-find-show-breaches show']

      const breachSearchTerm = fuzzyFindInput.value.toLowerCase()

      // filter breach array by search term
      const filteredBreachArray = breaches.filter(breach => {
        return breach.Title.toLowerCase().startsWith(breachSearchTerm)
      })

      // if hitting enter off a zero results search, restore breaches
      // and clear out input
      if (e.keyCode === 13 && noResultsBlurb.classList.contains('show')) {
        doBreaches(breaches)
        noResultsBlurb.classList.remove('show')
        fuzzyShowAll.classList.remove('show')
        fuzzyFindInput.value = ''
        return false
      }

      // if no results, show "no results message"
      // otherwise make sure it isn't showing
      if (filteredBreachArray.length === 0) {
        noResultsBlurb.classList.add('show')
      } else {
        noResultsBlurb.classList = ['']
      }
      doBreaches(filteredBreachArray)
      return false
    }
    fuzzyFinder.addEventListener('keydown', () => {
      const finderInput = fuzzyFinder.querySelector('input[type=text]')
      if (finderInput.value === '') {
        sendPing(fuzzyFinder, 'Engage', 'All Breaches Page')
      }
    })
    fuzzyFinder.addEventListener('keyup', searchBreaches)
    fuzzyFinder.addEventListener('submit', searchBreaches)
  }
}

document.onreadystatechange = () => {
  if (document.readyState === 'interactive') {
    initBreaches()
  }
}
initBreaches()
