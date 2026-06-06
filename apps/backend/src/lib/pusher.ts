import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: process.env.PUSHER_USE_TLS === 'true',
});

export default pusher;

export async function triggerEvent(
  channel: string,
  event: string,
  data: any
) {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Pusher error:', error);
  }
}

export async function triggerBlockerNotification(
  teamId: string,
  standupData: any
) {
  await triggerEvent(`team-${teamId}`, 'blocker-alert', standupData);
}

export async function triggerStandupUpdate(
  teamId: string,
  standupData: any
) {
  await triggerEvent(`team-${teamId}`, 'standup-update', standupData);
}

export async function triggerCommentAdded(
  teamId: string,
  commentData: any
) {
  await triggerEvent(`team-${teamId}`, 'comment-added', commentData);
}

export async function triggerMessageSent(
  conversationId: string,
  messageData: any
) {
  await triggerEvent(`conversation-${conversationId}`, 'message-sent', messageData);
}

export async function triggerChannelMessageSent(
  channelId: string,
  messageData: any
) {
  await triggerEvent(`channel-${channelId}`, 'message-sent', messageData);
}

export async function triggerTypingIndicator(
  conversationId: string,
  typingData: any
) {
  await triggerEvent(`conversation-${conversationId}`, 'typing-indicator', typingData);
}
