const socket = io('http://localhost:3000');

class Auth {
    static token = localStorage.getItem('token');
    static user = JSON.parse(localStorage.getItem('user'));

    static async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.setAuth(data.token, data.user);
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.setAuth(data.token, data.user);
            return data;
        } catch (error) {
            throw error;
        }
    }

    static setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    static logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }

    static isAuthenticated() {
        return !!this.token;
    }

    static getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const chatContainer = document.getElementById('chat-container');
const authContainer = document.getElementById('auth-container');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const usersList = document.getElementById('users-list');
const logoutBtn = document.getElementById('logout-btn');
const profileUpload = document.getElementById('profile-upload');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await Auth.login(
            e.target.email.value,
            e.target.password.value
        );
        showChat();
    } catch (error) {
        showError(error.message);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await Auth.register(
            e.target.username.value,
            e.target.email.value,
            e.target.password.value
        );
        showChat();
    } catch (error) {
        showError(error.message);
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    
    if (msg.trim()) {
        socket.emit('chat message', {
            message: msg,
            type: 'text'
        });
        e.target.elements.msg.value = '';
    }
});

logoutBtn.addEventListener('click', () => {
    Auth.logout();
});

profileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await fetch('/api/profile/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('profile-picture').src = data.url;
            }
        } catch (error) {
            showError('Failed to upload profile picture');
        }
    }
});

// Socket Events
socket.on('connect', () => {
    if (Auth.isAuthenticated()) {
        socket.emit('authenticate', Auth.token);
    }
});

socket.on('chat message', (data) => {
    appendMessage(data);
});

socket.on('user_status_change', (data) => {
    updateUserStatus(data);
});

// Helper Functions
function showChat() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    initializeChat();
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function appendMessage(data) {
    const div = document.createElement('div');
    div.classList.add('message');
    if (data.sender_id === Auth.user.id) {
        div.classList.add('self');
    }

    div.innerHTML = `
        <div class="message-header">
            <span>${data.username}</span>
            <span>${new Date(data.created_at).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">
            ${data.content}
        </div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateUserStatus(data) {
    const userElement = document.querySelector(`[data-user-id="${data.userId}"]`);
    if (userElement) {
        const indicator = userElement.querySelector('.online-indicator');
        indicator.classList.toggle('online', data.isOnline);
    }
}

function initializeChat() {
    if (Auth.isAuthenticated()) {
        document.getElementById('username-display').textContent = Auth.user.username;
        if (Auth.user.profile_picture_url) {
            document.getElementById('profile-picture').src = Auth.user.profile_picture_url;
        }
        socket.auth = { token: Auth.token };
        socket.connect();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated()) {
        showChat();
    }
});

// Emoji picker initialization
const emojis = ['😊', '😂', '❤️', '👍', '😎', '🎉', '🔥', '😍', '🤔', '😅', '👋', '💪'];
emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.textContent = emoji;
    button.onclick = () => {
        document.getElementById('msg').value += emoji;
        emojiPicker.style.display = 'none';
    };
    emojiPicker.appendChild(button);
});

emojiBtn.onclick = () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
};

// Click outside emoji picker to close
document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
    }
}); 