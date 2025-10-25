
export class UIManager {
    constructor() {
        this.postsFeed = document.getElementById('postsFeed');
        this.usersList = document.getElementById('usersList');
        this.authStatus = document.getElementById('authStatus');
        
        this.userCard = {
            name: document.getElementById('userCardName'),
            headline: document.getElementById('userCardHeadline'),
            id: document.getElementById('userCardId'),
            initial: document.getElementById('userCardInitial'),
        };

        this.modal = {
            element: document.getElementById('profileModal'),
            form: document.getElementById('profileForm'),
            info: document.getElementById('modalInfo'),
            closeButton: document.getElementById('closeModalButton'),
            displayName: document.getElementById('displayNameInput'),
            headline: document.getElementById('headlineInput'),
            bio: document.getElementById('bioInput'),
        };
        
        this.postContentInput = document.getElementById('postContentInput');
        this.submitPostButton = document.getElementById('submitPostButton');
        this.editProfileButton = document.getElementById('editProfileButton');
        this.logoutButton = document.getElementById('logoutButton');

        this.postDetail = {
            modal: document.getElementById('postDetailModal'),
            closeButton: document.getElementById('postDetailModalCloseButton'),
            content: document.getElementById('postDetailContent'),
            commentsList: document.getElementById('postDetailCommentsList'),
            commentForm: document.getElementById('postDetailCommentForm'),
            commentInput: document.getElementById('postDetailCommentInput'),
        };
    }
    
    renderPosts(posts) {
        this.postsFeed.innerHTML = "";
        if (posts.length === 0) {
            this.postsFeed.innerHTML = `<p class="text-gray-500">No posts yet.</p>`;
            return;
        }
        posts.forEach(post => {
            const authorName = post.author ? post.author.displayName : 'Deleted User';
            const authorInitial = authorName.charAt(0).toUpperCase();
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

    displayUserProfile(user) {
        this.userCard.name.textContent = user.displayName;
        this.userCard.headline.textContent = user.headline;
        this.userCard.id.textContent = `User ID: ${user._id}`;
        this.userCard.initial.textContent = user.displayName.charAt(0).toUpperCase();

        this.modal.displayName.value = user.displayName;
        this.modal.headline.value = user.headline;
        this.modal.bio.value = user.bio || '';
        
        this.editProfileButton.classList.remove('hidden');
        this.logoutButton.classList.remove('hidden');
    }
    
    renderPostDetail(post) {
        const authorName = post.author ? post.author.displayName : 'Deleted User';
        const authorInitial = authorName.charAt(0).toUpperCase();
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
        if (comments.length === 0) {
            this.postDetail.commentsList.innerHTML = `<p class="text-gray-500">No comments yet.</p>`;
            return;
        }
        comments.forEach(comment => {
            const authorName = comment.author ? comment.author.displayName : 'Deleted User';
            const authorInitial = authorName.charAt(0).toUpperCase();
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

    toggleModal(show = true) {
        this.modal.element.classList.toggle('hidden', !show);
    }

    togglePostDetailModal(show = true) {
        this.postDetail.modal.classList.toggle('hidden', !show);
        if (!show) {
            this.postDetail.content.innerHTML = "Loading...";
            this.postDetail.commentsList.innerHTML = "Loading...";
            this.postDetail.commentInput.value = "";
        }
    }
    
    setAuthStatus(status, isError = false) {
        this.authStatus.textContent = status;
        this.authStatus.className = isError ? 'font-semibold text-red-500' : 'font-semibold text-green-600';
    }
    
    resetUIForLogout() {
        this.userCard.name.textContent = '...';
        this.userCard.headline.textContent = '...';
        this.userCard.id.textContent = 'No user loaded.';
        this.userCard.initial.textContent = '?';
        
        this.editProfileButton.classList.add('hidden');
        this.logoutButton.classList.add('hidden');
        
        this.modal.form.reset();
        this.modal.info.textContent = 'Create your profile to get started.';
    }
}