import type { Meeting } from '~/server/services/meetings'

/**
 * Test fixture data for meetings
 */

export const mockMeeting: Meeting = {
  participant_emails: 'test@example.com',
  participant_names: 'Test Customer',
  calendly_user_name: 'Test Host',
  calendly_user_email: 'host@example.com',
  id: 'meeting_123',
  meeting_start_at: '2024-02-01T10:00:00.000Z',
  name: 'Test Meeting',
  status: 'active'
}

export const createMockMeeting = (overrides?: Partial<Meeting>): Meeting => ({
  ...mockMeeting,
  ...overrides
})
