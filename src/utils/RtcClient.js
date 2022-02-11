import FirebaseSignallingClient from "./FirebaseSignalingClient"

const INITIAL_AUDIO_ENABLED = false

export default class RtcClient {
    constructor(remoteVideoRef, setRtcClient) {
        const config = {
            iceServers: [{ urls: 'stun:stun.stunprotocol.org'}]
        }
        this.rtcPeerConnection = new RTCPeerConnection(config)
        this.firebaseSignallingClient = new FirebaseSignallingClient()
        this.localPeerName = ''
        this.remotePeerName = ''
        this.remoteVideoRef = remoteVideoRef
        this._setRtcClient = setRtcClient
        this.mediaStream = null
    }

    get initialAudioMuted() {
        return !INITIAL_AUDIO_ENABLED
    }

    setRtcClient() {
        this._setRtcClient(this)
    }

    async getUserMedia() {
        try {
            const constraints = { audio: true, video: true }
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch (error) {
            console.error(error)
        }
    }

    async setMediaStream() {
        await this.getUserMedia()
        this.addTracks()
        this.setRtcClient()
    }

    addTracks() {
        this.addAudioTrack()
        this.addVideoTrack()
    }

    addAudioTrack() {
        this.audioTrack.enabled = INITIAL_AUDIO_ENABLED
        this.rtcPeerConnection.addTrack(this.audioTrack, this.mediaStream)
    }

    addVideoTrack() {
        this.rtcPeerConnection.addTrack(this.videoTrack, this.mediaStream)
    }

    get audioTrack() {
        return this.mediaStream.getAudioTracks()[0]
    }

    get videoTrack() {
        return this.mediaStream.getVideoTracks()[0]
    }

    toggleAudio() {
        this.audioTrack.enabled = !this.audioTrack.enabled
        this.setRtcClient()
    }

    async offer() {
        const sessionDescription = await this.createOffer()
        await this.setLocalDescription(sessionDescription)
        await this.sendOffer()
    }

    async createOffer() {
        try {
            return await this.rtcPeerConnection.createOffer()
        } catch (error) {
            console.error(error)
        }
    }

    async setLocalDescription(sessionDescription) {
        try {
            await this.rtcPeerConnection.setLocalDescription(sessionDescription)
        } catch (error) {
            console.error(error)
        }
    }

    async sendOffer() {
        this.firebaseSignallingClient.setPeerNames(
            this.localPeerName,
            this.remotePeerName
        )
        await this.firebaseSignallingClient.sendOffer(this.localDescription)
    }

    setOntrack() {
        this.rtcPeerConnection.ontrack = (rtcTrackEvent) => {
            if (rtcTrackEvent.track.kind !== 'video') return
            const remoteMediaStream = rtcTrackEvent.streams[0];
            this.remoteVideoRef.current.srcObject = remoteMediaStream
            this.setRtcClient()
        }
        this.setRtcClient()
    }

    async answer(sender, sessionDescription) {
        try {
            this.remotePeerName = sender
            this.setOnicecandidateCallback()
            this.setOntrack()
            await this.setRemoteDescription(sessionDescription)
            const answer = await this.rtcPeerConnection.createAnswer()
            await this.rtcPeerConnection.setLocalDescription(answer)
            this.sendAnswer()
        } catch (error) {
            console.error(error)
        }
    }

    async connect(remotePeerName) {
        this.remotePeerName = remotePeerName
        this.setOnicecandidateCallback()
        this.setOntrack()
        await this.offer()
        this.setRtcClient()
    }

    async setRemoteDescription(sessionDescription) {
        await this.rtcPeerConnection.setRemoteDescription(sessionDescription)
    }

    sendAnswer() {
        this.firebaseSignallingClient.setPeerNames(
            this.localPeerName,
            this.remotePeerName
        )
        this.firebaseSignallingClient.sendAnswer(this.localDescription)
    }

    async saveReceivedSessionDescription(sessionDescription) {
        try {
            await this.setRemoteDescription(sessionDescription)
        } catch (error) {
            console.error(error)
        }
    }

    get localDescription() {
        return this.rtcPeerConnection.localDescription.toJSON()
    }

    async addIceCandidate(candidate) {
        try {
            const iceCandidate = new RTCIceCandidate(candidate)
            await this.rtcPeerConnection.addIceCandidate(iceCandidate)
        } catch (error) {
            console.error(error)
        }
    }

    setOnicecandidateCallback() {
        this.rtcPeerConnection.onicecandidate = async ({candidate}) => {
            if (candidate) {
                await this.firebaseSignallingClient.sendCandidate(candidate.toJSON())
            }
        }
    }


    async startListening(localPeerName) {
        this.localPeerName  = localPeerName
        this.setRtcClient()
        await this.firebaseSignallingClient.remove(localPeerName);
        this.firebaseSignallingClient.database
            .ref(localPeerName)
            .on('value', async (snapshot) => {
                const data = snapshot.val()
                if (data === null) return

                const { candidate, sender, sessionDescription, type } = data
                switch(type) {
                    case 'offer':
                        await this.answer(sender, sessionDescription)
                        break
                    case 'answer':
                        await this.saveReceivedSessionDescription(sessionDescription)
                        break
                    case 'candidate':
                        await this.addIceCandidate(candidate)
                        break
                    default:
                        this.setRtcClient()
                        break
                }

            })
    }
}
