/**
 * Content moderation - checks for profanity and inappropriate words
 */

const PROFANITY_LIST_CZ = [
  'kurva', 'kurvy', 'kurvě', 'kurvin', 'kurvinský',
  'prdel', 'prd', 'srát', 'seru', 'chlív',
  'vole', 'volej', 'volím', 'kokot', 'kretén',
  'debil', 'blbec', 'idiota', 'magor', 'cykorta',
  'čůrák', 'čůr', 'sviň', 'koza', 'osol',
  'hovado', 'bestie', 'zmrd', 'zmrde', 'zmrdi'
]

const PROFANITY_LIST_EN = [
  'fuck', 'fucking', 'shit', 'shitty', 'asshole', 'bastard',
  'bitch', 'bitches', 'cunt', 'dick', 'douche',
  'dumbass', 'piss', 'damn', 'hell', 'suck',
  'cock', 'pussy', 'whore', 'slut', 'retard',
  'idiot', 'moron', 'imbecile', 'twat'
]

const COMBINED_LIST = [...PROFANITY_LIST_CZ, ...PROFANITY_LIST_EN]

/**
 * Check if text contains profanity
 */
export function hasProfanity(text: string): { hasBadWords: boolean; foundWords: string[] } {
  if (!text) return { hasBadWords: false, foundWords: [] }

  const lowerText = text.toLowerCase()
  const foundWords: string[] = []

  for (const word of COMBINED_LIST) {
    // Match whole words with word boundaries or as substrings (for shorter words)
    const regex = new RegExp(`\\b${word}s?\\b|${word}`, 'gi')
    if (regex.test(lowerText)) {
      foundWords.push(word)
    }
  }

  return {
    hasBadWords: foundWords.length > 0,
    foundWords: [...new Set(foundWords)] // Remove duplicates
  }
}

/**
 * Validate guild name (length, no profanity, etc)
 */
export function validateGuildName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Název gildy nemůže být prázdný" }
  }

  if (name.length < 3) {
    return { valid: false, error: "Název gildy musí mít alespoň 3 znaky" }
  }

  if (name.length > 50) {
    return { valid: false, error: "Název gildy nesmí přesáhnout 50 znaků" }
  }

  const profanity = hasProfanity(name)
  if (profanity.hasBadWords) {
    return { valid: false, error: "Název gildy obsahuje nevhodný obsah" }
  }

  return { valid: true }
}

/**
 * Validate guild description
 */
export function validateGuildDescription(description?: string): { valid: boolean; error?: string } {
  if (!description) return { valid: true }

  if (description.length > 500) {
    return { valid: false, error: "Popis gildy nesmí přesáhnout 500 znaků" }
  }

  const profanity = hasProfanity(description)
  if (profanity.hasBadWords) {
    return { valid: false, error: "Popis gildy obsahuje nevhodný obsah" }
  }

  return { valid: true }
}

/**
 * Validate guild motto
 */
export function validateGuildMotto(motto?: string): { valid: boolean; error?: string } {
  if (!motto) return { valid: true }

  if (motto.length > 100) {
    return { valid: false, error: "Motto gildy nesmí přesáhnout 100 znaků" }
  }

  const profanity = hasProfanity(motto)
  if (profanity.hasBadWords) {
    return { valid: false, error: "Motto gildy obsahuje nevhodný obsah" }
  }

  return { valid: true }
}
