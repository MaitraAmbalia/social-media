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
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// --- 1. DATABASE MODELS ---
const UserSchema = new mongoose.Schema({
    displayName: { type: String, required: true },
    headline: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
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

// --- 2. AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add payload { id: user.id } to req
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

// --- 3. API ROUTES ---
const router = express.Router();

// --- AUTH ROUTES (Public) ---
router.post('/register', async (req, res) => {
    const { displayName, headline, email, password, bio } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ displayName, headline, email, password: hashedPassword, bio });
        await user.save();

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, user: { _id: user.id, displayName: user.displayName, headline: user.headline, bio: user.bio, email: user.email } });
    } catch (err) { res.status(500).json({ message: 'Server Error: ' + err.message }); }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ token, user: { _id: user.id, displayName: user.displayName, headline: user.headline, bio: user.bio, email: user.email } });
    } catch (err) { res.status(500).json({ message: 'Server Error: ' + err.message }); }
});

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
        if (!post) return res.status(44).json({ message: 'Post not found' });
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
