export function generateNarration(model) {
  if (!model) return ''

  const lines = []
  const currentYear = new Date().getFullYear()
  const artifactYear = model.metadata?.date ? new Date(model.metadata.date).getFullYear() : null
  const isRecent = artifactYear && currentYear - artifactYear <= 3

  // Helper function to escape XML special characters
  const escapeXml = (text) => {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Helper function to add pronunciation corrections
  const fixPronunciation = (text) => {
    if (!text) return ''
    let result = escapeXml(text)

    // Acronyms - spell out letter by letter
    result = result.replace(/\bPUP\b/g, '<say-as interpret-as="characters">PUP</say-as>')
    result = result.replace(/\bUNESCO\b/g, '<say-as interpret-as="characters">UNESCO</say-as>')
    result = result.replace(/\bDOST\b/g, '<say-as interpret-as="characters">DOST</say-as>')
    result = result.replace(/\bUSA\b/g, '<say-as interpret-as="characters">USA</say-as>')
    result = result.replace(/\bPH\b/g, '<say-as interpret-as="characters">PH</say-as>')

    // Filipino name pronunciations
    result = result.replace(
      /\bNemesio\b/g,
      '<phoneme alphabet="ipa" ph="nɛˈmɛsjo">Nemesio</phoneme>',
    )
    result = result.replace(
      /\bPrudente\b/g,
      '<phoneme alphabet="ipa" ph="pɾuˈdɛnte">Prudente</phoneme>',
    )
    result = result.replace(
      /\bAurelia\b/g,
      '<phoneme alphabet="ipa" ph="aʊˈɾɛlja">Aurelia</phoneme>',
    )
    result = result.replace(/\bJose\b/g, '<phoneme alphabet="ipa" ph="hoˈse">Jose</phoneme>')
    result = result.replace(/\bRizal\b/g, '<phoneme alphabet="ipa" ph="ɾiˈsal">Rizal</phoneme>')
    result = result.replace(/\bPRESERV3D\b/g, '<say-as>PRESERVED</say-as>')

    // Common abbreviations and titles
    result = result.replace(/\bDr\.\s/g, '<sub alias="Doctor">Dr. </sub>')
    result = result.replace(/\bProf\.\s/g, '<sub alias="Professor">Prof. </sub>')
    result = result.replace(/\bSt\.\s/g, '<sub alias="Saint">St. </sub>')
    result = result.replace(/\bMr\.\s/g, '<sub alias="Mister">Mr. </sub>')
    result = result.replace(/\bMs\.\s/g, '<sub alias="Miss">Ms. </sub>')
    result = result.replace(/\bMrs\.\s/g, '<sub alias="Missus">Mrs. </sub>')

    // Years as dates for natural pronunciation
    result = result.replace(
      /\b(19|20)(\d{2})\b/g,
      (match) => `<say-as interpret-as="date" format="y">${match}</say-as>`,
    )

    // Ordinal numbers (1st, 2nd, 3rd, etc.)
    result = result.replace(
      /\b(\d+)(st|nd|rd|th)\b/gi,
      (match, num) => `<say-as interpret-as="ordinal">${num}</say-as>`,
    )

    // Measurements
    result = result.replace(
      /(\d+)\s*(cm|kg|m|mm|km|g|lb|ft|in)\b/gi,
      '<say-as interpret-as="unit">$1$2</say-as>',
    )

    // Add natural pauses after punctuation
    result = result.replace(/\.\s/g, '.<break time="400ms"/> ')
    result = result.replace(/,\s/g, ',<break time="250ms"/> ')
    result = result.replace(/;\s/g, ';<break time="350ms"/> ')

    return result
  }

  // Helper function to detect artifact type based on title and metadata
  const detectArtifactType = () => {
    const title = model.metadata?.title?.toLowerCase() || ''
    const summary = model.metadata?.summary?.toLowerCase() || ''
    const categories = model.metadata?.categories
      ? model.metadata.categories.map((cat) => cat.toLowerCase()).join(' ')
      : ''
    const combined = `${title} ${summary} ${categories}`

    if (
      /trophy|trophies|award|medal|plaque|plaques|recognition|certificate|citation/i.test(combined)
    ) {
      return 'award'
    }
    if (/sculpture|statue|bust|monument|memorial/i.test(combined)) {
      return 'sculpture'
    }
    if (/painting|portrait|artwork|canvas/i.test(combined)) {
      return 'artwork'
    }
    if (/artifact|relic|historical|antiquity/i.test(combined)) {
      return 'historical'
    }
    return 'academic' // default
  }

  const artifactType = detectArtifactType()

  // Vary opening statements based on artifact type
  const openings = {
    award: [
      (title, author) =>
        `Before you stands "${fixPronunciation(title)}", <emphasis level="strong">a distinguished honor</emphasis> bestowed upon ${fixPronunciation(author)}, celebrating their <emphasis level="moderate">outstanding achievements</emphasis> and exemplary contributions to excellence.`,
      (title, author) =>
        `This is "${fixPronunciation(title)}", <emphasis level="strong">a prestigious accolade</emphasis> awarded to ${fixPronunciation(author)}, recognizing their <emphasis level="moderate">remarkable accomplishments</emphasis> and dedication to their craft.`,
      (title, author) =>
        `We present "${fixPronunciation(title)}", <emphasis level="strong">a symbol of excellence</emphasis> granted to ${fixPronunciation(author)}, honoring their <emphasis level="moderate">extraordinary performance</emphasis> and lasting impact.`,
    ],
    sculpture: [
      (title, author) =>
        `Before us rises "${fixPronunciation(title)}", <emphasis level="moderate">a striking three-dimensional work</emphasis> created by ${fixPronunciation(author)}, whose artistic vision captures the essence of form and meaning.`,
      (title, author) =>
        `This sculpture, "${fixPronunciation(title)}", stands as <emphasis level="moderate">a testament to craftsmanship</emphasis> by ${fixPronunciation(author)}, whose hands shaped this enduring piece.`,
      (title, author) =>
        `We behold "${fixPronunciation(title)}", <emphasis level="moderate">a sculptural masterwork</emphasis> by ${fixPronunciation(author)}, embodying artistic expression in physical form.`,
    ],
    artwork: [
      (title, author) =>
        `Here hangs "${fixPronunciation(title)}", <emphasis level="moderate">a captivating visual narrative</emphasis> by artist ${fixPronunciation(author)}, whose creative vision brought this work to life.`,
      (title, author) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">an artistic expression</emphasis> crafted by ${fixPronunciation(author)}, capturing a moment, emotion, or idea through visual artistry.`,
      (title, author) =>
        `We present "${fixPronunciation(title)}", <emphasis level="moderate">a work of artistic merit</emphasis> by ${fixPronunciation(author)}, demonstrating the power of visual storytelling.`,
    ],
    historical: [
      (title, author) =>
        `Before us lies "${fixPronunciation(title)}", <emphasis level="moderate">a significant historical artifact</emphasis> associated with ${fixPronunciation(author)}, offering tangible connection to our shared past.`,
      (title, author) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">an authentic relic</emphasis> linked to ${fixPronunciation(author)}, preserving physical evidence of historical importance.`,
      (title, author) =>
        `We encounter "${fixPronunciation(title)}", <emphasis level="moderate">a piece of living history</emphasis> connected to ${fixPronunciation(author)}, bridging past and present through material culture.`,
    ],
    academic: [
      (title, author) =>
        `Before us stands "${fixPronunciation(title)}", <emphasis level="moderate">a remarkable testament</emphasis> to the contributions of ${fixPronunciation(author)}, whose legacy continues to inspire our academic community.`,
      (title, author) =>
        `We present "${fixPronunciation(title)}", <emphasis level="moderate">an extraordinary piece</emphasis> honoring ${fixPronunciation(author)}, whose name remains deeply woven into the fabric of our university's history.`,
      (title, author) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">a distinguished recognition</emphasis> celebrating the achievements of ${fixPronunciation(author)}, a figure whose impact resonates through our institution.`,
    ],
  }

  const titleOnlyOpenings = {
    award: [
      (title) =>
        `Here we see "${fixPronunciation(title)}", <emphasis level="strong">an esteemed recognition</emphasis> symbolizing achievement, dedication, and the pursuit of excellence.`,
      (title) =>
        `This is "${fixPronunciation(title)}", <emphasis level="strong">a prestigious honor</emphasis> representing outstanding performance and commitment to the highest standards.`,
      (title) =>
        `Before you stands "${fixPronunciation(title)}", <emphasis level="strong">a distinguished award</emphasis> commemorating exceptional accomplishment and meritorious service.`,
    ],
    sculpture: [
      (title) =>
        `Here rises "${fixPronunciation(title)}", <emphasis level="moderate">a compelling sculptural form</emphasis> that invites contemplation of shape, space, and artistic intent.`,
      (title) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">a three-dimensional masterwork</emphasis> demonstrating the sculptor's vision and technical mastery.`,
      (title) =>
        `We behold "${fixPronunciation(title)}", <emphasis level="moderate">a sculptural composition</emphasis> that speaks through form, texture, and presence.`,
    ],
    artwork: [
      (title) =>
        `Here hangs "${fixPronunciation(title)}", <emphasis level="moderate">a visual composition</emphasis> that invites viewers to explore color, form, and artistic expression.`,
      (title) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">an artistic creation</emphasis> demonstrating creative vision and technical skill.`,
      (title) =>
        `We present "${fixPronunciation(title)}", <emphasis level="moderate">a work of visual art</emphasis> that captures imagination and communicates through imagery.`,
    ],
    historical: [
      (title) =>
        `Here lies "${fixPronunciation(title)}", <emphasis level="moderate">a historical object</emphasis> bearing witness to events, people, and moments that shaped our collective story.`,
      (title) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">an artifact of significance</emphasis> connecting us materially to the chronicles of our past.`,
      (title) =>
        `We encounter "${fixPronunciation(title)}", <emphasis level="moderate">a tangible piece of history</emphasis> preserving memory through physical form.`,
    ],
    academic: [
      (title) =>
        `Here we encounter "${fixPronunciation(title)}", <emphasis level="moderate">a significant entry</emphasis> in our collection that captures the milestones and stories shaping our shared heritage.`,
      (title) =>
        `This is "${fixPronunciation(title)}", <emphasis level="moderate">a treasured piece</emphasis> representing the rich tapestry of achievements that define our academic community.`,
      (title) =>
        `We present "${fixPronunciation(title)}", <emphasis level="moderate">a remarkable artifact</emphasis> that embodies the spirit and accomplishments of our institution.`,
    ],
  }

  const authorOnlyOpenings = {
    award: [
      (author) =>
        `This distinguished honor celebrates ${fixPronunciation(author)}, <emphasis level="strong">a recipient of excellence</emphasis> whose achievements merit this prestigious recognition.`,
      (author) =>
        `This accolade pays tribute to ${fixPronunciation(author)}, <emphasis level="strong">an exemplary individual</emphasis> whose contributions earned this meaningful distinction.`,
    ],
    sculpture: [
      (author) =>
        `This sculptural work honors ${fixPronunciation(author)}, <emphasis level="moderate">a skilled artisan</emphasis> whose creative hands shaped this three-dimensional expression.`,
      (author) =>
        `This piece celebrates ${fixPronunciation(author)}, <emphasis level="moderate">a sculptor of note</emphasis> whose artistic vision manifests in physical form.`,
    ],
    artwork: [
      (author) =>
        `This artwork showcases ${fixPronunciation(author)}, <emphasis level="moderate">a talented artist</emphasis> whose creative expression enriches our visual landscape.`,
      (author) =>
        `This piece features the work of ${fixPronunciation(author)}, <emphasis level="moderate">an accomplished creator</emphasis> whose artistic sensibility is evident in every detail.`,
    ],
    historical: [
      (author) =>
        `This artifact is associated with ${fixPronunciation(author)}, <emphasis level="moderate">a significant historical figure</emphasis> whose legacy lives on through this tangible remnant.`,
      (author) =>
        `This piece connects us to ${fixPronunciation(author)}, <emphasis level="moderate">an important personage</emphasis> in our historical narrative.`,
    ],
    academic: [
      (author) =>
        `This distinguished piece honors ${fixPronunciation(author)}, <emphasis level="moderate">a celebrated figure</emphasis> whose contributions continue to echo throughout our university's halls.`,
      (author) =>
        `This artifact pays tribute to ${fixPronunciation(author)}, <emphasis level="moderate">an influential presence</emphasis> in our institution's storied past.`,
    ],
  }

  // Title + Author
  if (model.metadata?.title && model.metadata?.author) {
    const typeOpenings = openings[artifactType] || openings.academic
    const randomOpening = typeOpenings[Math.floor(Math.random() * typeOpenings.length)]
    lines.push(randomOpening(model.metadata.title, model.metadata.author))
  } else if (model.metadata?.title) {
    const typeOpenings = titleOnlyOpenings[artifactType] || titleOnlyOpenings.academic
    const randomOpening = typeOpenings[Math.floor(Math.random() * typeOpenings.length)]
    lines.push(randomOpening(model.metadata.title))
  } else if (model.metadata?.author) {
    const typeOpenings = authorOnlyOpenings[artifactType] || authorOnlyOpenings.academic
    const randomOpening = typeOpenings[Math.floor(Math.random() * typeOpenings.length)]
    lines.push(randomOpening(model.metadata.author))
  } else {
    const genericOpenings = [
      `This piece forms part of our collection, <emphasis level="moderate">preserving the stories and achievements</emphasis> that make up our shared history.`,
      `This artifact resides in our archives, <emphasis level="moderate">representing cultural significance</emphasis> and contributing to our understanding of the past.`,
      `Here stands an item of interest, <emphasis level="moderate">adding depth and context</emphasis> to our institutional narrative.`,
    ]
    lines.push(genericOpenings[Math.floor(Math.random() * genericOpenings.length)])
  }

  // Date context with variation
  if (artifactYear) {
    if (isRecent) {
      const recentPhrases = [
        `<prosody rate="95%">Presented in <say-as interpret-as="date" format="y">${artifactYear}</say-as>, this is among our <emphasis level="moderate">most recent additions</emphasis>, demonstrating how creativity and distinguished service continue to flourish within our academic community.</prosody>`,
        `<prosody rate="95%">Dating to <say-as interpret-as="date" format="y">${artifactYear}</say-as>, it represents <emphasis level="moderate">contemporary excellence</emphasis>, showing that our tradition of recognition and achievement remains vibrant today.</prosody>`,
        `<prosody rate="95%">Created in <say-as interpret-as="date" format="y">${artifactYear}</say-as>, this recent piece reflects <emphasis level="moderate">the ongoing legacy</emphasis> of innovation and accomplishment that defines our institution.</prosody>`,
      ]
      lines.push(recentPhrases[Math.floor(Math.random() * recentPhrases.length)])
    } else {
      const historicalPhrases = [
        `<prosody rate="95%">Dating back to <say-as interpret-as="date" format="y">${artifactYear}</say-as>, it connects us to <emphasis level="moderate">a pivotal era</emphasis> that helped shape our institution's identity and enduring traditions.</prosody>`,
        `<prosody rate="95%">Originating from <say-as interpret-as="date" format="y">${artifactYear}</say-as>, this piece bridges us to <emphasis level="moderate">a formative period</emphasis> in our university's distinguished history.</prosody>`,
        `<prosody rate="95%">From the year <say-as interpret-as="date" format="y">${artifactYear}</say-as>, it stands as <emphasis level="moderate">a window into the past</emphasis>, revealing the foundations upon which our present achievements are built.</prosody>`,
      ]
      lines.push(historicalPhrases[Math.floor(Math.random() * historicalPhrases.length)])
    }
  }

  // Summary with emphasis
  if (model.metadata?.summary) {
    const summaryIntros = [
      `<prosody pitch="+5%">It highlights ${fixPronunciation(model.metadata.summary)}, <emphasis level="moderate">preserving a vital chapter</emphasis> of history that continues to inspire all who encounter it.</prosody>`,
      `<prosody pitch="+5%">This piece commemorates ${fixPronunciation(model.metadata.summary)}, <emphasis level="moderate">safeguarding an important legacy</emphasis> for generations to come.</prosody>`,
      `<prosody pitch="+5%">It celebrates ${fixPronunciation(model.metadata.summary)}, <emphasis level="moderate">ensuring this remarkable story</emphasis> endures in our collective memory.</prosody>`,
    ]
    lines.push(summaryIntros[Math.floor(Math.random() * summaryIntros.length)])
  }

  // Donor + Date received with variation
  if (model.donated_by && model.date_received) {
    const year = new Date(model.date_received).getFullYear()
    if (model.donated_by !== '[Donor/Lender Name]') {
      const donorPhrases = [
        `<prosody rate="95%">It was <emphasis level="moderate">graciously entrusted</emphasis> to our collection by ${fixPronunciation(model.donated_by)} in <say-as interpret-as="date" format="y">${year}</say-as>, ensuring that future generations may witness and learn from this enduring legacy.</prosody>`,
        `<prosody rate="95%">In <say-as interpret-as="date" format="y">${year}</say-as>, ${fixPronunciation(model.donated_by)} <emphasis level="moderate">generously placed</emphasis> this piece in our care, preserving it for the benefit of all who come after.</prosody>`,
        `<prosody rate="95%">${fixPronunciation(model.donated_by)} <emphasis level="moderate">entrusted us</emphasis> with this treasure in <say-as interpret-as="date" format="y">${year}</say-as>, an act of stewardship that safeguards this history for posterity.</prosody>`,
      ]
      lines.push(donorPhrases[Math.floor(Math.random() * donorPhrases.length)])
    }
  } else if (model.donated_by && model.donated_by !== '[Donor/Lender Name]') {
    const donorOnlyPhrases = [
      `<prosody rate="95%">It <emphasis level="moderate">found its way</emphasis> to us through ${fixPronunciation(model.donated_by)}, whose dedication ensures its story remains alive within these walls.</prosody>`,
      `<prosody rate="95%">Through the care of ${fixPronunciation(model.donated_by)}, this piece <emphasis level="moderate">has become part</emphasis> of our permanent collection, its legacy preserved for all time.</prosody>`,
    ]
    lines.push(donorOnlyPhrases[Math.floor(Math.random() * donorOnlyPhrases.length)])
  } else {
    const genericClosings = [
      `<prosody rate="95%">It stands here now, <emphasis level="moderate">carefully preserved</emphasis>, ensuring its story will never be forgotten.</prosody>`,
      `<prosody rate="95%"><emphasis level="moderate">Safeguarded within our archives</emphasis>, its significance endures for all who seek to understand our shared heritage.</prosody>`,
    ]
    lines.push(genericClosings[Math.floor(Math.random() * genericClosings.length)])
  }

  if (model.date_received && (!model.donated_by || model.donated_by === '[Donor/Lender Name]')) {
    const year = new Date(model.date_received).getFullYear()
    const archivePhrases = [
      `<prosody rate="95%">It became part of our archives in <say-as interpret-as="date" format="y">${year}</say-as>, <emphasis level="moderate">forever preserved</emphasis> so that its story may continue to inspire.</prosody>`,
      `<prosody rate="95%">Joining our collection in <say-as interpret-as="date" format="y">${year}</say-as>, it remains <emphasis level="moderate">a testament to excellence</emphasis>, its legacy secure for future scholars.</prosody>`,
    ]
    lines.push(archivePhrases[Math.floor(Math.random() * archivePhrases.length)])
  }

  const plainText = lines.join(' ')

  // Wrap in SSML
  const ssml = `<speak>${plainText}</speak>`

  return { text: ssml, isSSML: true }
}
