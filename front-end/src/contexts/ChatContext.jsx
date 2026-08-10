import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
} from 'react';
import { useAuth }  from './AuthContext';
import api          from '../services/api';
import { io }       from 'socket.io-client';
import toast        from 'react-hot-toast';

const ChatContext = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// Unwrap helpers for Laravel ApiResponse trait
//
// $this->success($item)       → { data: <item>,                message }
// $this->success($paginator)  → { data: { data:[...], total }, message }
// ─────────────────────────────────────────────────────────────────────────────
function unwrapList(axiosData) {
  // axiosData  = axios response .data  = { data: X, message }
  const payload = axiosData?.data;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;                  // plain array
  if (payload.data && Array.isArray(payload.data)) return payload.data; // paginator
  return [];
}

function unwrapItem(axiosData) {
  // axiosData  = { data: <item>, message }
  return axiosData?.data ?? axiosData;
}

// Safe string ID comparison — avoids int vs string bugs
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// ─────────────────────────────────────────────────────────────────────────────
export function ChatProvider({ children }) {
  const { user, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [users,         setUsers]         = useState([]);
  const [activeChat,    setActiveChat]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [typingUsers,   setTypingUsers]   = useState({});
  const [isLoading,     setIsLoading]     = useState(false);
  const [loadingUsers,  setLoadingUsers]  = useState(false);

  const messagesEndRef    = useRef(null);
  const socketRef         = useRef(null);
  const typingTimeoutRef  = useRef(null);
  const pollingRef        = useRef(null);

  // These refs always hold the latest value so socket / interval
  // callbacks never read stale closure state.
  const activeChatRef = useRef(null);
  const messagesRef   = useRef([]);
  const userRef       = useRef(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { messagesRef.current   = messages;   }, [messages]);
  useEffect(() => { userRef.current       = user;       }, [user]);

  // ── scroll ────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // ── dedup merge ───────────────────────────────────────────────────────────
  // All paths that add messages (optimistic send, socket event, polling)
  // go through here. Deduplication by id means order of arrival never matters.
  const addMessages = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages(prev => {
      const seen  = new Set(prev.map(m => String(m.id)));
      const fresh = incoming.filter(m => !seen.has(String(m.id)));
      if (!fresh.length) return prev;
      // Keep chronological order
      return [...prev, ...fresh].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    });
  }, []);

  // ── polling fallback (only when socket is down) ───────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    console.log('▶ Polling started');
    pollingRef.current = setInterval(async () => {
      const convId = activeChatRef.current?.conversationId;
      if (!convId) return;
      try {
        const res     = await api.get(`/messaging/conversations/${convId}/messages`);
        const fetched = unwrapList(res.data);
        const ordered = [...fetched].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        const knownIds = new Set(messagesRef.current.map(m => String(m.id)));
        const fresh    = ordered.filter(m => !knownIds.has(String(m.id)));
        if (fresh.length) {
          addMessages(fresh);
          scrollToBottom();
          fresh
            .filter(m => !sameId(m.sender_id, userRef.current?.id))
            .forEach(m => {
              if (m.sender?.name) {
                toast.info(`${m.sender.name}: ${m.body?.substring(0, 50)}`,
                  { duration: 4000, position: 'top-right' });
              }
            });
        }
      } catch (e) { console.error('Polling error:', e); }
    }, 4000);
  }, [addMessages, scrollToBottom]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || socketRef.current) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
    console.log('🔌 Connecting socket:', socketUrl);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected', socket.id);
      // Re-join personal room and any active conversation room
      socket.emit('join-user-room', userRef.current?.id);
      const convId = activeChatRef.current?.conversationId;
      if (convId) socket.emit('join-conversation', convId);
      stopPolling();
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
      startPolling();
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      startPolling();
    });

    socket.on('new-message', (message) => {
      const myId = userRef.current?.id;
      console.log('📨 new-message:', {
        msg_id:    message.id,
        sender_id: message.sender_id,
        my_id:     myId,
        is_mine:   sameId(message.sender_id, myId),
      });

      // Guard: skip echo of our own message — already added optimistically
      if (sameId(message.sender_id, myId)) {
        console.log('↩ Skipped own echo');
        return;
      }

      const currentConvId = activeChatRef.current?.conversationId;
      if (sameId(currentConvId, message.conversation_id)) {
        addMessages([message]);
        scrollToBottom();
      }

      // Always refresh sidebar so unread badge + last message update
      loadConversations();

      if (message.sender?.name && message.body) {
        toast.success(`${message.sender.name}: ${message.body.substring(0, 50)}`, {
          duration: 5000, position: 'top-right', icon: '💬',
        });
      }
    });

    socket.on('user-typing', ({ conversationId, userName }) => {
      if (sameId(activeChatRef.current?.conversationId, conversationId)) {
        setTypingUsers(p => ({ ...p, [conversationId]: { isTyping: true, userName } }));
        setTimeout(() =>
          setTypingUsers(p => ({ ...p, [conversationId]: { isTyping: false, userName: '' } }))
        , 3000);
      }
    });

    socket.on('user-stop-typing', ({ conversationId }) => {
      if (sameId(activeChatRef.current?.conversationId, conversationId)) {
        setTypingUsers(p => ({ ...p, [conversationId]: { isTyping: false, userName: '' } }));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      stopPolling();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join / leave conversation room when activeChat changes
  useEffect(() => {
    const socket = socketRef.current;
    const convId  = activeChat?.conversationId;
    if (!socket?.connected || !convId) return;
    socket.emit('join-conversation', convId);
    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-conversation', convId);
      }
    };
  }, [activeChat?.conversationId]);

  // ── data loaders ──────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await api.get('/messaging/conversations');
      const list = unwrapList(res.data);
      setConversations(list);
    } catch (e) { console.error('loadConversations:', e); }
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res  = await api.get('/messaging/contacts');
      const list = unwrapList(res.data);
      setUsers(list);
    } catch (e) { console.error('loadUsers:', e); }
    finally { setLoadingUsers(false); }
  }, [token]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setIsLoading(true);
    setMessages([]); // clear previous chat while loading
    try {
      const res     = await api.get(`/messaging/conversations/${conversationId}/messages`);
      const fetched = unwrapList(res.data);
      // Sort ascending (oldest first) — API returns newest first
      const ordered = [...fetched].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(ordered);
      setTimeout(scrollToBottom, 100);
    } catch (e) { console.error('loadMessages:', e); }
    finally { setIsLoading(false); }
  }, [scrollToBottom]);

  // ── open chat ─────────────────────────────────────────────────────────────
  const openChat = useCallback(async (selectedUser, existingConversationId = null) => {
    console.log('📂 openChat:', selectedUser?.name, existingConversationId);

    // Case 1: came from sidebar — conversation already exists
    if (existingConversationId) {
      setActiveChat({ conversationId: existingConversationId, user: selectedUser });
      await loadMessages(existingConversationId);
      return;
    }

    // Case 2: came from contacts tab — check if a conversation already exists
    const existing = conversations.find(c =>
      sameId(c.participant?.id, selectedUser.id)
    );
    if (existing) {
      setActiveChat({ conversationId: existing.id, user: selectedUser });
      await loadMessages(existing.id);
      return;
    }

    // Case 3: new conversation — POST to backend
    try {
      // class_id is now optional on the backend
      const payload = user?.role === 'parent'
        ? { teacher_id: selectedUser.id }
        : { parent_id:  selectedUser.id };

      const res     = await api.post('/messaging/conversations', payload);
      const newConv = unwrapItem(res.data);

      console.log('🆕 Conversation created:', newConv.id);
      setActiveChat({ conversationId: newConv.id, user: selectedUser });
      setMessages([]);
      await loadConversations();
    } catch (e) {
      console.error('openChat error:', e.response?.data || e.message);
      toast.error('Erreur lors de la création de la conversation');
    }
  }, [conversations, user?.role, loadMessages, loadConversations]);

  // ── send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    const convId = activeChatRef.current?.conversationId;
    if (!convId || !content?.trim()) return null;

    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('stop-typing', { conversationId: convId });

    try {
      const res        = await api.post(
        `/messaging/conversations/${convId}/messages`,
        { content: content.trim() }
      );
      // response: { data: { id, body, sender_id, receiver_id, ... }, message }
      const newMessage = unwrapItem(res.data);

      console.log('✉️ Sent:', {
        id:          newMessage.id,
        sender_id:   newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        body:        newMessage.body,
      });

      // Add optimistically — addMessages deduplicates so the socket
      // echo (own message on conversation room) won't create a duplicate.
      addMessages([newMessage]);
      scrollToBottom();
      loadConversations(); // update sidebar last-message (non-blocking)

      return newMessage;
    } catch (e) {
      console.error('sendMessage error:', e.response?.data || e.message);
      toast.error("Erreur lors de l'envoi du message");
      return null;
    }
  }, [addMessages, scrollToBottom, loadConversations]);

  // ── typing ────────────────────────────────────────────────────────────────
  const handleTyping = useCallback(() => {
    const socket = socketRef.current;
    const convId  = activeChatRef.current?.conversationId;
    if (!socket?.connected || !convId) return;

    socket.emit('typing', { conversationId: convId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() =>
      socket.emit('stop-typing', { conversationId: convId })
    , 2000);
  }, []);

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) { loadConversations(); loadUsers(); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    conversations, users, activeChat, messages,
    typingUsers, isLoading, loadingUsers,
    messagesEndRef, setActiveChat,
    openChat, sendMessage, handleTyping,
    loadConversations, loadMessages, scrollToBottom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}