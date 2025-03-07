import { supabase } from './supabase.js';

export class Auth {
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/chat.html';
        } catch (error) {
            throw error;
        }
    }

    static async register(username, email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (error) throw error;

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username,
                        email
                    }
                ]);

            if (profileError) throw profileError;

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async logout() {
        try {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}