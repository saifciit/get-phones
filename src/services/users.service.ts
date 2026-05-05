import bcrypt from 'bcryptjs';
import { queryOne, execute } from '../config/db';
import { fileService } from './file.service';

function formatUser(row: any, baseUrl = '') {
  return {
    id:          row.id,
    name:        row.name,
    email:       row.email,
    phone:       row.phone,
    // Resolve avatar_path → serve URL; fall back to avatar_url for external URLs
    avatar_url:  row.avatar_path
                   ? fileService.serveUrl(row.avatar_path, baseUrl)
                   : (row.avatar_url ?? null),
    created_at:  row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export const usersService = {
  // ── Public profile ────────────────────────────────────────────────────────
  async getPublicProfile(id: string, baseUrl = '') {
    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 404, code: 'not_found' });

    const countRow = await queryOne<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM phone_ads WHERE user_id = ? AND is_active = 1',
      [id]
    );

    return {
      id:         user.id,
      name:       user.name,
      avatar_url: user.avatar_path
                    ? fileService.serveUrl(user.avatar_path, baseUrl)
                    : (user.avatar_url ?? null),
      created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
      ad_count:   countRow?.cnt || 0,
    };
  },

  // ── Update profile (name / phone) ─────────────────────────────────────────
  async updateProfile(userId: string, data: { name?: string; phone?: string }, baseUrl = '') {
    if (data.phone) {
      const conflict = await queryOne<any>(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [data.phone, userId]
      );
      if (conflict) throw Object.assign(new Error('This phone number is already in use.'), { status: 409, code: 'phone_taken' });
    }

    const fields: string[] = [];
    const values: any[]    = [];

    if (data.name  !== undefined) { fields.push('name = ?');  values.push(data.name.trim()); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(new Date());
      values.push(userId);
      await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

      // Sync seller_name on active ads if name changed
      if (data.name) {
        await execute(
          'UPDATE phone_ads SET seller_name = ?, updated_at = ? WHERE user_id = ? AND is_active = 1',
          [data.name.trim(), new Date(), userId]
        );
      }
    }

    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    return formatUser(user, baseUrl);
  },

  // ── Update avatar (upload file → store blob → save path on user) ──────────
  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
    baseUrl = ''
  ) {
    // Delete old avatar blob if one exists
    const existing = await queryOne<any>('SELECT avatar_path FROM users WHERE id = ?', [userId]);
    if (existing?.avatar_path) {
      await fileService.deleteByPath(existing.avatar_path).catch(() => { /* ignore if missing */ });
    }

    // Save new blob to files table
    const saved = await fileService.save({
      originalName: file.originalname,
      mimeType:     file.mimetype,
      size:         file.size,
      buffer:       file.buffer,
      module:       'users',
      uploadedBy:   userId,
    });

    // Store path on user row (avatar_path = e.g. "users/1714123456_avatar.jpg")
    await execute('UPDATE users SET avatar_path = ?, updated_at = ? WHERE id = ?', [saved.path, new Date(), userId]);

    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    return formatUser(user, baseUrl);
  },

  // ── Change password ───────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 404, code: 'not_found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw Object.assign(new Error('Current password is incorrect.'), { status: 400, code: 'invalid_credentials' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, userId]);
  },
};
