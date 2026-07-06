import type { MaterialItem, MaterialCategory } from '../types'

export type ParseProgress = {
  stage: 'reading' | 'extracting' | 'done'
  percent: number
  message: string
}

export type ParseResult = {
  text: string
  words: number
  pages?: number
}

const categoryFromFileName: (name: string) => MaterialCategory = (name) => {
  const lower = name.toLowerCase()
  if (lower.includes('真题') || lower.includes('exam') || lower.endsWith('.pdf')) return 'exam'
  if (lower.includes('ppt') || lower.includes('课件') || lower.includes('讲义')) return 'ppt'
  if (lower.includes('目录') || lower.includes('catalog') || lower.includes('大纲')) return 'catalog'
  if (lower.includes('范围') || lower.includes('scope')) return 'scope'
  if (lower.includes('笔记') || lower.includes('note')) return 'notes'
  if (lower.includes('习题') || lower.includes('练习') || lower.includes('exercise')) return 'exercises'
  return 'notes'
}

const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })

const readAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'utf-8')
  })

const extractWordsFromText = (text: string): string[] => {
  const cleaned = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5\s]/gu, ' ')
    .trim()
  return cleaned.split(/\s+/).filter((word) => word.length > 1)
}

const extractFromTextFile = async (file: File): Promise<ParseResult> => {
  const text = await readAsText(file)
  const words = extractWordsFromText(text)
  return { text, words: words.length }
}

const extractFromPdf = async (file: File): Promise<ParseResult> => {
  const buffer = await readAsArrayBuffer(file)
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const raw = decoder.decode(bytes)
  const textMatches = raw.match(/\(([^)]{2,})\)/g) ?? []
  const text = textMatches
    .map((match) => match.slice(1, -1))
    .filter((line) => /[\u4e00-\u9fa5a-zA-Z]/.test(line))
    .join(' ')
  const words = extractWordsFromText(text)
  const pageMatches = raw.match(/\/Type\s*\/Page[^s]/g)
  return { text, words: words.length, pages: pageMatches?.length ?? 0 }
}

const extractFromBinary = async (file: File): Promise<ParseResult> => {
  const buffer = await readAsArrayBuffer(file)
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const raw = decoder.decode(bytes)
  const chineseChunks = raw.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  const text = chineseChunks.join(' ')
  const words = extractWordsFromText(text)
  return { text, words: words.length }
}

const extractFromImage = async (_file: File): Promise<ParseResult> => {
  return { text: '', words: 0 }
}

export const parseFile = async (
  file: File,
  onProgress?: (progress: ParseProgress) => void,
): Promise<ParseResult> => {
  onProgress?.({ stage: 'reading', percent: 10, message: `读取 ${file.name}…` })
  await new Promise((resolve) => setTimeout(resolve, 120))

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  onProgress?.({ stage: 'extracting', percent: 55, message: '解析文件内容…' })

  let result: ParseResult
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    result = await extractFromTextFile(file)
  } else if (ext === 'pdf') {
    result = await extractFromPdf(file)
  } else if (ext === 'docx') {
    result = await extractFromBinary(file)
  } else if (ext === 'ppt' || ext === 'pptx') {
    result = await extractFromBinary(file)
  } else if (ext === 'doc') {
    result = await extractFromBinary(file)
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    result = await extractFromImage(file)
  } else {
    result = await extractFromBinary(file)
  }

  onProgress?.({ stage: 'done', percent: 100, message: '解析完成' })
  return result
}

export const detectCategory = (fileName: string): MaterialCategory => categoryFromFileName(fileName)

export const buildMaterialFromFile = (
  file: File,
  category?: MaterialCategory,
): MaterialItem => {
  const resolvedCategory = category ?? detectCategory(file.name)
  return {
    id: `${resolvedCategory}-${Date.now()}`,
    title: file.name,
    description: `已上传文件 · ${(file.size / 1024).toFixed(1)} KB`,
    format: (file.name.split('.').pop() ?? 'unknown').toUpperCase(),
    category: resolvedCategory,
    status: 'ready',
    fileName: file.name,
    uploadedAt: new Date().toISOString().slice(0, 10),
  }
}
