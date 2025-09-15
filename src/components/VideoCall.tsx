import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, Member } from '../lib/supabase';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, X, EyeOff, Eye, UserPlus, Copy, Check, Link, Share2, Calendar, Plus } from 'lucide-react';

interface CallState {
  isInCall: boolean;
  isGroupCall: boolean;
  callId: string | null;
  participants: Map<string, {
    member: Member;
    stream: MediaStream | null;
    peerConnection: RTCPeerConnection | null;
  }>;
  localStream: MediaStream | null;
}

interface MeetingRoom {
  id: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  participants: string[];
}

export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isGroupCall: false,
    callId: null,
    participants: new Map(),
    localStream: null,
  });
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraHidden, setCameraHidden] = useState(false);
  const [showGroupCallModal, setShowGroupCallModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [callIdCopied, setCallIdCopied] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLinkCopied, setMeetingLinkCopied] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [incomingCall, setIncomingCall] = useState<{
    from: Member;
    callId: string;
    isGroup: boolean;
  } | null>(null);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | 'disconnected'>('disconnected');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const signalingChannel = useRef<any>(null);

  // WebRTC configuration with STUN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    fetchMembers();
    setupSignaling();
    
    // Check URL for meeting parameter
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    console.log('🔍 Checking URL for meeting ID:', meetingId);
    
    if (meetingId && user) {
      console.log('📞 Auto-joining meeting:', meetingId);
      joinMeetingFromLink(meetingId);
    }
    
    return () => {
      cleanup();
    };
  }, [user?.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .neq('id', user?.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const setupSignaling = () => {
    console.log('🔧 Setting up signaling channel...');
    
    // Create signaling channel
    signalingChannel.current = supabase
      .channel('video-calls', {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'meeting-join' }, (payload) => {
        console.log('📨 Received meeting-join:', payload);
        handleMeetingJoin(payload.payload);
      })
      .on('broadcast', { event: 'webrtc-offer' }, (payload) => {
        console.log('📨 Received webrtc-offer:', payload);
        handleWebRTCOffer(payload.payload);
      })
      .on('broadcast', { event: 'webrtc-answer' }, (payload) => {
        console.log('📨 Received webrtc-answer:', payload);
        handleWebRTCAnswer(payload.payload);
      })
      .on('broadcast', { event: 'webrtc-ice-candidate' }, (payload) => {
        console.log('📨 Received ice-candidate:', payload);
        handleWebRTCIceCandidate(payload.payload);
      })
      .on('broadcast', { event: 'participant-left' }, (payload) => {
        console.log('📨 Participant left:', payload);
        handleParticipantLeft(payload.payload);
      })
      .subscribe((status) => {
        console.log('📡 Signaling channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Signaling channel ready');
        }
      });

    return () => {
      if (signalingChannel.current) {
        supabase.removeChannel(signalingChannel.current);
      }
    };
  };

  const joinMeetingFromLink = async (meetingId: string) => {
    try {
      console.log('🚀 Joining meeting from link:', meetingId);
      setConnectionStatus('connecting');
      
      // Check if meeting exists and is active
      const { data: meeting, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('id', meetingId)
        .eq('is_active', true)
        .single();

      if (error || !meeting) {
        console.error('❌ Meeting not found:', error);
        alert('Meeting not found or has ended.');
        setConnectionStatus('failed');
        return;
      }

      console.log('✅ Meeting found:', meeting);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('📹 Got local stream:', stream);

      // Set up call state
      setCallState({
        isInCall: true,
        isGroupCall: true,
        callId: meetingId,
        participants: new Map(),
        localStream: stream,
      });

      setCurrentMeetingId(meetingId);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Announce joining to other participants
      await signalingChannel.current.send({
        type: 'broadcast',
        event: 'meeting-join',
        payload: {
          meetingId,
          userId: user?.id,
          userName: user?.full_name,
          userInfo: user
        },
      });

      console.log('📢 Announced joining to meeting');
      setConnectionStatus('connected');

    } catch (error) {
      console.error('❌ Error joining meeting:', error);
      setConnectionStatus('failed');
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Camera/microphone access denied. Please allow access and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera or microphone found. Please check your devices.');
        } else {
          alert(`Media error: ${error.message}`);
        }
      } else {
        alert('Failed to join meeting. Please try again.');
      }
    }
  };

  const handleMeetingJoin = async (payload: any) => {
    if (payload.userId === user?.id) return; // Ignore own messages
    
    console.log('👥 New participant joining:', payload.userName);
    
    if (!callState.localStream) {
      console.log('⚠️ No local stream available for new participant');
      return;
    }

    // Create peer connection for new participant
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream to peer connection
    callState.localStream.getTracks().forEach(track => {
      console.log('➕ Adding track to peer connection:', track.kind);
      peerConnection.addTrack(track, callState.localStream!);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream from:', payload.userName);
      const [remoteStream] = event.streams;
      
      setCallState(prev => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(payload.userId);
        if (participant) {
          participant.stream = remoteStream;
        } else {
          newParticipants.set(payload.userId, {
            member: payload.userInfo,
            stream: remoteStream,
            peerConnection
          });
        }
        return { ...prev, participants: newParticipants };
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', payload.userName);
        signalingChannel.current.send({
          type: 'broadcast',
          event: 'webrtc-ice-candidate',
          payload: {
            meetingId: currentMeetingId,
            targetUserId: payload.userId,
            fromUserId: user?.id,
            candidate: event.candidate,
          },
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state with', payload.userName, ':', peerConnection.connectionState);
    };

    // Add participant to state
    setCallState(prev => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(payload.userId, {
        member: payload.userInfo,
        stream: null,
        peerConnection,
      });
      return { ...prev, participants: newParticipants };
    });

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log('📤 Sending offer to:', payload.userName);
      await signalingChannel.current.send({
        type: 'broadcast',
        event: 'webrtc-offer',
        payload: {
          meetingId: currentMeetingId,
          targetUserId: payload.userId,
          fromUserId: user?.id,
          fromUserName: user?.full_name,
          offer,
        },
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const handleWebRTCOffer = async (payload: any) => {
    if (payload.targetUserId !== user?.id) return;
    
    console.log('📥 Handling WebRTC offer from:', payload.fromUserName);
    
    const participant = callState.participants.get(payload.fromUserId);
    if (!participant?.peerConnection) {
      console.log('⚠️ No peer connection found for offer');
      return;
    }

    try {
      await participant.peerConnection.setRemoteDescription(payload.offer);
      const answer = await participant.peerConnection.createAnswer();
      await participant.peerConnection.setLocalDescription(answer);

      console.log('📤 Sending answer to:', payload.fromUserName);
      await signalingChannel.current.send({
        type: 'broadcast',
        event: 'webrtc-answer',
        payload: {
          meetingId: currentMeetingId,
          targetUserId: payload.fromUserId,
          fromUserId: user?.id,
          answer,
        },
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  };

  const handleWebRTCAnswer = async (payload: any) => {
    if (payload.targetUserId !== user?.id) return;
    
    console.log('📥 Handling WebRTC answer from user:', payload.fromUserId);
    
    const participant = callState.participants.get(payload.fromUserId);
    if (!participant?.peerConnection) {
      console.log('⚠️ No peer connection found for answer');
      return;
    }

    try {
      await participant.peerConnection.setRemoteDescription(payload.answer);
      console.log('✅ Set remote description from answer');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  };

  const handleWebRTCIceCandidate = async (payload: any) => {
    if (payload.targetUserId !== user?.id) return;
    
    console.log('🧊 Handling ICE candidate from user:', payload.fromUserId);
    
    const participant = callState.participants.get(payload.fromUserId);
    if (!participant?.peerConnection) {
      console.log('⚠️ No peer connection found for ICE candidate');
      return;
    }

    try {
      await participant.peerConnection.addIceCandidate(payload.candidate);
      console.log('✅ Added ICE candidate');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  const handleParticipantLeft = (payload: any) => {
    console.log('👋 Participant left:', payload.userId);
    
    setCallState(prev => {
      const newParticipants = new Map(prev.participants);
      const participant = newParticipants.get(payload.userId);
      if (participant?.peerConnection) {
        participant.peerConnection.close();
      }
      newParticipants.delete(payload.userId);
      return { ...prev, participants: newParticipants };
    });
  };

  const generateMeetingLink = async () => {
    try {
      console.log('🔗 Starting meeting creation...');
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔗 Creating meeting room:', meetingId);
      console.log('👤 User ID:', user.id);
      
      // Create meeting room in database
      const { data, error } = await supabase
        .from('meeting_rooms')
        .insert([{
          id: meetingId,
          created_by: user?.id,
          is_active: true,
          participants: []
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating meeting room:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Meeting room created successfully:', data);
      
      const baseUrl = window.location.origin;
      const link = `${baseUrl}?meeting=${meetingId}`;
      
      console.log('✅ Meeting link created:', link);
      
      setMeetingLink(link);
      setCurrentMeetingId(meetingId);
      setShowMeetingModal(true);
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      
      let errorMessage = 'Failed to create meeting. ';
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage += 'Please make sure you are logged in.';
        } else if (error.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your account status.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your connection.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage);
    }
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setMeetingLinkCopied(true);
    setTimeout(() => setMeetingLinkCopied(false), 2000);
  };

  const shareMeetingLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'JHA Men Of Impact - Video Call',
        text: 'Join our video call',
        url: meetingLink,
      });
    } else {
      copyMeetingLink();
    }
  };

  const startCall = async (targetMember: Member) => {
    await startGroupCall([targetMember]);
  };

  const startGroupCall = async (targetMembers: Member[]) => {
    try {
      console.log('🚀 Starting group call with:', targetMembers.map(m => m.full_name));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setCallState({
        isInCall: true,
        isGroupCall: targetMembers.length > 1,
        callId,
        participants: new Map(),
        localStream: stream,
      });

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setShowGroupCallModal(false);
      setSelectedMembers(new Set());

    } catch (error) {
      console.error('❌ Error starting call:', error);
      handleMediaError(error);
    }
  };

  const handleMediaError = (error: any) => {
    console.error('📹 Media error:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Camera/microphone access was denied. Please grant permission in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please ensure your device has these capabilities.');
      } else if (error.name === 'NotReadableError') {
        alert('Camera or microphone is already in use by another application.');
      } else {
        alert(`Media access error: ${error.message}`);
      }
    } else {
      alert(`Error starting call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const endCall = async () => {
    console.log('📞 Ending call...');
    
    // Notify other participants
    if (currentMeetingId && signalingChannel.current) {
      await signalingChannel.current.send({
        type: 'broadcast',
        event: 'participant-left',
        payload: {
          meetingId: currentMeetingId,
          userId: user?.id,
        },
      });

      // Deactivate meeting room if creator
      if (callState.callId === currentMeetingId) {
        await supabase
          .from('meeting_rooms')
          .update({ is_active: false })
          .eq('id', currentMeetingId);
      }
    }

    cleanup();
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up call resources...');
    
    // Stop all tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Stopped track:', track.kind);
      });
    }

    // Close all peer connections
    callState.participants.forEach((participant, id) => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
        console.log('🔌 Closed peer connection for:', id);
      }
    });

    // Clear video refs
    participantVideoRefs.current.clear();

    // Reset state
    setCallState({
      isInCall: false,
      isGroupCall: false,
      callId: null,
      participants: new Map(),
      localStream: null,
    });

    setCurrentMeetingId(null);
    setConnectionStatus('disconnected');
    
    // Clear URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('meeting');
    window.history.replaceState({}, '', url.toString());
  };

  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCameraVisibility = () => {
    setCameraHidden(!cameraHidden);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const startSelectedGroupCall = () => {
    const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
    if (selectedMembersList.length > 0) {
      startGroupCall(selectedMembersList);
    }
  };

  const participantsList = Array.from(callState.participants.values());

  const getGridClass = (count: number) => {
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // In-call UI
  if (callState.isInCall) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Connection Status */}
        {connectionStatus === 'connecting' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Connecting to meeting...</span>
            </div>
          </div>
        )}

        {connectionStatus === 'failed' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-10">
            Connection failed. Please try again.
          </div>
        )}

        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Participants Grid */}
          {participantsList.length > 0 ? (
            <div className={`grid ${getGridClass(participantsList.length)} gap-2 h-full p-4`}>
              {participantsList.map((participant) => (
                <div key={participant.member.id} className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={(el) => {
                      if (el && participant.stream && el.srcObject !== participant.stream) {
                        el.srcObject = participant.stream;
                        el.play().catch(console.error);
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {participant.member.full_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Waiting for participants...</p>
                <p className="text-sm opacity-75">Share the meeting link to invite others</p>
              </div>
            </div>
          )}
          
          {/* Local Video (Picture-in-Picture) */}
          <div className={`absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white transition-opacity ${
            cameraHidden ? 'opacity-0' : 'opacity-100'
          }`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
              You
            </div>
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="text-white" size={24} />
              </div>
            )}
          </div>

          {/* Meeting Info */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="font-medium">
              Meeting: {currentMeetingId?.split('-').pop()?.toUpperCase()}
            </p>
            <p className="text-sm opacity-75">
              {participantsList.length} participant{participantsList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/90 p-6">
          <div className="flex justify-center space-x-6">
            <button
              onClick={toggleCameraVisibility}
              className={`p-4 rounded-full transition-colors ${
                cameraHidden 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              title={cameraHidden ? 'Show Camera' : 'Hide Camera'}
            >
              {cameraHidden ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                videoEnabled 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-colors ${
                audioEnabled 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
              onClick={endCall}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main video call interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Calls</h2>
        <p className="text-gray-600 dark:text-gray-400">Connect with fellow members through video calls</p>
      </div>

      {/* Create Meeting Button */}
      <div className="flex justify-center">
        <button
          onClick={generateMeetingLink}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 text-lg font-medium"
        >
          <Link size={24} />
          <span>Create Meeting Room</span>
        </button>
      </div>

      {/* Meeting Link Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Room Created</h3>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={copyMeetingLink}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                  >
                    {meetingLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                    <span className="text-sm">{meetingLinkCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={shareMeetingLink}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => {
                    // Join own meeting
                    const urlParams = new URLSearchParams();
                    urlParams.set('meeting', currentMeetingId!);
                    window.location.search = urlParams.toString();
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Video size={18} />
                  <span>Join Now</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share this link with members to join the video call
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Video className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="text-blue-900 dark:text-blue-100 font-medium mb-2">How to start a video call:</h3>
            <ol className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-decimal list-inside">
              <li>Click "Create Meeting Room" to generate a meeting link</li>
              <li>Share the link with other members</li>
              <li>When participants click the link, they'll join the video call automatically</li>
              <li>Grant camera and microphone permissions when prompted</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users size={20} />
            <span>Community Members</span>
          </h3>
        </div>

        <div className="p-6">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a meeting room and share the link to connect with other members.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="text-blue-600" size={16} />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{member.full_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};