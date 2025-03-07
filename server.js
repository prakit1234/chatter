const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const pool = require('./config/db');
const { generateToken, verifyToken } = require('./middleware/auth');
require('dotenv').config();

// App setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// File upload config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = generateToken(uuidv4());

        await pool.query(
            'INSERT INTO users (username, email, password, token) VALUES ($1, $2, $3, $4)',
            [username, email, hashedPassword, token]
        );

        res.status(201).json({ message: 'User registered successfully', token });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Store connected users
const users = new Set();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New user connected');

    // Handle user join
    socket.on('user join', (username) => {
        socket.username = username;
        users.add(username);
        io.emit('users update', Array.from(users));
        io.emit('chat message', {
            user: 'System',
            message: `${username} has joined the chat`,
            time: new Date().toLocaleTimeString()
        });
    });

    // Handle chat messages
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    // Handle user disconnect
    socket.on('user leave', (username) => {
        users.delete(username);
        io.emit('users update', Array.from(users));
        io.emit('chat message', {
            user: 'System',
            message: `${username} has left the chat`,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users.delete(socket.username);
            io.emit('users update', Array.from(users));
            io.emit('chat message', {
                user: 'System',
                message: `${socket.username} has left the chat`,
                time: new Date().toLocaleTimeString()
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 