/**
 * ══════════════════════════════════════════════════════════════
 *  MySchool Connect — Socket.io Server
 *  File: socket-server/index.js
 * ══════════════════════════════════════════════════════════════
 */

'use strict';

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const axios   = require('axios');

// ── Config ────────────────────────────────────────────────────
const LARAVEL_URL   = process.env.LARAVEL_URL   || 'http://localhost:8000';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'http://localhost:5173';
const PORT          = process.env.SOCKET_PORT   || 3002;
const INTERNAL_KEY  = process.env.INTERNAL_KEY  || 'myschool-super-secret-key-change-in-production';

// ── Express + Socket.io Setup ─────────────────────────────────
const app    = express();
const server = http.createServer(app);
app.use(express.json({ limit: '1mb' }));

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL.split(','),
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
});

// ── Online User Registry ──────────────────────────────────────
const onlineUsers = new Map();

function addOnline(userId, socketId) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
}

function removeOnline(userId, socketId) {
    const set = onlineUsers.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) onlineUsers.delete(userId);
}

function isOnline(userId) {
    return onlineUsers.has(String(userId)) && onlineUsers.get(String(userId)).size > 0;
}

function getUserSockets(userId) {
    return onlineUsers.get(String(userId)) || new Set();
}

// ── Sanctum Token Verification ────────────────────────────────
async function verifyToken(token) {
    try {
        const { data } = await axios.post(
            `${LARAVEL_URL}/api/verify-token`,
            { token },
            { timeout: 5000 }
        );
        return data.user;
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return null;
    }
}

// ── Socket Auth Middleware ─────────────────────────────────────
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
               || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('AUTH_MISSING_TOKEN'));

    const user = await verifyToken(token);
    if (!user) return next(new Error('AUTH_INVALID_TOKEN'));
    if (!user.is_active) return next(new Error('AUTH_ACCOUNT_INACTIVE'));

    socket.user = user;
    next();
});

