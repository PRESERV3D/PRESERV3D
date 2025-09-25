import Tesseract from 'tesseract.js'
import axios from 'axios'

// Batch OCR processing
async function processBatchWithOCR(images, options = {}) {
  try {
    const {
      minPages = 3,
      maxCharacters = 5000,
      language = 'eng',
      maxConcurrent = 2,
      signal = null,
    } = options

    console.log(`Starting batch OCR: targeting ${minPages} pages or ${maxCharacters} characters`)

    let totalText = ''
    let processedPages = 0
    let successfulPages = 0
    const results = []

    // Process images in batches
    for (let i = 0; i < images.length; i += maxConcurrent) {
      // Check for cancellation
      if (signal && signal.aborted) {
        console.log('OCR batch processing aborted via signal')
        return { success: false, canceled: true, message: 'OCR processing aborted' }
      }

      // Check if we've met our targets
      if (successfulPages >= minPages && totalText.length >= maxCharacters) {
        console.log(`Target reached: ${successfulPages} pages, ${totalText.length} characters`)
        break
      }

      const batch = images.slice(i, i + maxConcurrent)

      // Process batch concurrently
      const batchPromises = batch.map(async (imageData, batchIndex) => {
        const pageIndex = i + batchIndex
        try {
          console.log(`Processing page ${pageIndex + 1}/${images.length}...`)

          // Check cancellation before processing each image
          if (signal && signal.aborted) {
            throw new Error('Aborted via signal')
          }

          const result = await processImageFast(
            imageData.base64,
            imageData.fileName || `page_${pageIndex + 1}`,
            { language, signal },
          )

          return { pageIndex, result, success: !!result }
        } catch (error) {
          if (error.message.includes('Aborted')) {
            console.log(`Page ${pageIndex + 1} processing cancelled`)
            return { pageIndex, result: null, success: false, cancelled: true }
          }

          console.warn(`Failed to process page ${pageIndex + 1}:`, error.message)
          return { pageIndex, result: null, success: false }
        }
      })

      const batchResults = await Promise.all(batchPromises)

      // Check if any page was cancelled
      const cancelledResult = batchResults.find((r) => r.cancelled)
      if (cancelledResult) {
        console.log('OCR processing cancelled during batch')
        return { success: false, canceled: true, message: 'OCR processing cancelled' }
      }

      // Collect results and update counters
      for (const { pageIndex, result, success } of batchResults) {
        processedPages++

        if (success && result) {
          successfulPages++
          totalText += result.text + '\n\n'
          results.push({
            pageNumber: pageIndex + 1,
            fileName: result.fileName,
            text: result.text,
            confidence: result.confidence,
            characterCount: result.text.length,
          })

          console.log(
            `Page ${pageIndex + 1}: ${result.text.length} chars, confidence: ${result.confidence}%`,
          )
        } else {
          console.log(`Page ${pageIndex + 1}: Failed`)
        }

        // Early exit check after each successful page
        if (successfulPages >= minPages && totalText.length >= maxCharacters) {
          console.log(`Early completion: ${successfulPages} pages, ${totalText.length} characters`)
          break
        }
      }

      // Progress update
      console.log(
        `Progress: ${successfulPages}/${minPages} pages, ${totalText.length}/${maxCharacters} characters`,
      )
    }

    // Cancellation check before NLP
    if (signal && signal.aborted) {
      console.log('OCR aborted before NLP processing')
      return { success: false, canceled: true, message: 'OCR processing aborted' }
    }

    // Final summary
    console.log(`\nOCR Batch Complete:`)
    console.log(`- Processed: ${processedPages} pages`)
    console.log(`- Successful: ${successfulPages} pages`)
    console.log(`- Total text: ${totalText.length} characters`)
    console.log(`- Success rate: ${Math.round((successfulPages / processedPages) * 100)}%`)

    // Check if file is blank
    if (totalText.trim().length === 0) {
      return {
        success: false,
        error: 'Document appears to be blank - no text could be extracted',
        ocrResults: results,
        summary: {
          pagesProcessed: processedPages,
          pagesSuccessful: successfulPages,
          totalCharacters: totalText.length,
        },
      }
    }

    // Send results to NLP service
    if (successfulPages >= 1) {
      const nlpForm = new FormData()
      nlpForm.append('filename', `batch_${results.length}_pages`)
      nlpForm.append('raw_text', totalText.trim())
      nlpForm.append('ocr_confidence', calculateAverageConfidence(results).toString())
      nlpForm.append(
        'processing_metadata',
        JSON.stringify({
          ocrEngine: 'Tesseract',
          pagesProcessed: processedPages,
          pagesSuccessful: successfulPages,
          totalCharacters: totalText.length,
          averageConfidence: calculateAverageConfidence(results),
          timestamp: new Date().toISOString(),
          stoppingReason: getStoppingReason(
            successfulPages,
            totalText.length,
            minPages,
            maxCharacters,
          ),
        }),
      )

      try {
        const nlpResponse = await axios.post('http://localhost:8000/process-text', nlpForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          signal: signal,
        })

        return {
          success: true,
          nlpResponse: nlpResponse.data,
          ocrResults: results,
          summary: {
            pagesProcessed: processedPages,
            pagesSuccessful: successfulPages,
            totalCharacters: totalText.length,
            averageConfidence: calculateAverageConfidence(results),
          },
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          console.log('NLP processing cancelled')
          return { success: false, canceled: true, message: 'NLP processing cancelled' }
        }
        throw error
      }
    } else {
      return {
        success: false,
        error: 'No pages could be processed successfully',
        ocrResults: results,
        summary: {
          pagesProcessed: processedPages,
          pagesSuccessful: successfulPages,
          totalCharacters: totalText.length,
        },
      }
    }
  } catch (error) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('OCR batch processing cancelled due to abort signal')
      return { success: false, canceled: true, message: 'OCR processing cancelled' }
    }

    console.error('Batch OCR Processing Error:', error.message)
    throw new Error(`Batch OCR failed: ${error.message}`)
  }
}

