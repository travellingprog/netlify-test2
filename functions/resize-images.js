/**
 * This makes sure all uploaded images files are resized to our desired sizes,
 * unless the imgix API is being used instead.
 */

const fs = require('fs')
const path = require('path')
const globCb = require('glob')
const util = require('util')
const sharp = require('sharp')

const glob = util.promisify(globCb)
const readFile = util.promisify(fs.readFile)

const { sizes, imgixUrl } = require('../src/util/getImageUrl')

const options = {
  inputDir: './public/images/uploads',
  outputDir: './public/images/uploads/resized',
  sizes,
  imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
}

/**
 * Resize the file buffer to a certain width size (unless this width surpasses
 * the file buffer) and save as outputFile
 */
const saveImage = ({ buffer, size, outputFile }) => {
  return new Promise((resolve, reject) => {
    sharp(buffer)
      .resize(size)
      .withoutEnlargement()
      .toFile(outputFile, err => {
        if (err) {
          return reject(err)
        } else {
          return resolve(console.log(`✅ Saved ${outputFile}`))
        }
      })
  })
}

/**
 * For each size desired, check if the given file has a matching resized image.
 * If not, create and save it.
 */
const saveImages = ({ buffer, filename }) => {
  console.log(`🎞  Processing ${filename}`)
  return Promise.all(
    options.sizes.map(async size => {
      const extname = path.extname(filename)
      const newFilename = `${path.basename(
        filename,
        extname
      )}.${size}${extname}`
      const outputFile = `${options.outputDir}/${newFilename}`
      const fileExists = await doesFileExist({ filename: outputFile })
      if (fileExists) return console.log(`↩️  ${outputFile} exists, skipping`)
      return saveImage({ buffer, size, outputFile })
    })
  )
}

/**
 * Returns a Promise that resolves with an array of objects
 * that contain the filename and the file buffer.
 */
const readFiles = files =>
  Promise.all(
    files.map(async filename => {
      const buffer = await readFile(filename)
      return { filename, buffer }
    })
  )

const doesFileExist = async ({ filename }) => {
  try {
    await readFile(filename)
    return true
  } catch (e) {
    return false
  }
}

/** reads all the images uploaded and creates + saves resized versions of them */
const resizeImages = async () => {
  console.log(`✨  Reading image files in ${options.inputDir}`)
  try {
    const fileGlob = `${options.inputDir}/**/**.+(${options.imageFormats.join(
      '|'
    )})`
    const files = await glob(fileGlob)
    const ignore = new RegExp(
      `(${options.sizes.join('|')}).(${options.imageFormats.join('|')})$`
    )
    const filesToResize = files.filter(filename => !filename.match(ignore))
    const imageFiles = await readFiles(filesToResize)
    Promise.all(imageFiles.map(saveImages))
      .then(() => process.exit())
      .catch(console.error)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

if (imgixUrl) {
  console.log(`📡  Using imgix to resize images: ${imgixUrl}`)
} else {
  resizeImages()
}
