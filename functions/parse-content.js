/**
 * This outputs the data of all our collection types into a single JSON file.
 * The structure of this JSON object is:
 *
 * let structure = {
 *   [collectionTypeA]: [
 *     { ...collectionObj1 },
 *     { ...collectionObj2 },
 *     // etc.
 *   ],
 *   [collectionTypeB]: [
 *     { ...collectionObj1 },
 *     { ...collectionObj2 },
 *     // etc.
 *   ],
 *   [collectionTypeC]: [
 *     { ...collectionObj1 },
 *     { ...collectionObj2 },
 *     // etc.
 *   ],
 *   // etc.
 * };
*/

const fs = require('fs')
const path = require('path')
const _set = require('lodash/set')
const _mergeWith = require('lodash/mergeWith')
const _isArray = require('lodash/isArray')
const globCb = require('glob')
const util = require('util')

const glob = util.promisify(globCb)
const readFile = util.promisify(fs.readFile)
const matter = require('gray-matter')
const yaml = require('js-yaml')

const options = {
  contentDir: './content/',
  outputFile: './src/data.json'
}

/** get the collection type from the /content subfolder name */
const getCollectionType = filePath => {
  const pathParsed = path.parse(filePath)
  const objectKey = pathParsed.dir
    .replace(options.contentDir, '')
    .replace(/\//g, '.')
  return `${objectKey}`
}

/** given a file's path, return the file's name */
const getDocumentName = filePath => {
  const pathParsed = path.parse(filePath)
  return `${pathParsed.name}`
}

/** returns the extension of a filePath */
const getDocumentExt = filePath => {
  const pathParsed = path.parse(filePath)
  return `${pathParsed.ext}`
}

/**
 * Takes Markdown content that includes front-matters,
 * and return a JSON-string representation of it
 */
const parseMarkdown = data => {
  data = matter(data)
  data = { ...data, ...data.data }
  delete data.data
  return JSON.stringify(data)
}

/** Takes YAML content and return a JSON-string representation of it */
const parseYaml = data => {
  data = yaml.safeLoad(data, 'utf8') || {}
  return JSON.stringify(data)
}

/**
 * Creates a JSON object, documenData, with the content at the given filePath.
 * Returns an object like this, { posts: [documentData] }, but with "posts" replaced
 * by the collection type of the file (e.g "page", "settings", etc.)
 */
const getFileContents = filePath => {
  return readFile(filePath, 'utf8').then(data => {
    if (getDocumentExt(filePath) === '.md') {
      data = parseMarkdown(data)
    }
    if (['.yaml', '.yml'].includes(getDocumentExt(filePath))) {
      data = parseYaml(data)
    }
    let documentData = JSON.parse(data)
    documentData.name = getDocumentName(filePath)
    documentData.body = documentData.body || documentData.content
    let obj = {}
    _set(obj, getCollectionType(filePath), [documentData])
    console.log(`✨  Processed ${filePath}`)
    return obj
  })
}

/** return a Promise that is fulfilled when all paths go through getFileContents() */
const readFiles = async paths => Promise.all(paths.map(getFileContents))

/** merge everything in the /content folder into a single JSON object */
const combineJSON = async () => {
  // mergeCustomiser concats array items
  const mergeCustomiser = (objValue, srcValue) =>
    _isArray(objValue) ? objValue.concat(srcValue) : objValue
  console.log(`✨  Reading JSON files in ${options.contentDir}`)
  const paths = await glob(`${options.contentDir}/**/**.+(json|md|yaml|yml)`)
  const results = await readFiles(paths)
  const data = _mergeWith({}, ...results, mergeCustomiser)
  return JSON.stringify(data, null, 2)
}

/** output our JSON of data to options.outputFile */
const writeJSON = async () => {
  const json = await combineJSON()
  fs.writeFileSync(options.outputFile, json)
  console.log(`✅  Data saved to ${options.outputFile}`)
  process.exit()
}

writeJSON()
