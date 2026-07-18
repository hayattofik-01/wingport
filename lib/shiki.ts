import { getSingletonHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

export async function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await getSingletonHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'dart'],
    })
  }
  return highlighter
}
