import { supabase } from './supabase.js';
import { Auth } from './auth.js';

class Chat {
    constructor() {
        this.currentUser = Auth.checkAuth();
        this.messages = [];
        this.activeChat = null;
        this.setupEventListeners();
        this.initializeRealtimeSubscription();
    }

    setupEventListeners() {
        // Message form submission
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        const logoutBtn = document.getElementById('logout-btn');

        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            
            if (message && this.activeChat) {
                await this.sendMessage(message);
                messageInput.value = '';
            }
        });

        // Logout button
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });

        // Navigation buttons
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchSection(button.dataset.section);
            });
        });
    }

    async initializeRealtimeSubscription() {
        const subscription = supabase
            .from('messages')
            .on('INSERT', payload => {
                this.handleNewMessage(payload.new);
            })
            .subscribe();
    }

    async sendMessage(content) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        sender_id: this.currentUser.id,
                        chat_id: this.activeChat,
                        content,
                        created_at: new Date()
                    }
                ]);

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    handleNewMessage(message) {
        if (message.chat_id === this.activeChat) {
            this.appendMessage(message);
        }
    }

    appendMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(
            message.sender_id === this.currentUser.id ? 'sent' : 'received'
        );

        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;

        document.getElementById('messages').appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messages = document.getElementById('messages');
        messages.scrollTop = messages.scrollHeight;
    }

    async switchSection(section) {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Handle section content loading
        switch (section) {
            case 'chats':
                await this.loadChats();
                break;
            case 'groups':
                await this.loadGroups();
                break;
            case 'contacts':
                await this.loadContacts();
                break;
        }
    }

    // Add methods for loading chats, groups, and contacts
    async loadChats() {
        // Implementation for loading chats
    }

    async loadGroups() {
        // Implementation for loading groups
    }

    async loadContacts() {
        // Implementation for loading contacts
    }
}

// Initialize chat when the page loads
if (document.querySelector('.chat-container')) {
    const chat = new Chat();
}