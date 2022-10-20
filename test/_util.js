import assert from 'node:assert'
import fs from 'node:fs'
import stream from 'node:stream'
import { promisify } from 'node:util'

import hasha from 'hasha'
import _onFinished from 'on-finished'

const onFinished = promisify(_onFinished)

const files = new Map([
  ['empty', {
    clientReportedMimeType: 'application/octet-stream',
    detectedFileExtension: '',
    detectedMimeType: null,
    extension: '.dat',
    hash: 'd41d8cd98f00b204e9800998ecf8427e',
    size: 0
  }],
  ['large', {
    clientReportedMimeType: 'application/octet-stream',
    detectedFileExtension: '',
    detectedMimeType: null,
    extension: '',
    hash: 'd5554977e0b856fa5ad94fff283616fb',
    size: 2413677
  }],
  ['medium', {
    clientReportedMimeType: 'application/octet-stream',
    detectedFileExtension: '.gif',
    detectedMimeType: 'image/gif',
    extension: '.fake',
    hash: 'a88025890e6a2cd15edb83e0aecdddd1',
    size: 21057
  }],
  ['small', {
    clientReportedMimeType: 'application/octet-stream',
    detectedFileExtension: '',
    detectedMimeType: null,
    extension: '.dat',
    hash: '3817334ffb4cf3fcaa16c4258d888131',
    size: 1778
  }],
  ['tiny', {
    clientReportedMimeType: 'audio/midi',
    detectedFileExtension: '.mid',
    detectedMimeType: 'audio/midi',
    extension: '.mid',
    hash: 'c187e1be438cb952bb8a0e8142f4a6d1',
    size: 248
  }]
])

export function file (name) {
  return fs.createReadStream(new URL(`files/${name}${files.get(name).extension}`, import.meta.url))
}

export function knownFileLength (name) {
  return files.get(name).size
}

export async function assertFile (file, fieldName, fileName, { disableDetection } = { disableDetection: false }) {
  if (!files.has(fileName)) {
    throw new Error(`No file named "${fileName}"`)
  }

  const expected = files.get(fileName)

  assert.strictEqual(file.fieldName, fieldName)
  assert.strictEqual(file.originalName, fileName + expected.extension)
  assert.strictEqual(file.size, expected.size)

  assert.strictEqual(file.clientReportedMimeType, expected.clientReportedMimeType)
  assert.strictEqual(file.clientReportedFileExtension, expected.extension)

  assert.strictEqual(file.detectedMimeType, disableDetection ? null : expected.detectedMimeType)
  assert.strictEqual(file.detectedFileExtension, disableDetection ? '' : expected.detectedFileExtension)

  const hash = await hasha.fromStream(file.stream, { algorithm: 'md5' })

  assert.strictEqual(hash, expected.hash)
}

export async function assertFiles (files) {
  await Promise.all(files.map((args) => assertFile(args[0], args[1], args[2])))
}

function getLength (form) {
  return promisify(form.getLength).call(form)
}

export async function submitForm (multer, form) {
  const length = await getLength(form)
  const req = new stream.PassThrough()

  req.complete = false
  form.once('end', () => { req.complete = true })

  form.pipe(req)
  req.headers = {
    'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
    'content-length': length
  }

  await promisify(multer)(req, null)
  await onFinished(req)

  return req
}
