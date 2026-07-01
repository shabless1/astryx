/**
 * ASTRYX — DIY Planetary Herbal Directions (Phase 2)
 *
 * General "create-your-own" herbal direction for users who prefer to prepare
 * their own tea. This is supportive GENERAL direction — NOT a product and NOT a
 * competing recommendation.
 *
 * RULES:
 *  • Never name a competing brand or commercial blend.
 *  • Only list general herbs / taste categories.
 *  • Keep language traditional + non-medical ("traditionally associated with").
 *
 * Keyed by planet × DisplayState. Where the directive gave only some states,
 * the engine falls back along: requested → depleted → elevated → any defined.
 */

import type { TeaDisplayState } from './sacredTeaPlanetRules'

export interface DIYHerbDirection {
  planetaryHerbCategory: string
  suggestedHerbs: string[]
  tasteProfile: string
  preparationStyle: string
  cautionNote: string
}

export const DIY_PLANETARY_HERB_DIRECTIONS: Record<string, Partial<Record<TeaDisplayState, DIYHerbDirection>>> = {
  Sun: {
    depleted: {
      planetaryHerbCategory: 'Sun / warm, gently uplifting direction',
      suggestedHerbs: ['calendula', 'lemon balm', 'ginger in small amount', 'orange peel'],
      tasteProfile: 'warm, bright, gently uplifting',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid overstimulating herbs if you feel overheated or depleted.',
    },
    elevated: {
      planetaryHerbCategory: 'Sun / cooling, heart-settling direction',
      suggestedHerbs: ['lemon balm', 'chamomile', 'rose', 'hibiscus'],
      tasteProfile: 'cooling, soft, heart-settling',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid strong warming herbs after an over-radiant session.',
    },
  },
  Moon: {
    depleted: {
      planetaryHerbCategory: 'Moon / soft, nourishing direction',
      suggestedHerbs: ['chamomile', 'raspberry leaf', 'oatstraw', 'lemon balm'],
      tasteProfile: 'soft, nourishing, soothing',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Keep the blend simple and comforting.',
    },
    elevated: {
      planetaryHerbCategory: 'Moon / cooling, emotionally softening direction',
      suggestedHerbs: ['chamomile', 'peppermint', 'lemon balm', 'rose'],
      tasteProfile: 'cooling, settling, emotionally softening',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid overly stimulating botanicals.',
    },
  },
  Mercury: {
    elevated: {
      planetaryHerbCategory: 'Mercury / cooling, calming nervous-system direction',
      suggestedHerbs: ['lavender', 'skullcap', 'passionflower', 'peppermint'],
      tasteProfile: 'cooling, aromatic, light, calming',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Keep the blend simple and avoid overstimulating herbs after an accelerated session.',
    },
    depleted: {
      planetaryHerbCategory: 'Mercury / clear, lightly aromatic direction',
      suggestedHerbs: ['peppermint', 'lemon balm', 'gotu kola', 'rosemary in small amount'],
      tasteProfile: 'clear, bright, lightly aromatic',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid too much rosemary or strong stimulation if you are sensitive.',
    },
  },
  Venus: {
    depleted: {
      planetaryHerbCategory: 'Venus / floral, heart-opening direction',
      suggestedHerbs: ['rose', 'hawthorn', 'raspberry leaf', 'damiana'],
      tasteProfile: 'floral, soft, heart-opening, gently sweet',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Keep the blend soft and avoid making it overly stimulating.',
    },
    elevated: {
      planetaryHerbCategory: 'Venus / light, clearing floral direction',
      suggestedHerbs: ['peppermint', 'hibiscus', 'dandelion leaf', 'rose'],
      tasteProfile: 'light, clearing, floral, gently cooling',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid overly sweet or heavy herbs if the protocol calls for clearing.',
    },
  },
  Mars: {
    elevated: {
      planetaryHerbCategory: 'Mars / cooling, refreshing direction',
      suggestedHerbs: ['hibiscus', 'peppermint', 'spearmint', 'lemon balm'],
      tasteProfile: 'cooling, tart, refreshing, calming',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid strong warming herbs after a heated Mars session.',
    },
    depleted: {
      planetaryHerbCategory: 'Mars / warm, steadily activating direction',
      suggestedHerbs: ['ginger in small amount', 'cinnamon in small amount', 'orange peel', 'rooibos'],
      tasteProfile: 'warm, activating, bright, steady',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Use warming herbs lightly and avoid overstimulation.',
    },
  },
  Jupiter: {
    elevated: {
      planetaryHerbCategory: 'Jupiter / bitter, digestive, clarifying direction',
      suggestedHerbs: ['dandelion root', 'burdock root', 'fennel', 'peppermint'],
      tasteProfile: 'bitter, earthy, digestive, clarifying',
      preparationStyle: 'longer steep or decoction-style preparation where appropriate',
      cautionNote: 'Avoid making the blend too intense if you feel depleted.',
    },
    depleted: {
      planetaryHerbCategory: 'Jupiter / bright, expansive, gently sweet direction',
      suggestedHerbs: ['orange peel', 'lemon balm', 'rooibos', 'cinnamon in small amount'],
      tasteProfile: 'bright, warm, expansive, gently sweet',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid heavy bitter herbs unless clearing is needed.',
    },
  },
  Saturn: {
    elevated: {
      planetaryHerbCategory: 'Saturn / earthy, grounding, root-based direction',
      suggestedHerbs: ['dandelion root', 'burdock root', 'nettle', 'oatstraw'],
      tasteProfile: 'earthy, mineral, root-based, grounding',
      preparationStyle: 'longer steep or decoction-style preparation where appropriate',
      cautionNote: 'Avoid making the blend too bitter or drying if you feel depleted.',
    },
    depleted: {
      planetaryHerbCategory: 'Saturn / mineral, restorative, steady direction',
      suggestedHerbs: ['oatstraw', 'nettle', 'rooibos', 'burdock root'],
      tasteProfile: 'mineral, earthy, restorative, steady',
      preparationStyle: 'long infusion or gentle decoction where appropriate',
      cautionNote: 'Keep the blend restorative, not harsh.',
    },
  },
  Uranus: {
    elevated: {
      planetaryHerbCategory: 'Uranus / cooling, calming nervous-system direction',
      suggestedHerbs: ['lavender', 'skullcap', 'passionflower', 'peppermint'],
      tasteProfile: 'cooling, aromatic, light, calming',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid stimulating herbs, strong caffeine, or intense aromatics after an electrified session.',
    },
    depleted: {
      planetaryHerbCategory: 'Uranus / clear, airy, lightly activating direction',
      suggestedHerbs: ['peppermint', 'lemon balm', 'gotu kola', 'lavender'],
      tasteProfile: 'clear, airy, lightly activating, refreshing',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Keep stimulation gentle and avoid sharp intensity.',
    },
  },
  Neptune: {
    elevated: {
      planetaryHerbCategory: 'Neptune / clear, boundary-supporting direction',
      suggestedHerbs: ['peppermint', 'rosemary in small amount', 'lemon balm', 'nettle'],
      tasteProfile: 'clear, light, boundary-supporting, gently refreshing',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid overly sedating herbs if you feel foggy.',
    },
    depleted: {
      planetaryHerbCategory: 'Neptune / soft, dreamy, meditative direction',
      suggestedHerbs: ['lavender', 'chamomile', 'blue lotus', 'white lotus'],
      tasteProfile: 'soft, dreamy, meditative, floral',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Use dream-state herbs gently, especially if you feel spacey.',
    },
  },
  Pluto: {
    elevated: {
      planetaryHerbCategory: 'Pluto / integration after deep release',
      suggestedHerbs: ['rose', 'hawthorn', 'raspberry leaf', 'ginger in small amount'],
      tasteProfile: 'soft, warming, heart-root, gently grounding',
      preparationStyle: 'gentle infusion',
      cautionNote: 'Avoid aggressive cleansing herbs if the session already felt intense.',
    },
    blocked: {
      planetaryHerbCategory: 'Pluto / earthy, release-oriented direction',
      suggestedHerbs: ['dandelion root', 'burdock root', 'rose', 'ginger in small amount'],
      tasteProfile: 'earthy, root-based, softening, release-oriented',
      preparationStyle: 'longer steep or gentle decoction where appropriate',
      cautionNote: 'Do not push deep clearing if you selected “Too intense.”',
    },
  },
}

/** Safe, gentle fallback when a planet/state pair has no specific entry. */
export const DIY_FALLBACK_DIRECTION: DIYHerbDirection = {
  planetaryHerbCategory: 'Gentle, settling direction',
  suggestedHerbs: ['chamomile', 'lemon balm', 'rose', 'oatstraw'],
  tasteProfile: 'soft, calming, gently nourishing',
  preparationStyle: 'gentle infusion',
  cautionNote: 'Keep the blend simple and soothing after the Chamber.',
}
