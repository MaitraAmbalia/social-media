export class ApiService {
    constructor() {
        // Points to the /api folder in the same project
        this.baseURL = '/api';
    }

    // This private method is simplified to remove the '#' for broader browser support
    async _request(endpoint, method = 'GET', body = null) {
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            config.body = JSON.stringify(body);
        }
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
        }
        return response.json();
    }

    // User Methods
    getUsers() { return this._request('/users'); }
    getUser(id) { return this._request(`/users/${id}`); }
    createUser(userData) { return this._request('/users', 'POST', userData); }
    updateUser(id, userData) { return this._request(`/users/${id}`, 'PUT', userData); }
    
    // Post Methods
    getPosts() { return this._request('/posts'); }
    getPost(id) { return this._request(`/posts/${id}`); }
    createPost(postData) { return this._request('/posts', 'POST', postData); }

    // Comment Methods
    getComments(postId) { return this._request(`/comments?postId=${postId}`); }
    createComment(commentData) { return this._request('/comments', 'POST', commentData); }
}