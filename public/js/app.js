import { ApiService } from 'ApiService.js';
import { UIManager } from 'UIManager.js';

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
        this.#loadInitialData();
    }

    #addEventListeners() {
        this.ui.editProfileButton.addEventListener('click', () => this.ui.toggleModal(true));
        this.ui.modal.closeButton.addEventListener('click', () => this.ui.toggleModal(false));
        this.ui.modal.form.addEventListener('submit', (e) => this.#handleProfileSubmit(e));
        
        this.ui.submitPostButton.addEventListener('click', () => this.#handlePostSubmit());
        this.ui.logoutButton.addEventListener('click', () => this.#handleLogout());

        this.ui.postDetail.closeButton.addEventListener('click', () => this.#closePostDetail());
        this.ui.postDetail.commentForm.addEventListener('submit', (e) => this.#handleCommentSubmit(e));

        this.ui.postsFeed.addEventListener('click', (e) => this.#handlePostClick(e));
    }
    
    #closePostDetail() {
        this.ui.togglePostDetailModal(false);
        this.currentPostId = null;
    }

    async #loadInitialData() {
        try {
            const [posts, users] = await Promise.all([this.api.getPosts(), this.api.getUsers()]);
            this.ui.renderPosts(posts);
            this.ui.renderUsers(users);
        } catch (err) {
            this.ui.setAuthStatus(`Failed to load data: ${err.message}`, true);
        }
    }

    async #checkLogin() {
        const userId = localStorage.getItem('miniLinkedInUserId');
        if (userId) {
            try {
                const user = await this.api.getUser(userId);
                this.#setCurrentUser(user);
            } catch (error) {
                localStorage.removeItem('miniLinkedInUserId');
                this.ui.setAuthStatus('Please create a profile.', true);
                this.ui.toggleModal(true);
                this.ui.resetUIForLogout();
            }
        } else {
            this.ui.setAuthStatus('Please create a profile.');
            this.ui.toggleModal(true);
            this.ui.resetUIForLogout();
        }
    }
    
    #setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('miniLinkedInUserId', user._id);
        this.ui.displayUserProfile(user);
        this.ui.setAuthStatus('Connected');
        this.ui.toggleModal(false);
    }

    async #handleProfileSubmit(event) {
        event.preventDefault();
        const userData = {
            displayName: this.ui.modal.displayName.value,
            headline: this.ui.modal.headline.value,
            bio: this.ui.modal.bio.value,
        };
        try {
            let user;
            if (this.currentUser) {
                user = await this.api.updateUser(this.currentUser._id, userData);
            } else {
                user = await this.api.createUser(userData);
            }
            this.#setCurrentUser(user);
            const users = await this.api.getUsers();
            this.ui.renderUsers(users);
        } catch (err) {
            alert(`Error saving profile: ${err.message}`);
        }
    }
    
    async #handlePostSubmit() {
        const content = this.ui.postContentInput.value.trim();
        if (!content) return alert('Post cannot be empty.');
        if (!this.currentUser) return alert('You must create a profile before posting!');
        try {
            await this.api.createPost({ content, authorId: this.currentUser._id });
            this.ui.postContentInput.value = '';
            const posts = await this.api.getPosts();
            this.ui.renderPosts(posts);
        } catch (err) {
            alert(`Error creating post: ${err.message}`);
        }
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
        if (!this.currentUser) return alert('You must be logged in to comment.');
        if (!this.currentPostId) return alert('No post is selected.');

        try {
            await this.api.createComment({
                content,
                authorId: this.currentUser._id,
                postId: this.currentPostId
            });
            this.ui.postDetail.commentInput.value = '';
            const comments = await this.api.getComments(this.currentPostId);
            this.ui.renderComments(comments);
        } catch (err) {
            alert(`Error posting comment: ${err.message}`);
        }
    }
    
    #handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('miniLinkedInUserId');
        this.ui.resetUIForLogout();
        this.ui.setAuthStatus('Please create a profile.');
        this.ui.toggleModal(true); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});