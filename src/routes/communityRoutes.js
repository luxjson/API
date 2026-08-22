const express=require('express');const authFlex=require('../middleware/authFlex'),requireUser=require('../middleware/requireUser');const ac=require('../controllers/communityAuthController'),cc=require('../controllers/communityController');const router=express.Router();const adminOnly=(req,res,next)=>req.authUser?.role==='admin'?next():res.status(403).json({success:false,message:'Admin access required'});
/** @swagger
 * /api/community/auth/register:
 *   post:
 *     summary: Register a community user
 *     responses: {201: {description: User created}, 409: {description: Username already in use}}
 */router.post('/auth/register',ac.register);
/** @swagger
 * /api/community/auth/login:
 *   post:
 *     summary: Authenticate a community user or admin
 *     responses: {200: {description: JWT returned}, 401: {description: Invalid credentials}}
 */router.post('/auth/login',ac.loginUser);
/** @swagger
 * /api/community/auth/me:
 *   get:
 *     summary: Return the authenticated account (Authentication Required)
 *     security: [{BearerAuth: []}]
 *     responses: {200: {description: Current account}, 401: {description: Unauthorized}}
 */router.get('/auth/me',authFlex,requireUser,ac.meUser);
/** @swagger
 * /api/community/auth/profile:
 *   put:
 *     summary: Update community profile (Authentication Required)
 *     security: [{BearerAuth: []}]
 *     responses: {200: {description: Profile updated}}
 */router.put('/auth/profile',authFlex,requireUser,ac.updateProfile);
/** @swagger
 * /api/community/posts:
 *   get:
 *     summary: List public community posts
 *     responses: {200: {description: Feed}}
 */router.get('/posts',authFlex,cc.getPosts);
/** @swagger
 * /api/community/posts:
 *   post:
 *     summary: Create a community post (Authentication Required)
 *     security: [{BearerAuth: []}]
 *     responses: {201: {description: Post created}}
 */router.post('/posts',authFlex,requireUser,cc.createPost);
/** @swagger
 * /api/community/posts/{id}:
 *   delete:
 *     summary: Delete a community post (Authentication Required)
 *     security: [{BearerAuth: []}]
 *     responses: {200: {description: Deleted}}
 */router.delete('/posts/:id',authFlex,requireUser,cc.deletePost);
/** @swagger
 * /api/community/posts/{id}/like:
 *   post:
 *     summary: Toggle a post like (Authentication Required)
 *     security: [{BearerAuth: []}]
 */router.post('/posts/:id/like',authFlex,requireUser,cc.likePost);
/** @swagger
 * /api/community/posts/{id}/report:
 *   post:
 *     summary: Report a community post (Authentication Required)
 *     security: [{BearerAuth: []}]
 */router.post('/posts/:id/report',authFlex,requireUser,cc.reportPost);
/** @swagger
 * /api/community/users/{id}/posts:
 *   get:
 *     summary: List user posts (Authentication Required)
 *     security: [{BearerAuth: []}]
 */router.get('/users/:id/posts',authFlex,requireUser,cc.getUserPosts);
/** @swagger
 * /api/community/admin/reports:
 *   get:
 *     summary: List reported posts (Authentication Required)
 *     security: [{BearerAuth: []}]
 */router.get('/admin/reports',authFlex,requireUser,adminOnly,cc.getReportedPosts);
/** @swagger
 * /api/community/admin/posts/{id}/moderate:
 *   put:
 *     summary: Moderate a reported post (Authentication Required)
 *     security: [{BearerAuth: []}]
 */router.put('/admin/posts/:id/moderate',authFlex,requireUser,adminOnly,cc.moderatePost);
module.exports=router;
