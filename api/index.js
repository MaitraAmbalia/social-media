require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- DATABASE MODELS (SCHEMAS) ---
const UserSchema = new mongoose.Schema({
    displayName: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String, default: '' },
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// --- API ROUTES ---
const router = express.Router();

// User Routes
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ displayName: 1 });
        res.json(users);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/users', async (req, res) => {
    const { displayName, headline, bio } = req.body;
    if (!displayName || !headline) {
        return res.status(400).json({ message: 'displayName and headline are required' });
    }
    try {
        const newUser = new User({ displayName, headline, bio });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/users/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Post Routes
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'displayName headline');
        res.json(posts);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/posts', async (req, res) => {
    const { content, authorId } = req.body;
    try {
        const author = await User.findById(authorId);
        if (!author) return res.status(404).json({ message: 'Author user not found' });
        const newPost = new Post({ content, author: authorId });
        await newPost.save();
        const populatedPost = await newPost.populate('author', 'displayName headline');
        res.status(201).json(populatedPost);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get('/posts/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('author', 'displayName headline');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Comment Routes
router.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.query.postId }).sort({ createdAt: 1 }).populate('author', 'displayName');
        res.json(comments);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/comments', async (req, res) => {
    const { content, authorId, postId } = req.body;
    try {
        const newComment = new Comment({ content, author: authorId, post: postId });
        await newComment.save();
        const populatedComment = await newComment.populate('author', 'displayName');
        res.status(201).json(populatedComment);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Use the router for all routes prefixed with /api
app.use('/api', router);

// Export the app for Vercel
module.exports = app;