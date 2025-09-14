import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, Member } from '../lib/supabase';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, X } from 'lucide-react';

interface CallState {
  isInCall: boolean;
  isInitiator: boolean;
  remoteUser: Member | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
}

export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isInitiator: false,
    remoteUser: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
  });
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{
    from: Member;
    offer: RTCSessionDescriptionInit;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
    
    return () => {
      cleanup();
    };
  }, []);

  const fetchMembers = async () => {
    if (user?.id === 'admin-bypass-id') {
      // Mock members for demo mode
      const mockMembers: Member[] = [
        {
          id: 'member-1',
          phone: '+1 (555) 234-5678',
          full_name: 'Brother Williams',
          profile_picture_url: undefined,
          birth_month: 4,
          birth_day: 22,
          is_admin: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'member-2',
          phone: '+1 (555) 345-6789',
          full_name: 'Brother Davis',
          profile_picture_url: undefined,
          birth_month: 5,
          birth_day: 8,
          is_admin: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setMembers(mockMembers);
      return;
    }

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
    if (user?.id === 'admin-bypass-id') {
      // Skip real-time signaling in demo mode
      return;
    }

    // Set up Supabase real-time for signaling
    const channel = supabase
      .channel('video-calls')
      .on('broadcast', { event: 'call-offer' }, (payload) => {
        if (payload.payload.to === user?.id) {
          setIncomingCall({
            from: payload.payload.from,
            offer: payload.payload.offer,
          });
        }
      })
      .on('broadcast', { event: 'call-answer' }, (payload) => {
        if (payload.payload.to === user?.id && callState.peerConnection) {
          callState.peerConnection.setRemoteDescription(payload.payload.answer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        if (payload.payload.to === user?.id && callState.peerConnection) {
          callState.peerConnection.addIceCandidate(payload.payload.candidate);
        }
      })
      .on('broadcast', { event: 'call-end' }, (payload) => {
        if (payload.payload.to === user?.id) {
          endCall();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startCall = async (targetMember: Member) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const peerConnection = new RTCPeerConnection(rtcConfig);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setCallState(prev => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && user?.id !== 'admin-bypass-id') {
          supabase.channel('video-calls').send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              to: targetMember.id,
              from: user,
              candidate: event.candidate,
            },
          });
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer through signaling
      if (user?.id !== 'admin-bypass-id') {
        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'call-offer',
          payload: {
            to: targetMember.id,
            from: user,
            offer,
          },
        });
      }

      setCallState({
        isInCall: true,
        isInitiator: true,
        remoteUser: targetMember,
        localStream: stream,
        remoteStream: null,
        peerConnection,
      });

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Error accessing camera/microphone. Please check permissions.');
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const peerConnection = new RTCPeerConnection(rtcConfig);

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setCallState(prev => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && user?.id !== 'admin-bypass-id') {
          supabase.channel('video-calls').send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              to: incomingCall.from.id,
              from: user,
              candidate: event.candidate,
            },
          });
        }
      };

      // Set remote description and create answer
      await peerConnection.setRemoteDescription(incomingCall.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer
      if (user?.id !== 'admin-bypass-id') {
        supabase.channel('video-calls').send({
          type: 'broadcast',
          event: 'call-answer',
          payload: {
            to: incomingCall.from.id,
            from: user,
            answer,
          },
        });
      }

      setCallState({
        isInCall: true,
        isInitiator: false,
        remoteUser: incomingCall.from,
        localStream: stream,
        remoteStream: null,
        peerConnection,
      });

      setIncomingCall(null);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error('Error answering call:', error);
      alert('Error accessing camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    // Send end call signal
    if (callState.remoteUser && user?.id !== 'admin-bypass-id') {
      supabase.channel('video-calls').send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          to: callState.remoteUser.id,
          from: user,
        },
      });
    }

    cleanup();
  };

  const cleanup = () => {
    // Stop all tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (callState.peerConnection) {
      callState.peerConnection.close();
    }

    // Reset state
    setCallState({
      isInCall: false,
      isInitiator: false,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
    });

    setIncomingCall(null);
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

  // Update remote video when stream changes
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  if (callState.isInCall) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Call Info */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
            <p className="font-medium">{callState.remoteUser?.full_name}</p>
            <p className="text-sm opacity-75">
              {callState.isInitiator ? 'Calling...' : 'In call'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/80 p-6">
          <div className="flex justify-center space-x-6">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Calls</h2>
        <p className="text-gray-600">Connect with fellow members through video calls</p>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-blue-600" size={24} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Incoming Call
              </h3>
              <p className="text-gray-600 mb-6">
                {incomingCall.from.full_name} is calling you
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users size={20} />
            <span>Available Members</span>
          </h3>
        </div>

        <div className="p-6">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members available</h3>
              <p className="text-gray-600">
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
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
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
                      <h4 className="font-medium text-gray-900">{member.full_name}</h4>
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

      {/* Demo Mode Notice */}
      {user?.id === 'admin-bypass-id' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Video className="text-yellow-600" size={20} />
            <span className="text-yellow-800 font-medium">Demo Mode - Video Calling</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Video calling requires camera/microphone permissions and works between real members. 
            Connect to Supabase and add members to test full functionality.
          </p>
        </div>
      )}
    </div>
  );
};