// Fast single image processing
async function processImageFast(base64Image, fileName, options = {}) {
  try {
    const defaultOptions = {
      language: 'eng',
      tessedit_pageseg_mode: 6,
      tessedit_ocr_engine_mode: 2,
    }

    const { signal, ...ocrOptions } = { ...defaultOptions, ...options }

    // Check for cancellation before starting
    if (signal && signal.aborted) {
      throw new Error('Aborted via signal')
    }

    const result = await Tesseract.recognize(
      `data:image/png;base64,${base64Image}`,
      ocrOptions.language,
      {
        logger: (m) => {
          // Check for cancellation during processing
          if (signal && signal.aborted) {
            throw new Error('Aborted via signal')
          }

          if (m.status === 'recognizing text' && m.progress % 0.2 === 0) {
            console.log(`${fileName}: ${Math.round(m.progress * 100)}%`)
          }
        },
        tessedit_pageseg_mode: ocrOptions.tessedit_pageseg_mode,
        tessedit_ocr_engine_mode: ocrOptions.tessedit_ocr_engine_mode,
      },
    )

    const confidence = result.data.confidence || 0
    const text = result.data.text || ''

    if (!text) {
      console.warn(`No text extracted from ${fileName}`)
      return null
    }

    const cleanedText = fastPostProcessText(text)

    return {
      fileName,
      text: cleanedText,
      confidence: Math.round(confidence),
      characterCount: cleanedText.length,
    }
  } catch (error) {
    if (error.message.includes('Aborted')) {
      console.log(`OCR cancelled for ${fileName}`)
      throw error
    }

    console.error(`OCR failed for ${fileName}:`, error.message)
    return null
  }
}

// Minimal text cleanup for speed
function fastPostProcessText(text) {
  if (!text) return ''

  return (
    text
      .replace(/[|]/g, 'I')
      .replace(/\b[O0](\d)/g, '0$1')
      .replace(/\bth[e3]\b/gi, 'the')
      .replace(/\b[ao]nd\b/gi, 'and')

      // Clean whitespace
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim()
  )
}

function calculateAverageConfidence(results) {
  if (results.length === 0) return 0
  const total = results.reduce((sum, r) => sum + r.confidence, 0)
  return Math.round(total / results.length)
}

