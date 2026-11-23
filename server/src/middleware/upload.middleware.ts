import multer from 'multer'
import type { Request } from 'express'

const storage = multer.memoryStorage()

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error('Only JPG, PNG and WEBP images are allowed.'),
    )
  }

  callback(null, true)
}

const uploadProfilePicture = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

export default uploadProfilePicture