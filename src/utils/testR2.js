import { getPresignedUrl, getR2Url } from 'src/boot/r2.js'
import { convertToWorkingUrl } from 'src/composables/useR2Url.js'

export async function testR2Url(key) {
  console.log('Testing R2 URL for key:', key)

  try {
    const presignedUrl = await getPresignedUrl(key)
    console.log('Presigned URL generated:', presignedUrl)

    // Test if URL is accessible
    const response = await fetch(presignedUrl, { method: 'HEAD' })
    if (response.ok) {
      console.log('URL is accessible!')
      console.log('   Status:', response.status)
      console.log('   Content-Type:', response.headers.get('content-type'))
    } else {
      console.error('URL returned error:', response.status)
    }

    return presignedUrl
  } catch (error) {
    console.error('Error generating URL:', error)
    throw error
  }
}

export async function testConvertUrl(storedUrl) {
  console.log('Testing URL conversion for:', storedUrl)

  try {
    const workingUrl = await convertToWorkingUrl(storedUrl)
    console.log('Converted to working URL:', workingUrl)

    // Test if URL is accessible
    const response = await fetch(workingUrl, { method: 'HEAD' })
    if (response.ok) {
      console.log('Converted URL is accessible!')
    } else {
      console.error('Converted URL returned error:', response.status)
    }

    return workingUrl
  } catch (error) {
    console.error('Error converting URL:', error)
    throw error
  }
}

export async function testGetR2Url(folder, fileName) {
  console.log(`Testing getR2Url for: ${folder}/${fileName}`)

  try {
    const url = await getR2Url(folder, fileName)
    console.log('Generated URL:', url)

    // Test if URL is accessible
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) {
      console.log('URL is accessible!')
    } else {
      console.error('URL returned error:', response.status)
    }

    return url
  } catch (error) {
    console.error('Error with getR2Url:', error)
    throw error
  }
}

export async function testAllArtifacts() {
  console.log('Testing all artifacts from database...')

  const { supabase } = await import('boot/supabase')
  const { data, error } = await supabase
    .from('artifacts_metadata')
    .select('id, file_name, file_url')
    .limit(5) // Test first 5

  if (error) {
    console.error('Error fetching artifacts:', error)
    return
  }

  console.log(`Found ${data.length} artifacts to test`)

  for (const artifact of data) {
    console.log(`\nTesting artifact: ${artifact.file_name}`)
    try {
      await testConvertUrl(artifact.file_url)
    } catch {
      console.error(`Failed for ${artifact.file_name}`)
    }
  }

  console.log('\nBatch test complete!')
}

export function checkR2Config() {
  console.log('Checking R2 Configuration...')
  console.log('VITE_R2_BUCKET_NAME:', import.meta.env.VITE_R2_BUCKET_NAME)
  console.log('VITE_R2_ENDPOINT:', import.meta.env.VITE_R2_ENDPOINT)
  console.log('VITE_R2_PUBLIC_URL:', import.meta.env.VITE_R2_PUBLIC_URL)
  console.log('VITE_R2_ACCESS_KEY_ID:', import.meta.env.VITE_R2_ACCESS_KEY_ID ? 'Set' : 'Missing')
  console.log(
    'VITE_R2_SECRET_ACCESS_KEY:',
    import.meta.env.VITE_R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
  )
}

// Make functions available in console
if (typeof window !== 'undefined') {
  window.testR2Url = testR2Url
  window.testConvertUrl = testConvertUrl
  window.testGetR2Url = testGetR2Url
  window.testAllArtifacts = testAllArtifacts
  window.checkR2Config = checkR2Config

  console.log('R2 test utilities loaded!')
  console.log('Available functions:')
  console.log('  - checkR2Config()')
  console.log('  - testR2Url("artifacts/file.glb")')
  console.log('  - testConvertUrl("https://pub-xxx.r2.dev/artifacts/file.glb")')
  console.log('  - testGetR2Url("artifacts", "file.glb")')
  console.log('  - testAllArtifacts()')
}
