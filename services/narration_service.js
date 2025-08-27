export function generateNarration(model) {
  if (!model) return ''

  const lines = []
  const currentYear = new Date().getFullYear()
  const artifactYear = model.metadata?.date ? new Date(model.metadata.date).getFullYear() : null
  const isRecent = artifactYear && currentYear - artifactYear <= 3

  // Title + Recipient
  if (model.metadata?.title && model.metadata?.author) {
    lines.push(`Before us is the "${model.metadata.title}", presented to ${model.metadata.author}.`)
  } else if (model.metadata?.title) {
    lines.push(`Here we see the "${model.metadata.title}", a symbol of recognition and pride.`)
  } else if (model.metadata?.author) {
    lines.push(
      `This piece was awarded to ${model.metadata.author}, a leader whose name still echoes in our university’s history.`,
    )
  }

  // Date
  if (artifactYear) {
    if (isRecent) {
      lines.push(
        `This piece was presented in ${artifactYear}, a more recent addition to our heritage.`,
      )
    } else {
      lines.push(
        `It was awarded in ${artifactYear}, during a time of important milestones for the university.`,
      )
    }
  }

  // Summary
  if (model.metadata?.summary) {
    lines.push(
      `The artifact tells the story of ${model.metadata.summary}, capturing the spirit of service and leadership that defined that era.`,
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
