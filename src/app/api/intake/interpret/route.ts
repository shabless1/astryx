import { NextRequest, NextResponse } from 'next/server'
import planetIntakeMap from '@/data/planet-intake-map.json'

// ── Types ──────────────────────────────────────────────────────
interface InterpretRequest {
  narrative: string
  intentionText?: string
  symptoms?: string[]
  questionSelections?: string[]   // planet question keys user tapped
}

interface InterpretResponse {
  planetScores: Record<string, number>  // 0-100 per planet
  dominantPlanets: string[]             // top 3 sorted descending
  reasoning: string                     // brief Claude explanation
  method: 'claude' | 'keyword'         // which path ran
}

// ── Keyword fallback scorer ────────────────────────────────────
function scoreByKeywords(
  text: string,
  symptoms: string[] = [],
  questionSelections: string[] = [],
): Record<string, number> {
  const lower = text.toLowerCase()
  const scores: Record<string, number> = {}

  for (const p of planetIntakeMap.planets) {
    let score = 0

    // Keyword matches in narrative (2 pts each)
    for (const kw of p.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 2
    }

    // Symptom tags matching this planet's questions (5 pts each)
    for (const q of p.questions) {
      if (symptoms.includes(q.symptomTag)) score += 5
    }

    // Planet question keys explicitly selected by user (8 pts each)
    for (const q of p.questions) {
      if (questionSelections.includes(q.key)) score += 8
    }

    scores[p.planet] = Math.min(score, 100)
  }

  return scores
}

// ── Claude API scorer ─────────────────────────────────────────
async function scoreWithClaude(
  narrative: string,
  intentionText: string,
  symptoms: string[],
  questionSelections: string[],
): Promise<{ scores: Record<string, number>; reasoning: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  // Build planet context for the prompt
  const planetContext = planetIntakeMap.planets
    .map(p => `${p.planet} (${p.domain}): governs ${p.bodyArea}`)
    .join('\n')

  const selectedQuestions = questionSelections
    .map(key => {
      for (const p of planetIntakeMap.planets) {
        const q = p.questions.find(q => q.key === key)
        if (q) return `${p.planet}: "${q.text}"`
      }
      return null
    })
    .filter(Boolean)
    .join('\n')

  const prompt = `You are Astryx, a cosmic resonance system grounded in medical astrology and Hans Cousto's planetary frequency system.

Analyze the following client intake and score how strongly each of the 10 planets is activated in their current state. Return ONLY a JSON object — no explanation outside the JSON.

## Client Intake

**Narrative (what the client wrote about themselves):**
${narrative || 'Not provided'}

**Intention (what they want to call in):**
${intentionText || 'Not provided'}

**Reported symptoms/states:**
${symptoms.length > 0 ? symptoms.join(', ') : 'None specified'}

**Planet domain questions they resonated with:**
${selectedQuestions || 'None selected'}

## Planetary Domains
${planetContext}

## Instructions
Score each planet 0-100 based on:
- Language, themes, and body signals in the narrative
- Emotional and somatic patterns described
- The planet domains they resonated with
- Classic medical astrology signatures

Return this exact JSON structure:
{
  "Sun": <0-100>,
  "Moon": <0-100>,
  "Mercury": <0-100>,
  "Venus": <0-100>,
  "Mars": <0-100>,
  "Jupiter": <0-100>,
  "Saturn": <0-100>,
  "Uranus": <0-100>,
  "Neptune": <0-100>,
  "Pluto": <0-100>,
  "reasoning": "<2-3 sentence explanation of the dominant signatures you detected>"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  const parsed = JSON.parse(jsonMatch[0])
  const reasoning = parsed.reasoning ?? ''
  delete parsed.reasoning

  const scores: Record<string, number> = {}
  for (const planet of planetIntakeMap.planets) {
    scores[planet.planet] = Math.max(0, Math.min(100, Number(parsed[planet.planet] ?? 0)))
  }

  return { scores, reasoning }
}

// ── Route handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: InterpretRequest = await req.json()
    const { narrative = '', intentionText = '', symptoms = [], questionSelections = [] } = body

    // Always compute keyword scores (instant, offline, used as floor)
    const keywordScores = scoreByKeywords(narrative + ' ' + intentionText, symptoms, questionSelections)

    // Attempt Claude interpretation if we have meaningful narrative
    const hasNarrative = narrative.trim().length > 30
    let finalScores = keywordScores
    let reasoning = ''
    let method: 'claude' | 'keyword' = 'keyword'

    if (hasNarrative && process.env.ANTHROPIC_API_KEY) {
      try {
        const { scores: claudeScores, reasoning: claudeReasoning } = await scoreWithClaude(
          narrative, intentionText || '', symptoms, questionSelections
        )
        // Blend: Claude 65% + keyword 35% (as per Play A spec)
        for (const planet of Object.keys(claudeScores)) {
          finalScores[planet] = Math.round(
            claudeScores[planet] * 0.65 + (keywordScores[planet] ?? 0) * 0.35
          )
        }
        reasoning = claudeReasoning
        method = 'claude'
      } catch (claudeErr) {
        console.error('[interpret] Claude API failed, using keyword scores:', claudeErr)
        // keywordScores already set as fallback
      }
    }

    // Sort planets by score descending
    const dominantPlanets = Object.entries(finalScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([planet]) => planet)

    const result: InterpretResponse = {
      planetScores: finalScores,
      dominantPlanets,
      reasoning: reasoning || 'Planetary resonance calculated from your selections.',
      method,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[interpret] route error:', err)
    return NextResponse.json(
      { error: err?.message || 'Interpretation failed', planetScores: {}, dominantPlanets: [], reasoning: '', method: 'keyword' },
      { status: 500 }
    )
  }
}
