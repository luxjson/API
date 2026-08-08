const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const BlogPost = require('../models/BlogPost');
const sanitizeHtml = require('sanitize-html');
const { slugify } = require('../utils/helpers');


// Listar posts (público)
router.get('/posts', async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const offset = Math.max(
      Number.parseInt(req.query.offset, 10) || 0,
      0
    );

    const posts = await BlogPost.findAll({
      limit,
      offset,
      publishedOnly: true,
    });

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
});

// Buscar post por slug (público)
router.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findBySlug(req.params.slug);

    if (!post || !post.published) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    await BlogPost.incrementViews(req.params.slug);

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
});

// Estatísticas (protegido)
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const stats = await BlogPost.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Criar post (protegido)
router.post('/posts', authMiddleware, async (req, res, next) => {
  try {
    const { title, content, excerpt, cover_image, published = false } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Título e conteúdo são obrigatórios' });
    }
    const slug = slugify(title);
    const cleanContent = sanitizeHtml(content, {
      allowedTags: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'h4',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'a'
      ],
      allowedAttributes: {
        a: ['href', 'target', 'rel']
      },
      allowedSchemes: ['http', 'https', 'mailto']
    });

    const post = await BlogPost.create({
      title,
      slug,
      content: cleanContent,
      excerpt,
      cover_image,
      author_id: req.admin.id,
      published,
    });
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

router.get('/posts/id/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar post (protegido)
router.put('/posts/:id', authMiddleware, async (req, res, next) => {
  try {
    const { title, content, excerpt, cover_image, published } = req.body;
    const data = {};
    if (title) {
      data.title = title;
      data.slug = slugify(title);
    }
   if (content !== undefined) {
      data.content = sanitizeHtml(content, {
        allowedTags: [
          'p', 'br', 'strong', 'em', 'u', 's',
          'h1', 'h2', 'h3', 'h4',
          'ul', 'ol', 'li',
          'blockquote', 'code', 'pre', 'a'
        ],
        allowedAttributes: {
          a: ['href', 'target', 'rel']
        },
        allowedSchemes: ['http', 'https', 'mailto']
      });
    }
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (cover_image !== undefined) data.cover_image = cover_image;
    if (published !== undefined) data.published = published;

    const post = await BlogPost.update(req.params.id, data);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Deletar post (protegido)
router.delete('/posts/:id', authMiddleware, async (req, res, next) => {
  try {
    await BlogPost.delete(req.params.id);
    res.json({ success: true, message: 'Post deletado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;