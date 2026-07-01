/**
 * POST /api/payment/xrp
 *
 * Actions:
 *   { action: 'create', userId: string }
 *     → Creates a payment session, returns address + tag + QR URI
 *
 *   { action: 'verify', destinationTag: number, userId: string }
 *     → Checks XRPL ledger for confirmation, grants premium if found
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createPaymentSession,
  verifyXRPPayment,
  xrpPaymentURI,
  XRP_CONFIG,
} from '@/lib/xrpPayment'
import { grantPremium } from '@/lib/auth'

// In-memory payment session store (upgrade to Redis/DB later)
const activeSessions = new Map<string, ReturnType<typeof createPaymentSession>>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // ── Create payment session ────────────────────────────────
    if (action === 'create') {
      const session = createPaymentSession(userId)
      activeSessions.set(userId, session)

      return NextResponse.json({
        success: true,
        session: {
          destinationAddress: session.destinationAddress,
          destinationTag:     session.destinationTag,
          priceXRP:           session.priceXRP,
          expiresAt:          session.expiresAt,
          qrUri:              xrpPaymentURI(session),
          network:            XRP_CONFIG.network,
        },
      })
    }

    // ── Verify payment ────────────────────────────────────────
    if (action === 'verify') {
      const session = activeSessions.get(userId)

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'No active payment session — create one first' },
          { status: 400 }
        )
      }

      if (new Date() > session.expiresAt) {
        activeSessions.delete(userId)
        return NextResponse.json(
          { success: false, error: 'Payment session expired', expired: true },
          { status: 400 }
        )
      }

      const result = await verifyXRPPayment(
        session.destinationTag,
        session.priceDrops
      )

      if (result.verified) {
        // Grant premium access
        grantPremium(userId)
        session.status = 'confirmed'
        session.txHash = result.txHash
        activeSessions.delete(userId) // clean up

        return NextResponse.json({
          success: true,
          verified: true,
          txHash:    result.txHash,
          amountXRP: result.amountXRP,
          message:   'Payment confirmed. Premium access granted.',
        })
      }

      return NextResponse.json({
        success:  true,
        verified: false,
        message:  'Payment not yet detected on ledger. Try again in a moment.',
      })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[/api/payment/xrp]', err)
    return NextResponse.json(
      { success: false, error: 'Payment check failed' },
      { status: 500 }
    )
  }
}

// ── GET — config info (public) ─────────────────────────────
export async function GET() {
  return NextResponse.json({
    status:    'ok',
    network:   XRP_CONFIG.network,
    priceXRP:  XRP_CONFIG.premiumPriceXRP,
    currency:  'XRP',
    address:   XRP_CONFIG.destinationAddress,
  })
}
