require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 1. DATABASE MODELS ---
// User, Post, and Comment Schemas are unchanged
const UserSchema = new mongoose.Schema({ /* ... */ });
const PostSchema = new mongoose.Schema({ /* ... */ });
const CommentSchema = new mongoose.Schema({ /* ... */ });

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// --- 2. AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => { /* ... unchanged ... */ };

// --- 3. API ROUTES ---
const router = express.Router();

// --- AUTH ROUTES (Public) ---
router.post('/register', async (req, res) => { /* ... unchanged ... */ });
router.post('/login', async (req, res) => { /* ... unchanged ... */ });

// --- PUBLIC ROUTES (No token required) ---
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password -email').sort({ displayName: 1 });
        res.json(users);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'displayName headline');
        res.json(posts);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/posts/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('author', 'displayName headline');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.query.postId }).sort({ createdAt: 1 }).populate('author', 'displayName');
        res.json(comments);
    } catch (err) { res.status(500).json({ message: err.message }); }
});


// --- PROTECTED ROUTES (Token required) ---
router.get('/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

router.post('/posts', authMiddleware, async (req, res) => {
    const { content } = req.body;
    try {
        const newPost = new Post({ content, author: req.user.id });
        await newPost.save();
        const populatedPost = await newPost.populate('author', 'displayName headline');
        res.status(201).json(populatedPost);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/comments', authMiddleware, async (req, res) => {
    const { content, postId } = req.body;
    try {
        const newComment = new Comment({ content, author: req.user.id, post: postId });
        await newComment.save();
        const populatedComment = await newComment.populate('author', 'displayName');
        res.status(201).json(populatedComment);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.use('/api', router);
module.exports = app;