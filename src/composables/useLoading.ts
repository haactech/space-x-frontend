import { ref } from 'vue'

const isLoading = ref(false)

export function useLoading() {
  const showLoading = () => {
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
  }

  const withLoading = async (callback: () => Promise<any>) => {
    try {
      showLoading()
      await callback()
    } finally {
      hideLoading()
    }
  }

  return {
    isLoading,
    showLoading,
    hideLoading,
    withLoading
  }
}