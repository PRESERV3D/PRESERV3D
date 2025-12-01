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
  let realtimeSubscription = null

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
        let checkInterval = null
        let timeoutId = null

        const cleanup = () => {
          if (checkInterval) clearInterval(checkInterval)
          if (timeoutId) clearTimeout(timeoutId)
          checkInterval = null
          timeoutId = null
        }

        checkInterval = setInterval(() => {
          if (iceGatheringComplete.value) {
            cleanup()
            resolve()
          }
        }, 100)

        timeoutId = setTimeout(() => {
          cleanup()
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
      baseUrl = window.location.origin
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

  async function checkForAnswer() {
    try {
      const { data, error } = await supabase
        .from('webrtc_signaling')
        .select('answer_data, status')
        .eq('connection_code', connectionCode.value)
        .single()

      if (error) return false

      if (data?.answer_data && data.status === 'answered') {
        console.log('✅ Phone answered detected')
        stopAnswerPolling()
        await processAnswerFromDatabase(data.answer_data)
        return true
      }
      return false
    } catch (err) {
      console.error('❌ Check error:', err)
      return false
    }
  }

  function startAnswerPolling() {
    // Immediate first check
    checkForAnswer()

    // Start realtime subscription for instant updates
    startRealtimeSubscription()

    // Fallback polling every 500ms
    answerPollingInterval = setInterval(checkForAnswer, 500)
  }

  function startRealtimeSubscription() {
    realtimeSubscription = supabase
      .channel(`webrtc:${connectionCode.value}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'webrtc_signaling',
          filter: `connection_code=eq.${connectionCode.value}`,
        },
        async (payload) => {
          console.log('🔄 Realtime update:', payload.new.status)
          if (payload.new.status === 'answered' && payload.new.answer_data) {
            console.log('✅ Phone connected (realtime)')
            stopAnswerPolling()
            await processAnswerFromDatabase(payload.new.answer_data)
          }
        },
      )
      .subscribe()
  }

  function stopAnswerPolling() {
    if (answerPollingInterval) {
      clearInterval(answerPollingInterval)
      answerPollingInterval = null
    }
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription)
      realtimeSubscription = null
    }
  }

  async function processAnswerFromDatabase(answerData) {
    try {
      console.log('📱 Processing answer from phone...')
      const answer = new RTCSessionDescription({
        type: answerData.type,
        sdp: answerData.sdp,
      })

      await localConnection.value.setRemoteDescription(answer)
      console.log('✅ Remote description set')

      // Update status to connected
      const { error: updateError } = await supabase
        .from('webrtc_signaling')
        .update({ status: 'connected' })
        .eq('connection_code', connectionCode.value)

      if (updateError) {
        console.error('❌ Failed to update status:', updateError)
      }

      connectionStatus.value = 'connected'
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

  async function checkExistingConnection() {
    try {
      const { data, error } = await supabase
        .from('webrtc_signaling')
        .select('connection_code, offer_data, answer_data, status')
        .in('status', ['waiting', 'answered', 'connected'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('❌ Error checking existing connection:', error)
        return null
      }

      if (data) {
        console.log('🔍 Found existing connection:', data.connection_code, 'Status:', data.status)
        return data
      }

      return null
    } catch (err) {
      console.error('❌ Error in checkExistingConnection:', err)
      return null
    }
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

    // Check for existing connection in database
    const existingConnection = await checkExistingConnection()
    if (existingConnection) {
      console.log('♻️ Found existing connection:', existingConnection.connection_code)

      // Only resume if it's still waiting (no answer yet)
      if (existingConnection.status === 'waiting') {
        console.log('♻️ Resuming waiting connection')
        connectionCode.value = existingConnection.connection_code
        connectionId.value = existingConnection.connection_code
        iceGatheringComplete.value = true
        offerData.value = { offer: existingConnection.offer_data }

        // Need to recreate peer connection with same offer
        isHost.value = true
        await recreateWaitingConnection(existingConnection, videoElement)
        return
      } else {
        // If already answered/connected, clean up old connection and create new one
        console.log('🗑️ Cleaning up old connection, creating new one')
        await supabase
          .from('webrtc_signaling')
          .delete()
          .eq('connection_code', existingConnection.connection_code)
      }
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
      console.log('🔗 Connection state:', localConnection.value.connectionState)
      if (localConnection.value.connectionState === 'failed') {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      } else if (localConnection.value.connectionState === 'disconnected') {
        connectionStatus.value = 'disconnected'
      } else if (localConnection.value.connectionState === 'connected') {
        connectionStatus.value = 'connected'
      }
    }

    localConnection.value.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', localConnection.value.iceConnectionState)
      if (
        localConnection.value.iceConnectionState === 'disconnected' ||
        localConnection.value.iceConnectionState === 'failed'
      ) {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      } else if (localConnection.value.iceConnectionState === 'connected') {
        console.log('✅ ICE connected')
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

  async function recreateWaitingConnection(existingData, videoElement = null) {
    localConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

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
      console.log('🔗 Connection state:', localConnection.value.connectionState)
      if (localConnection.value.connectionState === 'failed') {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      } else if (localConnection.value.connectionState === 'disconnected') {
        connectionStatus.value = 'disconnected'
      } else if (localConnection.value.connectionState === 'connected') {
        connectionStatus.value = 'connected'
      }
    }

    localConnection.value.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', localConnection.value.iceConnectionState)
      if (
        localConnection.value.iceConnectionState === 'disconnected' ||
        localConnection.value.iceConnectionState === 'failed'
      ) {
        connectionStatus.value = 'failed'
        stopAnswerPolling()
      } else if (localConnection.value.iceConnectionState === 'connected') {
        console.log('✅ ICE connected')
      }
    }

    dataChannel.value = localConnection.value.createDataChannel('cameraControl')

    // Set the existing offer as local description
    try {
      await localConnection.value.setLocalDescription(
        new RTCSessionDescription(existingData.offer_data),
      )

      // Start polling for answer
      startAnswerPolling()
    } catch (error) {
      console.error('❌ Error setting local description from existing offer:', error)
      // If it fails, clean up and let the main flow create a new connection
      await supabase
        .from('webrtc_signaling')
        .delete()
        .eq('connection_code', existingData.connection_code)
      throw error
    }
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

      console.log('✅ Offer stored, starting monitoring...')
      // Start monitoring immediately
      startAnswerPolling()
    } catch (error) {
      console.error('❌ Error storing offer:', error)
      connectionStatus.value = 'failed'
    }
  }

  async function initializeClientConnection(connectionCodeFromUrl) {
    isClient.value = true
    connectionStatus.value = 'waiting'

    const { data: signalingData, error: fetchError } = await supabase
      .from('webrtc_signaling')
      .select('offer_data')
      .eq('connection_code', connectionCodeFromUrl)
      .single()

    if (fetchError || !signalingData?.offer_data) {
      connectionStatus.value = 'failed'
      throw new Error('Connection code not found or expired')
    }

    remoteConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    // Monitor connection state changes on client side
    remoteConnection.value.onconnectionstatechange = () => {
      console.log('📱 Connection state:', remoteConnection.value.connectionState)
      if (remoteConnection.value.connectionState === 'connected') {
        connectionStatus.value = 'connected'
        console.log('✅ Fully connected to laptop')
      } else if (remoteConnection.value.connectionState === 'failed') {
        connectionStatus.value = 'failed'
      } else if (remoteConnection.value.connectionState === 'disconnected') {
        connectionStatus.value = 'disconnected'
      }
    }

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
      connectionStatus.value = 'failed'
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

    connectionStatus.value = 'answered'
    console.log('📤 Answer sent to laptop, waiting for confirmation...')

    return answerData
  }

  function sendControlMessage(message) {
    if (dataChannel.value?.readyState === 'open') {
      dataChannel.value.send(JSON.stringify(message))
    }
  }

  function disconnectWebRTC() {
    console.log('🔌 Disconnecting WebRTC...')
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
      remoteStream.value.getTracks().forEach((track) => {
        track.stop()
        track.enabled = false
      })
      remoteStream.value = null
    }

    if (connectionCode.value) {
      supabase.from('webrtc_signaling').delete().eq('connection_code', connectionCode.value)
      connectionCode.value = ''
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
    checkExistingConnection,
  }
}
