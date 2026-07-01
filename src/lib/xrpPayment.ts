/**
 * Astryx XRP Payment System
 *
 * Flow:
 * 1. Generate a unique payment memo tag for each user session
 * 2. Show the user a QR code / payment address
 * 3. Poll the XRPL ledger for an incoming payment
 * 4. Confirm amount meets the premium threshold
 * 5. Grant premium access
 *
 * No custodial handling — payments go directly to your XRP wallet.
 * The app just reads the public ledger to verify receipt.
 */

// ─── CONFIG ───────────────────────────────────────────────────

export const XRP_CONFIG = {
  // Your XRP wallet address (set in environment variable)
  destinationAddress: process.env.NEXT_PUBLIC_XRP_ADDRESS || 'rYourXRPWalletAddressHere',

  // Premium price in XRP drops (1 XRP = 1,000,000 drops)
  // Default: 5 XRP
  premiumPriceXRP: 5,
  premiumPriceDrops: 5_000_000,

  // XRPL network
  network: (process.env.XRP_NETWORK as 'mainnet' | 'testnet') || 'mainnet',
  wssUrl: process.env.XRP_NETWORK === 'testnet'
    ? 'wss://s.altnet.rippletest.net:51233'
    : 'wss://xrplcluster.com',

  // How long a payment session is valid (minutes)
  sessionTimeoutMinutes: 30,
}

// ─── TYPES ────────────────────────────────────────────────────

export interface PaymentSession {
  sessionId: string
  destinationAddress: string
  destinationTag: number
  priceXRP: number
  priceDrops: number
  expiresAt: Date
  status: 'pending' | 'confirmed' | 'expired'
  txHash?: string
}

export interface XRPPaymentVerification {
  verified: boolean
  txHash?: string
  amountDrops?: number
  amountXRP?: number
  error?: string
}

// ─── MEMO TAG GENERATION ──────────────────────────────────────

/**
 * Generate a deterministic destination tag from a user ID.
 * Tags are 32-bit unsigned integers (0 – 4,294,967,295).
 * We hash the userId to produce a stable tag for the session.
 */
export function generateDestinationTag(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash |= 0
  }
  // Ensure positive 32-bit integer
  return Math.abs(hash) % 4_000_000_000
}

// ─── PAYMENT SESSION ──────────────────────────────────────────

export function createPaymentSession(userId: string): PaymentSession {
  const destinationTag = generateDestinationTag(userId)
  const expiresAt = new Date(Date.now() + XRP_CONFIG.sessionTimeoutMinutes * 60 * 1000)

  return {
    sessionId:          `xrp_${userId}_${Date.now()}`,
    destinationAddress: XRP_CONFIG.destinationAddress,
    destinationTag,
    priceXRP:           XRP_CONFIG.premiumPriceXRP,
    priceDrops:         XRP_CONFIG.premiumPriceDrops,
    expiresAt,
    status:             'pending',
  }
}

// ─── LEDGER VERIFICATION ──────────────────────────────────────

/**
 * Check the XRPL ledger for a payment to our address with
 * the correct destination tag and amount.
 *
 * This is a server-side function — never expose your wallet
 * monitoring logic to the client.
 */
export async function verifyXRPPayment(
  destinationTag: number,
  requiredDrops: number,
  lookbackTransactions = 20
): Promise<XRPPaymentVerification> {
  try {
    // Use the XRPL REST API (no WebSocket needed for verification)
    const apiBase = XRP_CONFIG.network === 'testnet'
      ? 'https://testnet.xrpl-labs.com'
      : 'https://xrpl-labs.com'

    const url = `${apiBase}/api/v1/account/transactions/${XRP_CONFIG.destinationAddress}?limit=${lookbackTransactions}`

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`XRPL API error: ${res.status}`)

    const data = await res.json()
    const transactions = data.transactions || data.result?.transactions || []

    // Scan recent transactions
    for (const tx of transactions) {
      const meta = tx.meta || tx
      const txData = tx.tx || tx

      // Only look at Payment transactions
      if (txData.TransactionType !== 'Payment') continue

      // Check destination
      if (txData.Destination !== XRP_CONFIG.destinationAddress) continue

      // Check destination tag
      if (txData.DestinationTag !== destinationTag) continue

      // Check amount (must be XRP, not IOU)
      const amountDrops = typeof txData.Amount === 'string'
        ? parseInt(txData.Amount, 10)
        : 0

      if (amountDrops >= requiredDrops) {
        return {
          verified:    true,
          txHash:      txData.hash || txData.Hash,
          amountDrops,
          amountXRP:   amountDrops / 1_000_000,
        }
      }
    }

    return { verified: false }
  } catch (err) {
    console.error('[XRP] Verification error:', err)
    return {
      verified: false,
      error: err instanceof Error ? err.message : 'Ledger check failed',
    }
  }
}

// ─── QR CODE DATA ─────────────────────────────────────────────

/**
 * Generate an XRP payment URI for QR code display.
 * Format: xrpl:ADDRESS?amount=DROPS&dt=TAG&memo=TEXT
 */
export function xrpPaymentURI(session: PaymentSession): string {
  const params = new URLSearchParams({
    amount: session.priceDrops.toString(),
    dt:     session.destinationTag.toString(),
    memo:   'Astryx+Premium',
  })
  return `xrpl:${session.destinationAddress}?${params.toString()}`
}

// ─── HUMAN READABLE AMOUNT ────────────────────────────────────

export function dropsToXRP(drops: number): string {
  return (drops / 1_000_000).toFixed(2)
}
