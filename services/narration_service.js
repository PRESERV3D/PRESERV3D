export function generateNarration(model) {
  if (!model) return ''

  const lines = []
  const currentYear = new Date().getFullYear()
  const artifactYear = model.metadata?.date ? new Date(model.metadata.date).getFullYear() : null
  const isRecent = artifactYear && currentYear - artifactYear <= 3

  // Title + Recipient
  if (model.metadata?.title && model.metadata?.author) {
    lines.push(`Before us is the "${model.metadata.title}", a piece that carries both recognition and pride. It was made possible through the efforts of ${model.metadata.author},  whose name still echoes in our university’s history.`)
  } else if (model.metadata?.title) {
    lines.push(`Here we see the "${model.metadata.title}", a remarkable entry in the collection that represents the stories and milestones that shaped our community.`)
  } else if (model.metadata?.author) {
    lines.push(
      `This item is attributed to ${model.metadata.author}, whose name still echoes in our university’s history.`,
    )
  } else {
    lines.push(`This piece is part of the university’s collection, representing the stories and achievements that make up our shared history.`)
  }

  // Date
  if (artifactYear) {
    if (isRecent) {
      lines.push(
        `This piece was presented in ${artifactYear}, it’s one of the more recent additions to our archives, showing how creativity and service continue to grow within the academe.`,
      )
    } else {
      lines.push(
        `Dating back to ${artifactYear}, it connects us to a time that helped shape the institution’s identity and traditions.`,
      )
    }
  }

  // Summary
  if (model.metadata?.summary) {
    lines.push(
      `It highlights ${model.metadata.summary}, preserving a piece of history that continues to inspire those who come across it. `,
    )
  }

  // Donor + Date received
  if (model.donated_by && model.date_received) {
    const year = new Date(model.date_received).getFullYear()
    if (model.donated_by !== '[Donor/Lender Name]') {
      lines.push(
        `It was entrusted to our collection by ${model.donated_by} in ${year}, so that future generations could witness this legacy.`,
      )
    }
  } else if (model.donated_by && model.donated_by !== '[Donor/Lender Name]') {
    lines.push(
      `It eventually found its way to us through ${model.donated_by}, preserving its story within these walls.`,
    )
  } else {
    lines.push('Ensuring that its story will never be forgotten.')
  }

  if (model.date_received && (!model.donated_by || model.donated_by === '[Donor/Lender Name]')) {
    const year = new Date(model.date_received).getFullYear()
    lines.push(
      `It became part of our archives in ${year}, ensuring that its story would not be forgotten.`,
    )
  }

  console.log(lines.join(' '))

  return lines.join(' ')
}
