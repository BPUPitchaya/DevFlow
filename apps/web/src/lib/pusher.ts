import Pusher from 'pusher-js';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

export const pusher = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER,
});

export function subscribeToTeam(teamId: string, callbacks: {
  onStandupUpdate?: (data: any) => void;
  onBlockerAlert?: (data: any) => void;
  onCommentAdded?: (data: any) => void;
}) {
  const channel = pusher.subscribe(`team-${teamId}`);

  if (callbacks.onStandupUpdate) {
    channel.bind('standup-update', callbacks.onStandupUpdate);
  }

  if (callbacks.onBlockerAlert) {
    channel.bind('blocker-alert', callbacks.onBlockerAlert);
  }

  if (callbacks.onCommentAdded) {
    channel.bind('comment-added', callbacks.onCommentAdded);
  }

  return channel;
}

export function unsubscribeFromTeam(teamId: string) {
  pusher.unsubscribe(`team-${teamId}`);
}

export function subscribeToConversation(conversationId: string, callbacks: {
  onMessageSent?: (data: any) => void;
  onTypingIndicator?: (data: any) => void;
  onMessageUpdated?: (data: any) => void;
  onMessageDeleted?: (data: any) => void;
}) {
  const channel = pusher.subscribe(`conversation-${conversationId}`);

  if (callbacks.onMessageSent) {
    channel.bind('message-sent', callbacks.onMessageSent);
  }

  if (callbacks.onTypingIndicator) {
    channel.bind('typing-indicator', callbacks.onTypingIndicator);
  }

  if (callbacks.onMessageUpdated) {
    channel.bind('message-updated', callbacks.onMessageUpdated);
  }

  if (callbacks.onMessageDeleted) {
    channel.bind('message-deleted', callbacks.onMessageDeleted);
  }

  return channel;
}

export function unsubscribeFromConversation(conversationId: string) {
  pusher.unsubscribe(`conversation-${conversationId}`);
}

export function subscribeToChannel(channelId: string, callbacks: {
  onMessageSent?: (data: any) => void;
}) {
  const channel = pusher.subscribe(`channel-${channelId}`);

  if (callbacks.onMessageSent) {
    channel.bind('message-sent', callbacks.onMessageSent);
  }

  return channel;
}

export function unsubscribeFromChannel(channelId: string) {
  pusher.unsubscribe(`channel-${channelId}`);
}
