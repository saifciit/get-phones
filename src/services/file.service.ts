import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../config/db';
import env from '../config/env';

export interface UploadedFileInput {
  originalName: string;
  mimeType:     string;
  size:         number;
  buffer:       Buffer;
  module:       string;    // e.g. "users", "ads"
  uploadedBy?:  string;    // user id
}

export interface FileRow {
  id:            string;
  original_name: string;
  mime_type:     string;
  size:          number;
  path:          string;
  data:          Buffer;
  uploaded_by:   string | null;
  created_at:    string;
}

export const fileService = {
  /**
   * Save a file buffer into the DB.
   * path format: {module}/{timestamp}_{sanitisedOriginalName}
   * e.g.  users/1714123456789_avatar.jpg
   *        ads/1714123456789_photo1.png
   */
  async save(input: UploadedFileInput): Promise<FileRow> {
    const sanitised = input.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path      = `${input.module}/${Date.now()}_${sanitised}`;
    const id        = uuidv4();

    await execute(
      `INSERT INTO files (id, original_name, mime_type, size, path, data, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.originalName, input.mimeType, input.size, path, input.buffer, input.uploadedBy ?? null, new Date()]
    );

    const file = await queryOne<FileRow>('SELECT * FROM files WHERE id = ?', [id]);
    return file!;
  },

  /**
   * Retrieve a file by its path.
   * Used by the serve endpoint: GET /api/files/:module/:filename
   */
  async getByPath(path: string): Promise<FileRow> {
    const file = await queryOne<FileRow>('SELECT * FROM files WHERE path = ?', [path]);
    if (!file) throw Object.assign(new Error('File not found.'), { status: 404, code: 'not_found' });
    return file;
  },

  /**
   * Delete a file record by path (removes blob from DB).
   */
  async deleteByPath(path: string): Promise<void> {
    await execute('DELETE FROM files WHERE path = ?', [path]);
  },

  /** Build the public serve URL for a given path */
  serveUrl(path: string, baseUrl = ''): string {
    return `${baseUrl}/api/files/${path}`;
  },
};
