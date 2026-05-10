import { onMounted, ref } from 'vue'

export type ColorMode = 'dark' | 'light'

const STORAGE_KEY = 'pietru-color-mode'

function resolveSystemColorMode(): ColorMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyColorMode(mode: ColorMode) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.colorMode = mode
  document.documentElement.dataset.theme = mode
}

function getInitialColorMode(): ColorMode {
  if (typeof document !== 'undefined') {
    const docMode = document.documentElement.dataset.colorMode
    if (docMode === 'dark' || docMode === 'light') return docMode
  }
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  }
  return resolveSystemColorMode()
}

export function useColorMode() {
  const colorMode = ref<ColorMode>(getInitialColorMode())

  const setColorMode = (mode: ColorMode) => {
    colorMode.value = mode
    applyColorMode(mode)
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  const toggleColorMode = () => {
    setColorMode(colorMode.value === 'dark' ? 'light' : 'dark')
  }

  applyColorMode(colorMode.value)
  onMounted(() => applyColorMode(colorMode.value))

  return { colorMode, setColorMode, toggleColorMode }
}
