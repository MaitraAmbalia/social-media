export class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async _request(endpoint, method = 'GET', body = null) {
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        // Send token if it exists
        if (this.token) {
            config.headers['x-auth-token'] = this.token;
        }
        if (body) {
            config.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        const resData = await response.json(); // Get JSON data regardless of 'ok' status
        
        if (!response.ok) {
            throw new Error(resData.message || `Error: ${response.status}`);
        }
        return resData;
    }

    // --- Auth Methods ---
    register(userData) {
        return this._request('/register', 'POST', userData);
    }

    login(email, password) {
        return this._request('/login', 'POST', { email, password });
    }

    validateToken() {
        return this._request('/auth/me', 'GET');
    }

    // --- App Methods ---
    getUsers() { return this._request('/users'); }
    
    getPosts() { return this._request('/posts'); }
    getPost(id) { return this._request(`/posts/${id}`); }
    createPost(postData) { return this._request('/posts', 'POST', postData); }

    getComments(postId) { return this._request(`/comments?postId=${postId}`); }
    createComment(commentData) { return this._request('/comments', 'POST', commentData); }
}