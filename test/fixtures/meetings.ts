import type { ScheduledEvent } from '~/server/services/scheduledEvents'

/**
 * Test fixture data for scheduledEvents
 */

export const mockMeeting: ScheduledEvent = {
  calendly_user_email: 'host@example.com',
  calendly_user_name: 'Test Host',
  id: 'meeting_123',
  meeting_start_at: '2024-02-01T10:00:00.000Z',
  name: 'Test ScheduledEvent',
  participant_emails: 'test@example.com',
  participant_names: 'Test Customer',
  status: 'active'
}

export const createMockMeeting = (
  overrides?: Partial<ScheduledEvent>
): ScheduledEvent => ({
  ...mockMeeting,
  ...overrides
})
