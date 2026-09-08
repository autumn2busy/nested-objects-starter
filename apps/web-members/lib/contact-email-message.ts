// Public contact address and a transport-independent internal notification.
// A submitter can choose neither the recipient nor the sending identity.
export const CONTACT_INBOX = 'info@nestedobjects.com';

export type ContactSubmission = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactNotificationState = 'provider_accepted' | 'not_configured' | 'failed';

// Accept a single ASCII mailbox, not a display name, address list, or header.
// Domain names can use their ASCII/punycode representation.
export function isContactReplyEmail(value: string): boolean {
  if (value.length > 254) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || !domain.includes('.')) return false;
  const atom = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+$/;
  return local.split('.').every(part => atom.test(part)) &&
    domain.split('.').every(label =>
      label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)
    );
}

export function createContactEmail(submission: ContactSubmission, receiptId: string) {
  if (!isContactReplyEmail(submission.email) ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(receiptId) ||
      /[\r\n\u0000-\u001f\u007f]/.test(submission.topic) || submission.topic.length > 120) {
    throw new Error('Invalid contact notification fields.');
  }

  return {
    from: CONTACT_INBOX,
    to: CONTACT_INBOX,
    replyTo: submission.email,
    subject: `Nested Objects contact: ${submission.topic}`,
    messageId: `<contact-${receiptId}@nestedobjects.com>`,
    // Plain text only; user content is not rendered as markup or instructions.
    text: [
      'A website contact message was saved.',
      `Receipt: ${receiptId}`,
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      `Topic: ${submission.topic}`,
      '',
      'Message (submitted by the visitor):',
      submission.message,
    ].join('\n'),
  };
}
