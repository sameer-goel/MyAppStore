// Lightweight mock data for GitHub Pages (no backend)

export function listCategories() {
  return Promise.resolve([
    { catKey: 'ai', name: 'ARTIFICIAL INTELLIGENCE', order: 1 },
    { catKey: 'inner', name: 'INNER INTELLIGENCE', order: 2 },
  ])
}

const SUBS = {
  ai: [
    { subKey: 'education', name: 'Education', order: 1 },
    { subKey: 'healthcare', name: 'Healthcare', order: 2 },
    { subKey: 'energy', name: 'Energy', order: 3 },
  ],
  inner: [
    { subKey: 'mind', name: 'Mind', order: 1 },
    { subKey: 'body', name: 'Body', order: 2 },
    { subKey: 'soul', name: 'Soul', order: 3 },
  ],
}

export function listSubcategories(catKey) {
  return Promise.resolve(SUBS[catKey] || [])
}

const APPS = {
  'ai/education': [
    { slug: 'ai-tutor', name: 'AI Tutor', desc: 'Conversational tutor.', iconId: 'token-branded:sol' },
    { slug: 'learning-analytics', name: 'Learning Analytics', desc: 'Insights from learning.', iconId: 'token-branded:btc' },
    { slug: 'skill-assessment', name: 'Skill Assessment', desc: 'Scenario-based evaluations.', iconId: 'token-branded:eth' },
  ],
  'inner/mind': [
    { slug: 'meditation-timer', name: 'Meditation Timer', desc: 'Intervals and soundscapes.', iconId: 'token-branded:btc' },
    { slug: 'binural-beats', name: 'Binural Beats', desc: 'Focus beats player.', iconId: 'token-branded:eth', publicUrl: 'https://sameerai.com/04mind/BinuralBeatsApp.html' },
    { slug: 'focus-enhancer', name: 'Focus Enhancer', desc: 'Deep-work cycles.', iconId: 'token-branded:sol' },
  ],
}

export function listApps(catKey, subKey) {
  const key = `${catKey}/${subKey}`
  return Promise.resolve((APPS[key] || []).map(a => ({
    ...a,
    catKey, subKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })))
}

