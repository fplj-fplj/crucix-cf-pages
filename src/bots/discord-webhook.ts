import type { Alert } from '../types';
import { createAlertEmbed } from './discord';

export async function sendDiscordWebhookAlert(
  webhookUrl: string,
  alert: Alert,
): Promise<void> {
  const embed = createAlertEmbed(alert);
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

export async function sendDiscordBotAlert(
  botToken: string,
  channelId: string,
  alert: Alert,
): Promise<void> {
  const embed = createAlertEmbed(alert);
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
