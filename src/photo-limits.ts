export const MAX_PHOTOS = 6
export const MAX_PHOTO_BYTES = 512 * 1024
export const MAX_PHOTO_TOTAL_BYTES = MAX_PHOTOS * MAX_PHOTO_BYTES
export const PHOTO_EDGE = 1600
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
