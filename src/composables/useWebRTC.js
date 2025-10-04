import { ref } from 'vue'
import QRCode from 'qrcode'

export function useWebRTC() {
  const isHost = ref(false)
  const isClient = ref(false)
  const connectionId = ref('')
  const localConnection = ref(null)
  const remoteConnection = ref(null)
  const connectionStatus = ref('waiting')
  const connectionStep = ref(1)
  const phoneAnswer = ref('')
  const signalingData = ref('')
  const currentUrl = ref('')

  function generateConnectionId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  async function getLocalIpAddress() {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')

      return new Promise((resolve) => {
        pc.createOffer().then((offer) => pc.setLocalDescription(offer))

        pc.onicecandidate = (ice) => {
          if (ice?.candidate?.candidate) {
            const candidate = ice.candidate.candidate
            const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g)
            if (ipMatch && ipMatch[0] !== '127.0.0.1') {
              resolve(ipMatch[0])
              pc.close()
            }
          }
        }

        setTimeout(() => {
          resolve('192.168.1.100')
          pc.close()
        }, 3000)
      })
    } catch (error) {
      console.error('IP retrieval error:', error)
      return '192.168.1.100'
    }
  }

  function updateSignalingData() {
    if (localConnection.value) {
      signalingData.value = JSON.stringify({
        offer: localConnection.value.localDescription,
        connectionId: connectionId.value,
      })
    }
  }

  async function generateConnectionQR(qrCodeCanvas, isDevelopment) {
    let baseUrl

    if (isDevelopment) {
      const localIp = await getLocalIpAddress()
      const port = window.location.port || '3000'
      baseUrl = `https://${localIp}:${port}${window.location.pathname}`
    } else {
      baseUrl = window.location.origin + window.location.pathname
    }

    const connectionUrl = `${baseUrl}?mode=client&data=${encodeURIComponent(signalingData.value)}`
    currentUrl.value = connectionUrl

    if (qrCodeCanvas) {
      const ctx = qrCodeCanvas.getContext('2d')
      ctx.clearRect(0, 0, qrCodeCanvas.width, qrCodeCanvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, qrCodeCanvas.width, qrCodeCanvas.height)

      try {
        await QRCode.toCanvas(qrCodeCanvas, connectionUrl, {
          width: 200,
          height: 200,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        })
      } catch (error) {
        console.error('QR generation error:', error)
      }
    }
  }

  async function processPhoneAnswer() {
    if (!phoneAnswer.value.trim()) {
      alert('Please paste the answer from your phone')
      return
    }

    try {
      const answerData = JSON.parse(phoneAnswer.value)
      const answer = new RTCSessionDescription({
        type: answerData.type,
        sdp: answerData.sdp,
      })

      await localConnection.value.setRemoteDescription(answer)
      phoneAnswer.value = ''
      console.log('✅ Phone answer processed successfully')
    } catch (error) {
      console.error('❌ Error processing phone answer:', error)
      alert('Invalid answer format. Please try again.')
    }
  }

  function disconnectWebRTC() {
    if (localConnection.value) {
      localConnection.value.close()
      localConnection.value = null
    }

    if (remoteConnection.value) {
      remoteConnection.value.close()
      remoteConnection.value = null
    }

    isHost.value = false
    isClient.value = false
    connectionStatus.value = 'waiting'
    connectionStep.value = 1
  }

  return {
    isHost,
    isClient,
    connectionId,
    localConnection,
    remoteConnection,
    connectionStatus,
    connectionStep,
    phoneAnswer,
    currentUrl,
    generateConnectionId,
    updateSignalingData,
    generateConnectionQR,
    processPhoneAnswer,
    disconnectWebRTC,
  }
}