// ── Connection Handler ────────────────────────────────────────
io.on('connection', (socket) => {
    const userId = String(socket.user.id);
    const role   = socket.user.role;

    console.log(`[CONNECT] User ${socket.user.name} (${role} #${userId}) → ${socket.id}`);

    addOnline(userId, socket.id);

    // Every user joins their personal room for targeted delivery
    socket.join(`user.${userId}`);
    console.log(`[ROOM] ${userId} joined user.${userId}`);

    // ── Room management ────────────────────────────────────────
    socket.on('join-user-room', (userId) => {
        socket.join(`user.${userId}`);
        console.log(`[ROOM] ${socket.user.id} joined user.${userId}`);
    });

    socket.on('join-conversation', (conversationId) => {
        const room = `conversation.${conversationId}`;
        socket.join(room);
        console.log(`[ROOM] ${userId} joined ${room}`);
    });

    socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation.${conversationId}`);
    });

    // Parents join their route room to receive trip broadcasts
    socket.on('join-route', (routeId) => {
        const room = `route.${routeId}`;
        socket.join(room);
        console.log(`[ROOM] ${userId} joined ${room}`);
    });

    socket.on('leave-route', (routeId) => {
        socket.leave(`route.${routeId}`);
    });

    // Join trip room for location updates
    socket.on('join-trip', (tripId) => {
        const room = `trip.${tripId}`;
        socket.join(room);
        console.log(`[ROOM] ${userId} joined ${room}`);
    });

    socket.on('leave-trip', (tripId) => {
        socket.leave(`trip.${tripId}`);
    });

    // ── Typing indicators ──────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
        socket.to(`conversation.${conversationId}`).emit('user-typing', {
            userId,
            conversationId,
            userName: socket.user.name
        });
    });

    socket.on('stop-typing', ({ conversationId }) => {
        socket.to(`conversation.${conversationId}`).emit('user-stop-typing', {
            userId,
            conversationId
        });
    });

    // ── Message read receipt ───────────────────────────────────
    socket.on('message-read', ({ conversationId, messageIds }) => {
        socket.to(`conversation.${conversationId}`).emit('messages-seen', {
            reader_id:      userId,
            conversation_id: conversationId,
            message_ids:    messageIds,
        });
    });

    // ── Online status request ──────────────────────────────────
    socket.on('check-online', (targetUserId, callback) => {
        if (typeof callback === 'function') {
            callback({ online: isOnline(targetUserId) });
        }
    });

    // ── Get online users ──────────────────────────────────────
    socket.on('get-online-users', () => {
        socket.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
        removeOnline(userId, socket.id);
        console.log(`[DISCONNECT] User ${userId} — ${reason}`);
    });

    socket.on('error', (err) => {
        console.error(`[SOCKET ERROR] ${userId}:`, err.message);
    });
});

// ══════════════════════════════════════════════════════════════
//  INTERNAL HTTP ENDPOINTS — called by Laravel backend only
// ══════════════════════════════════════════════════════════════

function validateInternalKey(req, res, next) {
    const key = req.headers['x-internal-key'];
    if (key !== INTERNAL_KEY) {
        console.log(`[AUTH] Invalid internal key: ${key}`);
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// ── POST /broadcast-message ────────────────────────────────────
// Called by MessagingController::sendMessage()
app.post('/broadcast-message', validateInternalKey, (req, res) => {
    const { receiver_id, message, conversation_id } = req.body;
    
    console.log('[BROADCAST] Broadcasting message:', { 
        receiver_id, 
        message_id: message?.id, 
        conversation_id,
        message_preview: message?.body?.substring(0, 50)
    });
    
    if (!receiver_id || !message) {
        return res.status(400).json({ error: 'receiver_id and message required' });
    }
    
    // Check if receiver is online
    const receiverOnline = isOnline(receiver_id);
    console.log(`[BROADCAST] Receiver ${receiver_id} online: ${receiverOnline}`);
    
    // Send to receiver's personal room
    io.to(`user.${receiver_id}`).emit('new-message', message);
    console.log(`[BROADCAST] Sent to user.${receiver_id}`);
    
    // Also send to conversation room
    const convId = message.conversation_id || conversation_id;
    if (convId) {
        io.to(`conversation.${convId}`).emit('new-message', message);
        console.log(`[BROADCAST] Sent to conversation.${convId}`);
    }
    
    res.json({ ok: true, delivered: receiverOnline });
});

// ── POST /broadcast-trip ───────────────────────────────────────
// Called by TransportController::updateTripStatus()
app.post('/broadcast-trip', validateInternalKey, (req, res) => {
    const { parent_ids, trip } = req.body;

    if (!Array.isArray(parent_ids) || !trip) {
        return res.status(400).json({ error: 'parent_ids[] and trip required' });
    }

    let notified = 0;

    parent_ids.forEach((pid) => {
        io.to(`user.${pid}`).emit('trip-update', trip);
        if (isOnline(String(pid))) notified++;
    });

    if (trip.route_id) {
        io.to(`route.${trip.route_id}`).emit('trip-update', trip);
    }

    console.log(`[TRIP] route.${trip.route_id} | ${parent_ids.length} parents targeted | ${notified} online`);

    res.json({ ok: true, targeted: parent_ids.length, online_now: notified });
});

// ── POST /broadcast-trip-student ───────────────────────────────
// Called by TransportController::startStudentTrip() and endStudentTrip()
app.post('/broadcast-trip-student', validateInternalKey, (req, res) => {
    const { parent_id, student_id, student_name, status, driver_name, message } = req.body;

    if (!parent_id) {
        return res.status(400).json({ error: 'parent_id required' });
    }

    const eventData = {
        student_id,
        student_name,
        status,
        driver_name,
        message,
        timestamp: new Date().toISOString()
    };

    io.to(`user.${parent_id}`).emit('student-trip-update', eventData);

    const delivered = isOnline(String(parent_id));
    console.log(`[STUDENT-TRIP] → user.${parent_id} | student:${student_name} | status:${status} | online:${delivered}`);

    res.json({ ok: true, delivered });
});

// ── POST /broadcast-location ───────────────────────────────────
// Called by TransportController::updateLocation()
app.post('/broadcast-location', validateInternalKey, (req, res) => {
    const { trip_id, driver_id, latitude, longitude, updated_at } = req.body;

    if (!trip_id) {
        return res.status(400).json({ error: 'trip_id required' });
    }

    io.to(`trip.${trip_id}`).emit('driver-location', {
        driver_id,
        latitude,
        longitude,
        updated_at: updated_at || new Date().toISOString()
    });

    console.log(`[LOCATION] trip.${trip_id} | lat:${latitude} | lng:${longitude}`);

    res.json({ ok: true });
});

// ── GET /online-users ──────────────────────────────────────────
app.get('/online-users', validateInternalKey, (req, res) => {
    res.json({
        count:  onlineUsers.size,
        users:  [...onlineUsers.keys()],
    });
});

// ── GET /health ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        connections: io.engine.clientsCount,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── Start Server ───────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`\n🚀 MySchool Socket.io server running on port ${PORT}`);
    console.log(`   Laravel backend : ${LARAVEL_URL}`);
    console.log(`   Frontend allowed: ${FRONTEND_URL}`);
    console.log(`   Internal key    : ${INTERNAL_KEY.substring(0, 10)}...`);
    console.log(`   Health check    : http://localhost:${PORT}/health\n`);
});

// ── Error Handling ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]', error);
});