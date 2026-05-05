/** Maps a raw DB row to the User API response shape (no password_hash). */
export function formatUser(row: any) {
  return {
    id:         row.id,
    name:       row.name,
    email:      row.email,
    phone:      row.phone,
    avatar_url: row.avatar_url ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}
