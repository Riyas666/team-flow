import { v2 as cloudinary } from 'cloudinary'

function getRequiredEnv(key: string): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`${key} is missing from environment variables.`)
  }

  return value
}

cloudinary.config({
  cloud_name: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  api_key: getRequiredEnv('CLOUDINARY_API_KEY'),
  api_secret: getRequiredEnv('CLOUDINARY_API_SECRET'),
})

export default cloudinary