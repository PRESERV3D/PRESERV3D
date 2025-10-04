import { ref } from 'vue'

export function useCamera() {
  const video = ref(null)
  const showPermissionDialog = ref(false)
  const permissionDialogType = ref('denied')

  async function requestCameraPermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' })

      if (permission.state === 'denied') {
        showPermissionDialog.value = true
        permissionDialogType.value = 'denied'
        return false
      }

      if (permission.state === 'prompt' || permission.state === 'granted') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((track) => track.stop())
        return true
      }
    } catch (error) {
      console.error('Camera permission error:', error)

      if (error.name === 'NotAllowedError') {
        permissionDialogType.value = 'denied'
      } else if (error.name === 'NotFoundError') {
        permissionDialogType.value = 'notfound'
      } else if (error.name === 'NotSupportedError') {
        permissionDialogType.value = 'notsupported'
      } else {
        permissionDialogType.value = 'error'
      }

      showPermissionDialog.value = true
      return false
    }
  }

  async function openCamera() {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      video.value.srcObject = stream
      video.value.style.display = 'block'
      video.value.play()
      return stream
    } catch (error) {
      console.error('Camera access error:', error)
      throw error
    }
  }

  function stopCamera() {
    if (video.value?.srcObject) {
      const stream = video.value.srcObject
      stream.getTracks().forEach((track) => track.stop())
      video.value.srcObject = null
    }
  }

  return {
    video,
    showPermissionDialog,
    permissionDialogType,
    openCamera,
    stopCamera,
    requestCameraPermission,
  }
}