function getStoppingReason(pages, characters, minPages, maxCharacters) {
  if (pages >= minPages && characters >= maxCharacters) {
    return 'Both targets met'
  } else if (pages >= minPages) {
    return 'Minimum pages reached'
  } else if (characters >= maxCharacters) {
    return 'Minimum characters reached'
  } else {
    return 'All pages processed'
  }
}

function normalizeInputToBatch(input, fileName) {
  // Single base64 string
  if (typeof input === 'string') {
    return [{ base64: input, fileName: fileName || 'document.jpg' }]
  }

  // Already an array
  if (Array.isArray(input)) {
    return input.map((item, index) => ({
      base64: item.base64 || item,
      fileName: item.fileName || item.name || `page_${index + 1}.jpg`,
    }))
  }

  // Single object
  if (input && typeof input === 'object') {
    return [
      {
        base64: input.base64 || input.data,
        fileName: input.fileName || input.name || 'document.jpg',
      },
    ]
  }

  throw new Error('Invalid input format for OCR processing')
}

// Main function
export async function processImageWithOCR(input, fileNameOrOptions = {}, legacyOptions = {}) {
  try {
    let images, options

    if (typeof input === 'string' && typeof fileNameOrOptions === 'string') {
      images = normalizeInputToBatch(input, fileNameOrOptions)
      options = legacyOptions
    } else {
      images = normalizeInputToBatch(input)
      options = typeof fileNameOrOptions === 'object' ? fileNameOrOptions : {}
    }

    console.log(`OCR Input processed: ${images.length} image(s) to process`)

    // For single image, use fast single processing
    if (images.length === 1) {
      console.log(`Processing single image: ${images[0].fileName}`)
      const result = await processImageFast(images[0].base64, images[0].fileName, options)

      if (!result) {
        return {
          success: false,
          error: 'Failed to process image with OCR',
        }
      }

      // Check if the document is blank
      if (result.text.trim().length === 0) {
        return {
          success: false,
          error: 'Document appears to be blank - no text could be extracted',
          ocrResult: result,
        }
      }

      const nlpForm = new FormData()
      nlpForm.append('filename', result.fileName)
      nlpForm.append('raw_text', result.text)
      nlpForm.append('ocr_confidence', result.confidence.toString())

      return await axios.post('http://localhost:8000/process-text', nlpForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
        signal: options.signal,
      })
    }

    // For multiple images, use batch processing
    return await processBatchWithOCR(images, options)
  } catch (error) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('processImageWithOCR cancelled')
      return { success: false, canceled: true, message: 'OCR processing cancelled' }
    }

    console.error('processImageWithOCR Error:', error.message)
    throw new Error(`OCR processing failed: ${error.message}`)
  }
}

// Process OCR pages from NLP service response
export async function processOCRPages(ocrResponse, options = {}) {
  try {
    if (!ocrResponse || ocrResponse.status !== 'ocr_required' || !ocrResponse.pages) {
      throw new Error('Invalid OCR response format')
    }

    console.log(`Processing ${ocrResponse.pages.length} pages from NLP service`)

    // Convert NLP response format
    const images = ocrResponse.pages.map((page) => ({
      base64: page.image_base64,
      fileName: `${ocrResponse.filename || 'document'}_page${page.page_number}.png`,
    }))

    const result = await processBatchWithOCR(images, {
      minPages: 3,
      maxCharacters: 5000,
      maxConcurrent: 2,
      ...options,
    })

    if (result.success) {
      console.log(
        `OCR completed: ${result.summary.pagesSuccessful} pages, ${result.summary.totalCharacters} characters`,
      )
      return result
    } else if (result.canceled) {
      console.log('OCR processing was cancelled')
      return result
    } else {
      throw new Error(`${result.error}`)
    }
  } catch (error) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('processOCRPages cancelled')
      return { success: false, canceled: true, message: 'OCR page processing cancelled' }
    }

    console.error('processOCRPages Error:', error.message)
    throw new Error(`OCR page processing failed: ${error.message}`)
  }
}
