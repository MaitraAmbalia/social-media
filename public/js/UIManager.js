export class UIManager {
    constructor() {
        // Main App
        this.mainAppContent = document.getElementById('mainAppContent');
        this.authStatus = document.getElementById('authStatus');

        // Auth Modal
        this.authModal = document.getElementById('authModal');
        this.authForm = document.getElementById('authForm');
        this.authTitle = document.getElementById('authTitle');
        this.registerFields = document.getElementById('registerFields');
        this.displayNameInput = document.getElementById('displayNameInput');
        this.headlineInput = document.getElementById('headlineInput');
        this.emailInput = document.getElementById('emailInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.authSubmitButton = document.getElementById('authSubmitButton');
        this.authToggleText = document.getElementById('authToggleText');
        this.authToggleButton = document.getElementById('authToggleButton');
        
        // Profile Card
        this.userCard = {
            name: document.getElementById('userCardName'),
            headline: document.getElementById('userCardHeadline'),
            initial: document.getElementById('userCardInitial'),
        };
        // Toggled Buttons
        this.loginButton = document.getElementById('loginButton');
        this.logoutButton = document.getElementById('logoutButton');

        // Center Feed
        this.createPostSection = document.getElementById('createPostSection');
        this.postContentInput = document.getElementById('postContentInput');
        this.submitPostButton = document.getElementById('submitPostButton');
        this.postsFeed = document.getElementById('postsFeed');

        // Right Sidebar
        this.usersList = document.getElementById('usersList');
        
        // Post Detail Modal
        this.postDetail = {
            modal: document.getElementById('postDetailModal'),
            closeButton: document.getElementById('postDetailModalCloseButton'),
            content: document.getElementById('postDetailContent'),
            commentsList: document.getElementById('postDetailCommentsList'),
            commentForm: document.getElementById('postDetailCommentForm'),
            commentInput: document.getElementById('postDetailCommentInput'),
        };
    }

    // --- UI State Methods ---

    showLoggedInState(user) {
        this.loginButton.classList.add('hidden');
        this.logoutButton.classList.remove('hidden');
        this.createPostSection.classList.remove('hidden');
        this.postDetail.commentForm.classList.remove('hidden');

        this.userCard.name.textContent = user.displayName;
        this.userCard.headline.textContent = user.headline;
        this.userCard.initial.textContent = user.displayName.charAt(0).toUpperCase();
    }

    showGuestState() {
        this.loginButton.classList.remove('hidden');
        this.logoutButton.classList.add('hidden');
        this.createPostSection.classList.add('hidden');
        this.postDetail.commentForm.classList.add('hidden');

        this.userCard.name.textContent = 'Guest User';
        this.userCard.headline.textContent = 'Log in to post and comment';
        this.userCard.initial.textContent = 'G';
    }

    showAuthModal(state = 'login') {
        if (state === 'login') {
            this.authTitle.textContent = 'Log In';
            this.registerFields.classList.add('hidden');
            this.authSubmitButton.textContent = 'Log In';
            this.authToggleText.textContent = 'Need an account?';
            this.authToggleButton.textContent = 'Sign Up';
            this.authForm.dataset.mode = 'login';
        } else {
            this.authTitle.textContent = 'Sign Up';
            this.registerFields.classList.remove('hidden');
            this.authSubmitButton.textContent = 'Create Account';
            this.authToggleText.textContent = 'Already have an account?';
            this.authToggleButton.textContent = 'Log In';
            this.authForm.dataset.mode = 'register';
        }
        this.authModal.classList.remove('hidden');
    }

    hideAuthModal() {
        this.authModal.classList.add('hidden');
    }
    
    setAuthStatus(status, isError = false) {
        this.authStatus.textContent = status;
        this.authStatus.className = isError ? 'font-semibold text-red-500' : 'font-semibold text-green-600';
    }

    // --- App Render Methods ---

    renderPosts(posts) {
        this.postsFeed.innerHTML = "";
        if (!posts || posts.length === 0) {
            this.postsFeed.innerHTML = `<p class="text-gray-500">No posts yet.</p>`;
            return;
        }
        posts.forEach(post => {
            const authorName = post.author ? post.author.displayName : 'Deleted User';
            const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : '?';
            const time = new Date(post.createdAt).toLocaleString();
            
            const postEl = document.createElement('div');
            postEl.className = "bg-white p-4 rounded-lg shadow mb-4 cursor-pointer hover:bg-gray-50 transition-colors";
            postEl.dataset.postId = post._id;
            postEl.innerHTML = `
                <div class="flex items-center mb-2 pointer-events-none">
                    <div class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl mr-3">${authorInitial}</div>
                    <div>
                        <p class="font-bold">${authorName}</p>
                        <p class="text-sm text-gray-500">${time}</p>
                    </div>
                </div>
                <p class="text-gray-800 whitespace-pre-wrap pointer-events-none">${post.content}</p>`;
            this.postsFeed.appendChild(postEl);
        });
    }

    renderUsers(users) {
        this.usersList.innerHTML = "";
        if (!users || users.length === 0) return;
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = "flex items-center p-3 hover:bg-gray-100 rounded-lg";
            userEl.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-xl mr-3">${user.displayName.charAt(0).toUpperCase()}</div>
                <div>
                    <p class="font-semibold">${user.displayName}</p>
                    <p class="text-sm text-gray-600">${user.headline}</p>
                </div>`;
            this.usersList.appendChild(userEl);
        });
    }
    
    renderPostDetail(post) {
        const authorName = post.author ? post.author.displayName : 'Deleted User';
        const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : '?';
        const time = new Date(post.createdAt).toLocaleString();
        
        this.postDetail.content.innerHTML = `
            <div class="flex items-center mb-3">
                <div class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-2xl mr-4">${authorInitial}</div>
                <div>
                    <p class="font-bold text-lg">${authorName}</p>
                    <p class="text-sm text-gray-600">${post.author ? post.author.headline : '...'}</p>
                    <p class="text-xs text-gray-500">${time}</p>
                </div>
            </div>
            <p class="text-gray-800 text-lg whitespace-pre-wrap">${post.content}</p>
        `;
    }

    renderComments(comments) {
        this.postDetail.commentsList.innerHTML = "";
        if (!comments || comments.length === 0) {
            this.postDetail.commentsList.innerHTML = `<p class="text-gray-500">No comments yet.</p>`;
            return;
        }
        comments.forEach(comment => {
            const authorName = comment.author ? comment.author.displayName : 'Deleted User';
            const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : '?';
            const time = new Date(comment.createdAt).toLocaleString();
            
            const commentEl = document.createElement('div');
            commentEl.className = "flex items-start";
            commentEl.innerHTML = `
                <div class="w-9 h-9 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold text-lg mr-3 flex-shrink-0">${authorInitial}</div>
                <div class="bg-gray-100 rounded-lg p-3 w-full">
                    <div class="flex justify-between items-center mb-1">
                        <p class="font-semibold text-sm">${authorName}</p>
                        <p class="text-xs text-gray-500">${time}</p>
                    </div>
                    <p class="text-sm text-gray-800">${comment.content}</p>
                </div>
            `;
            this.postDetail.commentsList.appendChild(commentEl);
        });
    }

    togglePostDetailModal(show = true) {
        this.postDetail.modal.classList.toggle('hidden', !show);
        if (!show) {
            this.postDetail.content.innerHTML = "Loading...";
            this.postDetail.commentsList.innerHTML = "Loading...";
            this.postDetail.commentInput.value = "";
        }
    }
}
