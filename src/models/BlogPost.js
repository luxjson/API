const { pool } = require('../config/database');

class BlogPost {
    static async findAll(options = {}) {
        const { limit = 10, offset = 0, publishedOnly = true } = options;
        let whereClause = publishedOnly ? 'WHERE published = true' : '';
        const result = await pool.query(
            `SELECT id, title, slug, excerpt, cover_image, author_id,
                    published, views, created_at, published_at
             FROM blog_posts
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    static async findBySlug(slug) {
        const result = await pool.query(
            `SELECT id, title, slug, content, excerpt, cover_image,
                    author_id, published, views, created_at, published_at
             FROM blog_posts WHERE slug = $1`,
            [slug]
        );
        return result.rows[0] || null;
    }

    static async create(data) {
        const { title, slug, content, excerpt, cover_image, author_id, published = false } = data;
        const result = await pool.query(
            `INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, author_id, published, published_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7,
                     CASE WHEN $7 = true THEN CURRENT_TIMESTAMP ELSE NULL END)
             RETURNING id, title, slug, created_at, published_at`,
            [title, slug, content, excerpt, cover_image, author_id, published]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { title, slug, content, excerpt, cover_image, published } = data;
        const result = await pool.query(
            `UPDATE blog_posts 
             SET title = COALESCE($1, title),
                 slug = COALESCE($2, slug),
                 content = COALESCE($3, content),
                 excerpt = COALESCE($4, excerpt),
                 cover_image = COALESCE($5, cover_image),
                 published = COALESCE($6, published),
                 published_at = CASE 
                     WHEN $6 = true AND published = false THEN CURRENT_TIMESTAMP 
                     ELSE published_at 
                 END
             WHERE id = $7
             RETURNING id, title, slug, published, published_at`,
            [title, slug, content, excerpt, cover_image, published, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
        return true;
    }

    static async incrementViews(slug) {
        await pool.query(
            'UPDATE blog_posts SET views = views + 1 WHERE slug = $1',
            [slug]
        );
    }

    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN published = true THEN 1 END) as published_count,
                COALESCE(SUM(views), 0) as total_views
            FROM blog_posts
        `);
        return {
            posts: parseInt(result.rows[0].total),
            published: parseInt(result.rows[0].published_count),
            views: parseInt(result.rows[0].total_views),
        };
    }
}

module.exports = BlogPost;