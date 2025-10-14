import { ref } from 'vue'
import QRCode from 'qrcode'
import { supabase } from 'boot/supabase'

export function useWebRTC() {
  const isHost = ref(false)
  const isClient = ref(false)
  const connectionId = ref('')
  const localConnection = ref(null)
  const remoteConnection = ref(null)
  const dataChannel = ref(null)
  const connectionStatus = ref('waiting')
  const connectionStep = ref(1)
  const phoneAnswer = ref('')
  const signalingData = ref('')
  const currentUrl = ref('')
  const remoteStream = ref(null)
  const connectionCode = ref('')
  const offerData = ref(null)
  const iceGatheringComplete = ref(false)

  let answerPollingInterval = null

  function generateConnectionId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase()
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
    if (!iceGatheringComplete.value) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (iceGatheringComplete.value) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)

        setTimeout(() => {
          clearInterval(checkInterval)
          resolve()
        }, 10000)
      })
    }

    let baseUrl

    if (isDevelopment) {
      const localIp = await getLocalIpAddress()
      const port = window.location.port || '9000'
      const protocol = window.location.protocol
      baseUrl = `${protocol}//${localIp}:${port}`
    } else {
      baseUrl = process.env.FRONTEND_URL
    }

    const connectionUrl = `${baseUrl}/phone-camera?code=${connectionCode.value}`
    currentUrl.value = connectionUrl

    if (qrCodeCanvas) {
      const ctx = qrCodeCanvas.getContext('2d')
      ctx.clearRect(0, 0, qrCodeCanvas.width, qrCodeCanvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, qrCodeCanvas.width, qrCodeCanvas.height)

      try {
        await QRCode.toCanvas(qrCodeCanvas, connectionUrl, {
          width: 300,
          height: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        })
        console.log('✅ QR Code generated')
      } catch (error) {
        console.error('❌ QR generation error:', error)
      }
    }
  }

  function startAnswerPolling() {
    answerPollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('webrtc_signaling')
          .select('answer_data, status')
          .eq('connection_code', connectionCode.value)
          .single()

        if (error) return

        if (data?.answer_data && data.status === 'answered') {
          console.log('✅ Phone connected')
          stopAnswerPolling()
          await processAnswerFromDatabase(data.answer_data)
        }
      } catch (err) {
        console.error('❌ Polling error:', err)
      }
    }, 2000)
  }

  function stopAnswerPolling() {
    if (answerPollingInterval) {
      clearInterval(answerPollingInterval)
      answerPollingInterval = null
    }
  }

  async function processAnswerFromDatabase(answerData) {
    try {
      const answer = new RTCSessionDescription({
        type: answerData.type,
        sdp: answerData.sdp,
      })

      await localConnection.value.setRemoteDescription(answer)

      await supabase
        .from('webrtc_signaling')
        .update({ status: 'connected' })
        .eq('connection_code', connectionCode.value)
    } catch (error) {
      console.error('❌ Error processing answer:', error)
      connectionStatus.value = 'failed'
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
    } catch (error) {
      console.error('❌ Error processing answer:', error)
      alert('Invalid answer format. Please try again.')
    }
  }

  function isConnectionActive() {
    return (
      localConnection.value &&
      localConnection.value.connectionState === 'connected' &&
      remoteStream.value
    )
  }

  function resumeExistingConnection(videoElement) {
    if (videoElement && remoteStream.value) {
      videoElement.srcObject = remoteStream.value
      videoElement.style.display = 'block'
      videoElement.muted = true
      videoElement.play().catch((err) => console.error('❌ Error resuming video:', err))

      connectionStatus.value = 'connected'
      return true
    }
    return false
  }

  async function initializeHostConnection(videoElement = null) {
    if (isConnectionActive()) {
      return resumeExistingConnection(videoElement)
    }

    isHost.value = true
    connectionId.value = generateConnectionId()
    connectionCode.value = generateConnectionId()
    iceGatheringComplete.value = false

    localConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    localConnection.value.onicegatheringstatechange = () => {
      if (localConnection.value.iceGatheringState === 'complete') {
        iceGatheringComplete.value = true
        offerData.value = {
          offer: localConnection.value.localDescription,
          connectionId: connectionId.value,
        }
        updateSignalingData()
        storeOfferInDatabase()
      }
    }

    localConnection.value.ontrack = (event) => {
      remoteStream.value = event.streams[0]

      if (videoElement) {
        videoElement.srcObject = remoteStream.value
        videoElement.style.display = 'block'

        videoElement.play().catch((err) => {
          console.error('❌ Error playing video:', err)
          videoElement.muted = true
          videoElement.play()
        })
      }

      connectionStatus.value = 'connected'
      stopAnswerPolling()
    }

    localConnection.value.onconnectionstatechange = () => {
      if (localConnection.value.connectionState === 'failed') {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      } else if (localConnection.value.connectionState === 'disconnected') {
        connectionStatus.value = 'disconnected'
      }
    }

    localConnection.value.oniceconnectionstatechange = () => {
      if (
        localConnection.value.iceConnectionState === 'disconnected' ||
        localConnection.value.iceConnectionState === 'failed'
      ) {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      }
    }

    dataChannel.value = localConnection.value.createDataChannel('cameraControl')

    localConnection.value.onicecandidate = (event) => {
      if (!event.candidate && !iceGatheringComplete.value) {
        iceGatheringComplete.value = true
        offerData.value = {
          offer: localConnection.value.localDescription,
          connectionId: connectionId.value,
        }
        updateSignalingData()
        storeOfferInDatabase()
      }
    }

    const offer = await localConnection.value.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false,
    })
    await localConnection.value.setLocalDescription(offer)

    offerData.value = {
      offer: localConnection.value.localDescription,
      connectionId: connectionId.value,
    }
    updateSignalingData()

    connectionStep.value = 2
  }

  async function storeOfferInDatabase() {
    try {
      const { error } = await supabase.from('webrtc_signaling').upsert(
        {
          connection_code: connectionCode.value,
          offer_data: offerData.value.offer,
          status: 'waiting',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        {
          onConflict: 'connection_code',
        },
      )

      if (error) throw error

      startAnswerPolling()
    } catch (error) {
      console.error('❌ Error storing offer:', error)
    }
  }

  async function initializeClientConnection(connectionCodeFromUrl) {
    isClient.value = true

    const { data: signalingData, error: fetchError } = await supabase
      .from('webrtc_signaling')
      .select('offer_data')
      .eq('connection_code', connectionCodeFromUrl)
      .single()

    if (fetchError || !signalingData?.offer_data) {
      throw new Error('Connection code not found or expired')
    }

    remoteConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      })

      stream.getTracks().forEach((track) => {
        remoteConnection.value.addTrack(track, stream)
      })
    } catch (error) {
      console.error('❌ Camera access error:', error)
      throw new Error('Camera access denied')
    }

    remoteConnection.value.ondatachannel = (event) => {
      dataChannel.value = event.channel
    }

    await remoteConnection.value.setRemoteDescription(
      new RTCSessionDescription(signalingData.offer_data),
    )

    const answer = await remoteConnection.value.createAnswer()
    await remoteConnection.value.setLocalDescription(answer)

    await new Promise((resolve) => {
      if (remoteConnection.value.iceGatheringState === 'complete') {
        resolve()
      } else {
        remoteConnection.value.onicegatheringstatechange = () => {
          if (remoteConnection.value.iceGatheringState === 'complete') {
            resolve()
          }
        }
        setTimeout(resolve, 5000)
      }
    })

    const answerData = {
      type: remoteConnection.value.localDescription.type,
      sdp: remoteConnection.value.localDescription.sdp,
    }

    await supabase
      .from('webrtc_signaling')
      .update({
        answer_data: answerData,
        status: 'answered',
      })
      .eq('connection_code', connectionCodeFromUrl)

    connectionStatus.value = 'connected'
    console.log('✅ Connected to laptop')

    return answerData
  }

  function sendControlMessage(message) {
    if (dataChannel.value?.readyState === 'open') {
      dataChannel.value.send(JSON.stringify(message))
    }
  }

  function disconnectWebRTC() {
    stopAnswerPolling()

    if (localConnection.value) {
      localConnection.value.close()
      localConnection.value = null
    }

    if (remoteConnection.value) {
      remoteConnection.value.close()
      remoteConnection.value = null
    }

    if (dataChannel.value) {
      dataChannel.value.close()
      dataChannel.value = null
    }

    if (remoteStream.value) {
      remoteStream.value.getTracks().forEach((track) => track.stop())
      remoteStream.value = null
    }

    if (connectionCode.value) {
      supabase.from('webrtc_signaling').delete().eq('connection_code', connectionCode.value)
    }

    isHost.value = false
    isClient.value = false
    connectionStatus.value = 'waiting'
    connectionStep.value = 1
    offerData.value = null
    iceGatheringComplete.value = false
  }

  return {
    isHost,
    isClient,
    connectionId,
    connectionCode,
    localConnection,
    remoteConnection,
    dataChannel,
    connectionStatus,
    connectionStep,
    phoneAnswer,
    currentUrl,
    remoteStream,
    offerData,
    iceGatheringComplete,
    generateConnectionId,
    updateSignalingData,
    generateConnectionQR,
    processPhoneAnswer,
    initializeHostConnection,
    initializeClientConnection,
    sendControlMessage,
    disconnectWebRTC,
    isConnectionActive,
    resumeExistingConnection,
  }
}
