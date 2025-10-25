import { ApiService } from './ApiService.js';
import { UIManager } from './UImanager.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.ui = new UIManager();
        this.currentUser = null;
        this.currentPostId = null;
    }

    async init() {
        this.#addEventListeners();
        await this.#checkLogin();
    }

    #addEventListeners() {
        // Auth Listeners
        this.ui.authForm.addEventListener('submit', (e) => this.#handleAuthSubmit(e));
        this.ui.authToggleButton.addEventListener('click', (e) => this.#handleAuthToggle(e));
        this.ui.logoutButton.addEventListener('click', () => this.#handleLogout());

        // App Listeners
        this.ui.submitPostButton.addEventListener('click', () => this.#handlePostSubmit());
        this.ui.postsFeed.addEventListener('click', (e) => this.#handlePostClick(e));
        this.ui.postDetail.closeButton.addEventListener('click', () => this.#closePostDetail());
        this.ui.postDetail.commentForm.addEventListener('submit', (e) => this.#handleCommentSubmit(e));
    }

    async #checkLogin() {
        const token = localStorage.getItem('miniLinkedInToken');
        if (!token) {
            this.ui.showAuthModal('login');
            return;
        }

        try {
            this.api.setToken(token);
            const user = await this.api.validateToken();
            this.#handleLoginSuccess(user, token);
        } catch (error) {
            localStorage.removeItem('miniLinkedInToken');
            this.api.setToken(null);
            this.ui.showAuthModal('login');
        }
    }

    #handleLoginSuccess(user, token) {
        this.currentUser = user;
        this.api.setToken(token);
        localStorage.setItem('miniLinkedInToken', token);

        this.ui.displayUserProfile(user);
        this.ui.hideAuthModal();
        this.ui.showApp();
        this.ui.setAuthStatus('Connected');
        this.#loadInitialData();
    }

    #handleLogout() {
        this.currentUser = null;
        this.api.setToken(null);
        localStorage.removeItem('miniLinkedInToken');
        
        this.ui.resetUIForLogout();
        this.ui.hideApp();
        this.ui.showAuthModal('login');
    }

    #handleAuthToggle(e) {
        e.preventDefault();
        const mode = this.ui.authForm.dataset.mode;
        this.ui.showAuthModal(mode === 'login' ? 'register' : 'login');
    }

    async #handleAuthSubmit(e) {
        e.preventDefault();
        const mode = this.ui.authForm.dataset.mode;
        const email = this.ui.emailInput.value;
        const password = this.ui.passwordInput.value;

        try {
            let data;
            if (mode === 'login') {
                data = await this.api.login(email, password);
            } else {
                const displayName = this.ui.displayNameInput.value;
                const headline = this.ui.headlineInput.value;
                if (!displayName || !headline) return alert('Please fill out all fields');
                data = await this.api.register({ displayName, headline, email, password });
            }
            this.#handleLoginSuccess(data.user, data.token);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    // Load data *after* login
    async #loadInitialData() {
        try {
            const [posts, users] = await Promise.all([
                this.api.getPosts(), 
                this.api.getUsers()
            ]);
            this.ui.renderPosts(posts);
            this.ui.renderUsers(users);
        } catch (err) {
            this.ui.setAuthStatus(`Failed to load data: ${err.message}`, true);
        }
    }
    
    #closePostDetail() {
        this.ui.togglePostDetailModal(false);
        this.currentPostId = null;
    }

    // --- Protected Actions ---

    async #handlePostSubmit() {
        const content = this.ui.postContentInput.value.trim();
        if (!content) return alert('Post cannot be empty.');
        
        try {
            await this.api.createPost({ content });
            this.ui.postContentInput.value = '';
            const posts = await this.api.getPosts();
            this.ui.renderPosts(posts);
        } catch (err) { alert(`Error creating post: ${err.message}`); }
    }

    async #handlePostClick(event) {
        const postElement = event.target.closest('[data-post-id]');
        if (!postElement) return;

        this.currentPostId = postElement.dataset.postId;
        this.ui.togglePostDetailModal(true);

        try {
            const [post, comments] = await Promise.all([
                this.api.getPost(this.currentPostId),
                this.api.getComments(this.currentPostId)
            ]);
            this.ui.renderPostDetail(post);
            this.ui.renderComments(comments);
        } catch (err) {
            alert(`Error loading post: ${err.message}`);
            this.#closePostDetail();
        }
    }

    async #handleCommentSubmit(event) {
        event.preventDefault();
        const content = this.ui.postDetail.commentInput.value.trim();
        if (!content) return alert('Comment cannot be empty.');

        try {
            await this.api.createComment({
                content,
                postId: this.currentPostId
            });
            this.ui.postDetail.commentInput.value = '';
            const comments = await this.api.getComments(this.currentPostId);
            this.ui.renderComments(comments);
        } catch (err) {
            alert(`Error posting comment: ${err.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});