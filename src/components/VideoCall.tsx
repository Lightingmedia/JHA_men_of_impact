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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    fetchMembers();
    setupSignaling();
    
    // Check if we're joining from a meeting link
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    if (meetingId) {
      joinMeetingFromLink(meetingId);
    }
    
    return () => {
      cleanup();
    };
  }, []);

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
    // Set up Supabase real-time for signaling
    const channel = supabase
      .channel('video-calls')
      .on('broadcast', { event: 'call-invite' }, (payload) => {
        if (payload.payload.to === user?.id) {
          setIncomingCall({
            from: payload.payload.from,
            callId: payload.payload.callId,
            isGroup: payload.payload.isGroup,
          });
        }
      })
      .on('broadcast', { event: 'meeting-join' }, (payload) => {
        if (payload.payload.meetingId === currentMeetingId && payload.payload.userId !== user?.id) {
          handleNewParticipant(payload.payload);
        }
      })
      .on('broadcast', { event: 'call-offer' }, (payload) => {
        if (payload.payload.callId === callState.callId && payload.payload.to === user?.id) {
          handleRemoteOffer(payload.payload);
        }
      })
      .on('broadcast', { event: 'call-answer' }, (payload) => {
        if (payload.payload.callId === callState.callId && payload.payload.to === user?.id) {
          handleRemoteAnswer(payload.payload);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        if (payload.payload.callId === callState.callId && payload.payload.to === user?.id) {
          handleRemoteIceCandidate(payload.payload);
        }
      })
      .on('broadcast', { event: 'call-end' }, (payload) => {
        if (payload.payload.callId === callState.callId) {
          endCall();
        }
      })
      .on('broadcast', { event: 'participant-left' }, (payload) => {
        if (payload.payload.callId === callState.callId) {
          removeParticipant(payload.payload.participantId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const joinMeetingFromLink = async (meetingId: string) => {
    try {
      // Check if meeting exists and is active
      const { data: meeting, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('id', meetingId)
        .eq('is_active', true)
        .single();

      if (error || !meeting) {
        alert('Meeting not found or has ended.');
        return;
      }

      // Join the meeting
      setCurrentMeetingId(meetingId);
      await startMeetingCall(meetingId);
      
      // Notify other participants
      supabase.channel('video-calls').send({
        type: 'broadcast',
        event: 'meeting-join',
        payload: {
          meetingId,
          userId: user?.id,
          userName: user?.full_name,
        },
      });

    } catch (error) {
      console.error('Error joining meeting:', error);
      alert('Failed to join meeting. Please try again.');
    }
  };

  const startMeetingCall = async (meetingId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setCallState({
        isInCall: true,
        isGroupCall: true,
        callId: meetingId,
        participants: new Map(),
        localStream: stream,
      });

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error('Error starting meeting call:', error);
      handleMediaError(error);
    }
  };

  const handleNewParticipant = async (payload: any) => {
    if (!callState.localStream) return;

    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream to peer connection
    callState.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, callState.localStream!);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setCallState(prev => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(payload.userId);
        if (participant) {
          participant.stream = event.streams[0];
          newParticipants.set(payload.userId, participant);
        }
        return { ...prev, participants: newParticipants };
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            callId: callState.callId,
            to: payload.userId,
            from: user,
            candidate: event.candidate,
          },
        });
      }
    };

    // Add participant to call state
    setCallState(prev => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(payload.userId, {
        member: { id: payload.userId, full_name: payload.userName } as Member,
        stream: null,
        peerConnection,
      });
      return { ...prev, participants: newParticipants };
    });

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    supabase.channel('video-calls').send({
      type: 'broadcast',
      event: 'call-offer',
      payload: {
        callId: callState.callId,
        to: payload.userId,
        from: user,
        offer,
      },
    });
  };

  const handleRemoteOffer = async (payload: any) => {
    const participant = callState.participants.get(payload.from.id);
    if (participant?.peerConnection) {
      await participant.peerConnection.setRemoteDescription(payload.offer);
      const answer = await participant.peerConnection.createAnswer();
      await participant.peerConnection.setLocalDescription(answer);

      supabase.channel('video-calls').send({
        type: 'broadcast',
        event: 'call-answer',
        payload: {
          callId: callState.callId,
          to: payload.from.id,
          from: user,
          answer,
        },
      });
    }
  };

  const handleRemoteAnswer = async (payload: any) => {
    const participant = callState.participants.get(payload.from.id);
    if (participant?.peerConnection) {
      await participant.peerConnection.setRemoteDescription(payload.answer);
    }
  };

  const handleRemoteIceCandidate = async (payload: any) => {
    const participant = callState.participants.get(payload.from.id);
    if (participant?.peerConnection) {
      await participant.peerConnection.addIceCandidate(payload.candidate);
    }
  };

  const removeParticipant = (participantId: string) => {
    setCallState(prev => {
      const newParticipants = new Map(prev.participants);
      const participant = newParticipants.get(participantId);
      if (participant?.peerConnection) {
        participant.peerConnection.close();
      }
      newParticipants.delete(participantId);
      return { ...prev, participants: newParticipants };
    });
  };

  const startCall = async (targetMember: Member) => {
    await startGroupCall([targetMember]);
  };

  const startGroupCall = async (targetMembers: Member[]) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const participants = new Map();

      // Create peer connections for each participant
      for (const member of targetMembers) {
        const peerConnection = new RTCPeerConnection(rtcConfig);
        
        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          setCallState(prev => {
            const newParticipants = new Map(prev.participants);
            const participant = newParticipants.get(member.id);
            if (participant) {
              participant.stream = event.streams[0];
              newParticipants.set(member.id, participant);
            }
            return { ...prev, participants: newParticipants };
          });
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            supabase.channel('video-calls').send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                callId,
                to: member.id,
                from: user,
                candidate: event.candidate,
              },
            });
          }
        };

        participants.set(member.id, {
          member,
          stream: null,
          peerConnection,
        });
      }

      setCallState({
        isInCall: true,
        isGroupCall: targetMembers.length > 1,
        callId,
        participants,
        localStream: stream,
      });

      // Send invitations to all participants
      for (const member of targetMembers) {
        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'call-invite',
          payload: {
            to: member.id,
            from: user,
            callId,
            isGroup: targetMembers.length > 1,
          },
        });
      }

      // Create offers for each participant
      for (const [memberId, participant] of participants) {
        const offer = await participant.peerConnection.createOffer();
        await participant.peerConnection.setLocalDescription(offer);

        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'call-offer',
          payload: {
            callId,
            to: memberId,
            from: user,
            offer,
          },
        });
      }

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setShowGroupCallModal(false);
      setSelectedMembers(new Set());

    } catch (error) {
      console.error('Error starting call:', error);
      handleMediaError(error);
    }
  };

  const handleMediaError = (error: any) => {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Camera/microphone access was denied. Please grant permission in your browser settings:\n\n1. Click the camera/microphone icon in your browser\'s address bar\n2. Select "Allow" for both camera and microphone\n3. Refresh the page and try again\n\nOn mobile: Go to Settings → Site Settings → Camera/Microphone → Allow');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please ensure your device has these capabilities and they are not being used by another application.');
      } else if (error.name === 'NotReadableError') {
        alert('Camera or microphone is already in use by another application. Please close other apps using these devices and try again.');
      } else {
        alert(`Media access error: ${error.message}\n\nPlease check your device permissions and try again.`);
      }
    } else {
      alert(`Error starting call: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your internet connection and device permissions.`);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Join the existing call
      setCallState({
        isInCall: true,
        isGroupCall: incomingCall.isGroup,
        callId: incomingCall.callId,
        participants: new Map(),
        localStream: stream,
      });

      setIncomingCall(null);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error('Error answering call:', error);
      handleMediaError(error);
    }
  };

  const inviteToCall = async (member: Member) => {
    if (!callState.isInCall || !callState.callId) return;

    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream to peer connection
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, callState.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setCallState(prev => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(member.id);
        if (participant) {
          participant.stream = event.streams[0];
          newParticipants.set(member.id, participant);
        }
        return { ...prev, participants: newParticipants };
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            callId: callState.callId,
            to: member.id,
            from: user,
            candidate: event.candidate,
          },
        });
      }
    };

    // Add participant to call state
    setCallState(prev => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(member.id, {
        member,
        stream: null,
        peerConnection,
      });
      return { 
        ...prev, 
        participants: newParticipants,
        isGroupCall: true 
      };
    });

    // Send invitation
    supabase.channel('video-calls').send({
      type: 'broadcast',
      event: 'call-invite',
      payload: {
        to: member.id,
        from: user,
        callId: callState.callId,
        isGroup: true,
      },
    });

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    supabase.channel('video-calls').send({
      type: 'broadcast',
      event: 'call-offer',
      payload: {
        callId: callState.callId,
        to: member.id,
        from: user,
        offer,
      },
    });
  };

  const copyCallId = () => {
    if (callState.callId) {
      navigator.clipboard.writeText(callState.callId);
      setCallIdCopied(true);
      setTimeout(() => setCallIdCopied(false), 2000);
    }
  };

  const generateMeetingLink = async () => {
    try {
      const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create meeting room in database
      const { error } = await supabase
        .from('meeting_rooms')
        .insert([{
          id: meetingId,
          created_by: user?.id,
          is_active: true,
          participants: []
        }]);

      if (error) throw error;

      const baseUrl = window.location.origin;
      const link = `${baseUrl}?meeting=${meetingId}`;
      setMeetingLink(link);
      setCurrentMeetingId(meetingId);
      setShowMeetingModal(true);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
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

  const addPhoneNumber = () => {
    if (phoneNumber.trim() && !phoneNumbers.includes(phoneNumber.trim())) {
      setPhoneNumbers([...phoneNumbers, phoneNumber.trim()]);
      setPhoneNumber('');
    }
  };

  const removePhoneNumber = (numberToRemove: string) => {
    setPhoneNumbers(phoneNumbers.filter(num => num !== numberToRemove));
  };

  const inviteByPhone = (number: string) => {
    const message = `Join our JHA Men Of Impact video call: ${meetingLink}`;
    const smsUrl = `sms:${number}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
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

  const endCall = async () => {
    // Send end call signal
    if (callState.callId) {
      supabase.channel('video-calls').send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          callId: callState.callId,
          from: user,
        },
      });

      // Notify about leaving
      supabase.channel('video-calls').send({
        type: 'broadcast',
        event: 'participant-left',
        payload: {
          callId: callState.callId,
          participantId: user?.id,
        },
      });

      // Deactivate meeting room if it's a meeting
      if (currentMeetingId) {
        await supabase
          .from('meeting_rooms')
          .update({ is_active: false })
          .eq('id', currentMeetingId);
      }
    }

    cleanup();
  };

  const cleanup = () => {
    // Stop all tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    callState.participants.forEach(participant => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
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

    setIncomingCall(null);
    setShowGroupCallModal(false);
    setSelectedMembers(new Set());
    setCurrentMeetingId(null);
  };

  const removeParticipantFromCall = (participantId: string) => {
    supabase.channel('video-calls').send({
      type: 'broadcast',
      event: 'participant-left',
      payload: {
        callId: callState.callId,
        participantId,
      },
    });

    removeParticipant(participantId);
  };

  const getParticipantVideoRef = (participantId: string) => {
    if (!participantVideoRefs.current.has(participantId)) {
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      participantVideoRefs.current.set(participantId, videoElement);
    }
    return participantVideoRefs.current.get(participantId);
  };

  // Update participant videos when streams change
  useEffect(() => {
    callState.participants.forEach((participant, participantId) => {
      if (participant.stream) {
        const videoElement = getParticipantVideoRef(participantId);
        if (videoElement && videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
        }
      }
    });
  }, [callState.participants]);

  const availableMembers = members.filter(member => 
    !callState.participants.has(member.id)
  );

  const participantsList = Array.from(callState.participants.values());

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
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

  if (callState.isInCall) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Participants Grid */}
          <div className={`grid ${getGridClass(participantsList.length)} gap-2 h-full p-4`}>
            {participantsList.map((participant) => (
              <div key={participant.member.id} className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {participant.member.full_name}
                </div>
                {callState.isGroupCall && (
                  <button
                    onClick={() => removeParticipantFromCall(participant.member.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                    title="Remove participant"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
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
            {cameraHidden && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <EyeOff className="text-white" size={32} />
              </div>
            )}
          </div>

          {/* Call Info */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
            <p className="font-medium">
              {callState.isGroupCall 
                ? `Group Call (${participantsList.length} participants)` 
                : participantsList[0]?.member.full_name || 'Connecting...'
              }
            </p>
            <p className="text-sm opacity-75">
              {callState.callId && (
                <button onClick={copyCallId} className="hover:text-blue-300 transition-colors">
                  Call ID: {callState.callId.slice(-8)} {callIdCopied ? '✓' : '📋'}
                </button>
              )}
            </p>
          </div>

          {/* Invite Button for Group Calls */}
          {callState.isGroupCall && availableMembers.length > 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <select
                onChange={(e) => {
                  const member = members.find(m => m.id === e.target.value);
                  if (member) {
                    inviteToCall(member);
                    e.target.value = '';
                  }
                }}
                className="bg-black/50 text-white border border-white/20 rounded-lg px-3 py-1 text-sm"
                defaultValue=""
              >
                <option value="" disabled>Invite member...</option>
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id} className="bg-gray-800">
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black/80 p-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Calls</h2>
        <p className="text-gray-600 dark:text-gray-400">Connect with fellow members through video calls</p>
      </div>

      {/* Group Call Button */}
      <div className="flex justify-end">
        <div className="flex space-x-3">
          <button
            onClick={generateMeetingLink}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Link size={20} />
            <span>Create Meeting Link</span>
          </button>
          <button
            onClick={() => setShowGroupCallModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Start Group Call</span>
          </button>
        </div>
      </div>

      {/* Meeting Link Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Link Created</h3>
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
                  <span>Share Link</span>
                </button>
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone size={18} />
                  <span>Invite by Phone</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share this link with members to join the call
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Invitation Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite by Phone</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Phone Number
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={addPhoneNumber}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {phoneNumbers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Numbers ({phoneNumbers.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {phoneNumbers.map((number, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{number}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => inviteByPhone(number)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            Invite
                          </button>
                          <button
                            onClick={() => removePhoneNumber(number)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add phone numbers to send meeting invitations via SMS
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Call Setup Modal */}
      {showGroupCallModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start Group Call</h3>
              <button
                onClick={() => setShowGroupCallModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select members to invite to the group call:</p>
            
            <div className="space-y-2 mb-6">
              {members.map(member => (
                <label key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex items-center space-x-2">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="text-blue-600" size={16} />
                      </div>
                    )}
                    <span className="text-gray-900 dark:text-white">{member.full_name}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowGroupCallModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startSelectedGroupCall}
                disabled={selectedMembers.size === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Start Call ({selectedMembers.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-blue-600" size={24} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {incomingCall.isGroup ? 'Incoming Group Call' : 'Incoming Call'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {incomingCall.from.full_name} is {incomingCall.isGroup ? 'inviting you to a group call' : 'calling you'}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIncomingCall(null)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <PhoneOff size={20} />
                  <span>Decline</span>
                </button>
                <button
                  onClick={answerCall}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone size={20} />
                  <span>Answer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users size={20} />
            <span>Available Members</span>
          </h3>
        </div>

        <div className="p-6">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.id === 'admin-bypass-id' 
                  ? 'This is demo mode. In the real app, you\'ll see all active members here.'
                  : 'No other members are currently online for video calls.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="text-blue-600" size={20} />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{member.full_name}</h4>
                      <p className="text-sm text-green-600">Available</p>
                    </div>
                  </div>

                  <button
                    onClick={() => startCall(member)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Video size={18} />
                    <span>Call</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};