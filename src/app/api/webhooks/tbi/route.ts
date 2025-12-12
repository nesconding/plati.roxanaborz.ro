import { NextResponse } from 'next/server'
import { TbiHandlers } from '~/server/handlers/tbi-handlers'
import {
  TbiService,
  TbiStatusCode,
  type TbiStatusUpdate
} from '~/server/services/tbi'

/**
 * TBI Bank Webhook Handler (ReturnToProvider)
 *
 * Handles status updates from TBI Bank when a loan application changes status.
 *
 * Status codes:
 * - 0: Rejected/Canceled (motiv contains reason)
 * - 1: Approved
 * - 2: Pending (motiv contains intermediate status)
 *
 * Request format:
 * - POST with form-urlencoded body
 * - order_data: RSA encrypted JSON with { order_id, status_id, motiv }
 *
 * Security:
 * - Data is encrypted with merchant's public key by TBI
 * - We decrypt using our private key (TBI_MERCHANT_PRIVATE_KEY)
 */
export async function POST(req: Request) {
  try {
    // Step 1: Parse form data
    const formData = await req.formData()
    const encryptedOrderData = formData.get('order_data')

    if (!encryptedOrderData || typeof encryptedOrderData !== 'string') {
      console.error('[TBI Webhook] Missing or invalid order_data')
      return NextResponse.json(
        { error: 'Missing order_data parameter' },
        { status: 400 }
      )
    }

    // Step 2: Decrypt the status update
    let statusUpdate: TbiStatusUpdate
    try {
      statusUpdate = TbiService.parseStatusUpdate(encryptedOrderData)
    } catch (error) {
      console.error('[TBI Webhook] Failed to decrypt order_data:', error)
      console.error(
        '[TBI Webhook] Encrypted data (first 100 chars):',
        encryptedOrderData.substring(0, 100)
      )
      console.error(
        '[TBI Webhook] Error details:',
        error instanceof Error ? error.message : String(error)
      )
      return NextResponse.json(
        {
          error: 'Failed to decrypt order_data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    console.log(
      `[TBI Webhook] Received status update for order ${statusUpdate.order_id}: status=${statusUpdate.status_id}, motiv="${statusUpdate.motiv}"`
    )

    // Step 3: Validate the status update structure
    // Note: status_id can be 0 (Rejected/Canceled), so we check for null/undefined explicitly
    if (!statusUpdate.order_id || statusUpdate.status_id == null) {
      console.error(
        '[TBI Webhook] Invalid status update structure:',
        statusUpdate
      )
      return NextResponse.json(
        { error: 'Invalid status update structure' },
        { status: 400 }
      )
    }

    // Step 4: Route to appropriate handler based on status
    switch (statusUpdate.status_id) {
      case TbiStatusCode.Approved: {
        await TbiHandlers.handleApproval(statusUpdate.order_id)
        console.log(
          `[TBI Webhook] Successfully processed approval for order ${statusUpdate.order_id}`
        )
        break
      }

      case TbiStatusCode.RejectedOrCanceled: {
        await TbiHandlers.handleRejection(
          statusUpdate.order_id,
          statusUpdate.motiv
        )
        console.log(
          `[TBI Webhook] Processed rejection for order ${statusUpdate.order_id}: ${statusUpdate.motiv}`
        )
        break
      }

      case TbiStatusCode.Pending: {
        await TbiHandlers.handlePending(
          statusUpdate.order_id,
          statusUpdate.motiv
        )
        console.log(
          `[TBI Webhook] Processed pending status for order ${statusUpdate.order_id}: ${statusUpdate.motiv}`
        )
        break
      }

      default:
        console.warn(
          `[TBI Webhook] Unknown status_id: ${statusUpdate.status_id}`
        )
    }

    // Step 5: Return success response
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    // Step 6: Handle errors
    console.error('[TBI Webhook] Error processing webhook:', error)

    // Return 500 to allow TBI to retry
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. TBI webhooks must use POST.' },
    { status: 405 }
  )
}
