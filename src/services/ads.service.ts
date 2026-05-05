import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../config/db';
import { fileService } from './file.service';
import { isBrandAllowed, isCityAllowed, isConditionAllowed, normaliseBrand, normaliseCity } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListQuery {
  page?:      number;
  limit?:     number;
  q?:         string;
  brand?:     string;
  condition?: string;
  city?:      string;
  min_price?: number;
  max_price?: number;
  sort?:      'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

interface CreateAdInput {
  title:          string;
  brand:          string;
  model:          string;
  price:          number;
  condition:      string;
  city:           string;
  description:    string;
  contact_number: string;
  photoFiles:     Express.Multer.File[];  // uploaded via multipart
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateAdFields(data: Partial<CreateAdInput & { condition?: string }>, requireAll = true) {
  if (data.brand !== undefined && !isBrandAllowed(data.brand))
    throw Object.assign(new Error('Brand not in allowed list.'), { status: 422, code: 'invalid_brand' });
  if (data.city !== undefined && !isCityAllowed(data.city))
    throw Object.assign(new Error('City not in allowed list.'), { status: 422, code: 'invalid_city' });
  if (data.condition !== undefined && !isConditionAllowed(data.condition))
    throw Object.assign(new Error('Invalid condition value.'), { status: 422, code: 'invalid_condition' });
  if (requireAll && (!data.photoFiles || data.photoFiles.length === 0))
    throw Object.assign(new Error('At least 1 photo is required.'), { status: 422, code: 'validation_error' });
  if (data.photoFiles && data.photoFiles.length > 5)
    throw Object.assign(new Error('Maximum 5 photos allowed.'), { status: 422, code: 'too_many_photos' });
}

const SORT_MAP: Record<string, string> = {
  newest:     'created_at DESC',
  oldest:     'created_at ASC',
  price_asc:  'price ASC',
  price_desc: 'price DESC',
};

/** Resolve stored photo paths to serve URLs */
function resolvePhotos(row: any, baseUrl: string): string[] {
  const paths: string[] = typeof row.photo_urls === 'string'
    ? JSON.parse(row.photo_urls)
    : (row.photo_urls ?? []);
  return paths.map(p => fileService.serveUrl(p, baseUrl));
}

function formatAd(row: any, baseUrl = '') {
  return {
    id:             row.id,
    title:          row.title,
    brand:          row.brand,
    model:          row.model,
    price:          parseFloat(row.price),
    condition:      row.condition_val,
    city:           row.city,
    description:    row.description,
    contact_number: row.contact_number,
    photo_urls:     resolvePhotos(row, baseUrl),
    user_id:        row.user_id,
    seller_name:    row.seller_name,
    is_active:      Boolean(row.is_active),
    created_at:     row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at:     row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adsService = {
  // ── Browse / list ─────────────────────────────────────────────────────────
  async list(params: ListQuery, baseUrl = '') {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;
    const sort  = SORT_MAP[params.sort || 'newest'] || SORT_MAP.newest;

    const conditions: string[] = ['is_active = 1'];
    const values: any[]        = [];

    if (params.q) {
      conditions.push('MATCH(title, brand, model, city) AGAINST(? IN BOOLEAN MODE)');
      values.push(`${params.q}*`);
    }
    if (params.brand)     { conditions.push('LOWER(brand) = LOWER(?)');     values.push(params.brand); }
    if (params.condition) { conditions.push('condition_val = ?');            values.push(params.condition); }
    if (params.city)      { conditions.push('LOWER(city) = LOWER(?)');      values.push(params.city); }
    if (params.min_price !== undefined) { conditions.push('price >= ?');     values.push(params.min_price); }
    if (params.max_price !== undefined) { conditions.push('price <= ?');     values.push(params.max_price); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM phone_ads ${where}`, values
    );
    const total       = countRows[0]?.total || 0;
    const total_pages = Math.ceil(total / limit);

    const rows = await query(
      `SELECT * FROM phone_ads ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return {
      data: rows.map(r => formatAd(r, baseUrl)),
      meta: { page, limit, total, total_pages, has_more: page < total_pages },
    };
  },

  // ── Single ad ─────────────────────────────────────────────────────────────
  async getById(id: string, baseUrl = '') {
    const row = await queryOne<any>(
      'SELECT * FROM phone_ads WHERE id = ? AND is_active = 1', [id]
    );
    if (!row) throw Object.assign(new Error('Ad not found.'), { status: 404, code: 'not_found' });
    return formatAd(row, baseUrl);
  },

  // ── Create ────────────────────────────────────────────────────────────────
  async create(userId: string, sellerName: string, data: CreateAdInput, baseUrl = '') {
    validateAdFields(data, true);

    // Daily limit: max 20 ads per user per day
    const todayCount = await queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM phone_ads WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
      [userId]
    );
    if ((todayCount?.cnt || 0) >= 20) {
      throw Object.assign(new Error('Daily limit of 20 ads reached.'), { status: 429, code: 'rate_limit_exceeded' });
    }

    // Upload each photo to files table
    const photoPaths: string[] = [];
    for (const file of data.photoFiles) {
      const saved = await fileService.save({
        originalName: file.originalname,
        mimeType:     file.mimetype,
        size:         file.size,
        buffer:       file.buffer,
        module:       'ads',
        uploadedBy:   userId,
      });
      photoPaths.push(saved.path);
    }

    const id = uuidv4();
    const now = new Date();
    await execute(
      `INSERT INTO phone_ads
         (id, title, brand, model, price, condition_val, city, description,
          contact_number, photo_urls, user_id, seller_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title.trim(),
        normaliseBrand(data.brand),
        data.model.trim(),
        data.price,
        data.condition,
        normaliseCity(data.city),
        data.description.trim(),
        data.contact_number,
        JSON.stringify(photoPaths),   // store paths, not URLs
        userId,
        sellerName,
        now,
        now
      ]
    );

    const row = await queryOne<any>('SELECT * FROM phone_ads WHERE id = ?', [id]);
    return formatAd(row, baseUrl);
  },

  // ── Update ────────────────────────────────────────────────────────────────
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<CreateAdInput, 'photoFiles'>> & { newPhotoFiles?: Express.Multer.File[] },
    baseUrl = ''
  ) {
    const existing = await queryOne<any>('SELECT * FROM phone_ads WHERE id = ?', [id]);
    if (!existing) throw Object.assign(new Error('Ad not found.'), { status: 404, code: 'not_found' });
    if (existing.user_id !== userId) throw Object.assign(new Error('You are not allowed to edit this ad.'), { status: 403, code: 'forbidden' });

    if (data.brand)     validateAdFields({ brand: data.brand }, false);
    if (data.city)      validateAdFields({ city: data.city }, false);
    if (data.condition) validateAdFields({ condition: data.condition }, false);

    const fields: string[] = [];
    const values: any[]    = [];

    if (data.title !== undefined)          { fields.push('title = ?');          values.push(data.title.trim()); }
    if (data.brand !== undefined)          { fields.push('brand = ?');          values.push(normaliseBrand(data.brand)); }
    if (data.model !== undefined)          { fields.push('model = ?');          values.push(data.model.trim()); }
    if (data.price !== undefined)          { fields.push('price = ?');          values.push(data.price); }
    if (data.condition !== undefined)      { fields.push('condition_val = ?');  values.push(data.condition); }
    if (data.city !== undefined)           { fields.push('city = ?');           values.push(normaliseCity(data.city)); }
    if (data.description !== undefined)    { fields.push('description = ?');    values.push(data.description.trim()); }
    if (data.contact_number !== undefined) { fields.push('contact_number = ?'); values.push(data.contact_number); }

    // Replace photos if new ones uploaded
    if (data.newPhotoFiles && data.newPhotoFiles.length > 0) {
      if (data.newPhotoFiles.length > 5)
        throw Object.assign(new Error('Maximum 5 photos allowed.'), { status: 422, code: 'too_many_photos' });

      // Delete old blobs
      const oldPaths: string[] = typeof existing.photo_urls === 'string'
        ? JSON.parse(existing.photo_urls) : (existing.photo_urls ?? []);
      for (const p of oldPaths) {
        await fileService.deleteByPath(p).catch(() => { });
      }

      // Save new blobs
      const newPaths: string[] = [];
      for (const file of data.newPhotoFiles) {
        const saved = await fileService.save({
          originalName: file.originalname,
          mimeType:     file.mimetype,
          size:         file.size,
          buffer:       file.buffer,
          module:       'ads',
          uploadedBy:   userId,
        });
        newPaths.push(saved.path);
      }
      fields.push('photo_urls = ?');
      values.push(JSON.stringify(newPaths));
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(new Date());
      values.push(id);
      await execute(`UPDATE phone_ads SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const updated = await queryOne<any>('SELECT * FROM phone_ads WHERE id = ?', [id]);
    return formatAd(updated, baseUrl);
  },

  // ── Soft delete ───────────────────────────────────────────────────────────
  async softDelete(id: string, userId: string) {
    const existing = await queryOne<any>('SELECT id, user_id FROM phone_ads WHERE id = ?', [id]);
    if (!existing) throw Object.assign(new Error('Ad not found.'), { status: 404, code: 'not_found' });
    if (existing.user_id !== userId) throw Object.assign(new Error('You are not allowed to delete this ad.'), { status: 403, code: 'forbidden' });
    await execute('UPDATE phone_ads SET is_active = 0 WHERE id = ?', [id]);
  },

  // ── My ads ────────────────────────────────────────────────────────────────
  async myAds(userId: string, baseUrl = '') {
    const rows = await query<any>(
      'SELECT * FROM phone_ads WHERE user_id = ? ORDER BY created_at DESC', [userId]
    );
    return {
      data: rows.map(r => formatAd(r, baseUrl)),
      meta: { total: rows.length },
    };
  },
};
