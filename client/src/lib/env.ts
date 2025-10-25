// Lightweight env access helpers for PUBLIC_* variables

type MaybeString = string | undefined;

const toInt = (value: MaybeString, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const publicEnv = {
  DISCORD_INVITE: (import.meta.env.PUBLIC_DISCORD_INVITE as MaybeString) || undefined,
  GRAPHQL_API_URL: (import.meta.env.PUBLIC_GRAPHQL_API_URL as MaybeString) || undefined,
  SERVER_ADDRESS: (import.meta.env.PUBLIC_SERVER_ADDRESS as MaybeString) || undefined,
  SERVER_PORT: toInt(import.meta.env.PUBLIC_SERVER_PORT as MaybeString, 25565),
  SERVER_IP: (import.meta.env.PUBLIC_SERVER_IP as MaybeString) || undefined,
  SERVER_PORT_DIRECT: toInt(import.meta.env.PUBLIC_SERVER_PORT_DIRECT as MaybeString, 23376),
  SITE_URL: (import.meta.env.PUBLIC_SITE_URL as MaybeString) || undefined,
};


