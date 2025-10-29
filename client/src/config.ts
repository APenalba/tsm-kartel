// Enlaces externos
import { publicEnv } from './lib/env';

export const DISCORD_INVITE_URL = publicEnv.DISCORD_INVITE || "https://discord.gg/tu-invite";
export const GITHUB_URL = "https://github.com/APenalba/tsm-kartel";

// API GraphQL
export const API_URL = publicEnv.GRAPHQL_API_URL || 'http://localhost:8000/graphql';

// Configuración del servidor
export const SERVER_NAME = "TSM Kartel & Comp.";
export const SERVER_VERSION = "1.21.7";
export const SERVER_MODLOADER = "Fabric";
export const SERVER_DESCRIPTION = "Servidor vanilla+ con mods técnicos y de construcción para una experiencia mejorada de Minecraft.";

// Configuración de conexión
export const SERVER_ADDRESS = publicEnv.SERVER_ADDRESS || "play.tsm-kartel.com";
export const SERVER_PORT = publicEnv.SERVER_PORT;
export const SERVER_IP = publicEnv.SERVER_IP || "127.0.0.1";
export const SERVER_PORT_DIRECT = publicEnv.SERVER_PORT_DIRECT;

// Configuración del sitio web
export const SITE_NAME = "TSM Kartel & Comp.";
export const SITE_DESCRIPTION = "Servidor de Minecraft 1.21.7 Fabric vanilla+ con mods técnicos y de construcción";
export const SITE_URL = publicEnv.SITE_URL || "https://tsm-kartel.com";
