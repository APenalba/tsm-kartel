import { GraphQLClient, gql } from 'graphql-request';
import { API_URL } from '../config';

// Cliente GraphQL
export const graphqlClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queries
export const GET_SERVER_STATUS = gql`
  query GetServerStatus {
    serverStatus {
      online
      host
      port
      version {
        name
        protocol
      }
      description
      players {
        online
        max
        players {
          name
          id
        }
      }
      latency
      favicon
      queriedAt
    }
  }
`;

// Mutations
export const REFRESH_PLAYER_STATS_DB = gql`
  mutation RefreshPlayerStatsDB {
    refreshPlayerStatsDb
  }
`;

export const GET_SERVER_PING = gql`
  query GetServerPing {
    serverPing {
      online
      host
      port
      latency
      measuredAt
    }
  }
`;

export const GET_HALL_OF_FAME_LEADERBOARD = gql`
  query GetHallOfFameLeaderboard($limit: Int!, $excludeBots: Boolean) {
    hallOfFameLeaderboard(limit: $limit, excludeBots: $excludeBots) {
      playerId
      playerNick
      score
      isBot
    }
  }
`;

// Tipos
export interface Player {
  name: string;
  id?: string;
}

export interface PlayerScoreEntry {
  playerId: number;
  playerNick?: string;
  score: number;
  isBot: boolean;
}

export interface PlayerInfo {
  online: number;
  max: number;
  players?: Player[];
}

export interface Version {
  name: string;
  protocol: number;
}

export interface ServerStatus {
  online: boolean;
  host: string;
  port: number;
  version?: Version;
  description?: string;
  players?: PlayerInfo;
  latency?: number;
  favicon?: string;
  queriedAt: string;
}

export interface ServerPing {
  online: boolean;
  host: string;
  port: number;
  latency?: number;
  measuredAt: string;
}

// Funciones helper
export async function getServerStatus(): Promise<ServerStatus> {
  const data = await graphqlClient.request<{ serverStatus: ServerStatus }>(GET_SERVER_STATUS);
  return data.serverStatus;
}

export async function getServerPing(): Promise<ServerPing> {
  const data = await graphqlClient.request<{ serverPing: ServerPing }>(GET_SERVER_PING);
  return data.serverPing;
}

export async function getHallOfFameLeaderboard(limit: number = 15, excludeBots: boolean = true): Promise<PlayerScoreEntry[]> {
  const data = await graphqlClient.request<{ hallOfFameLeaderboard: PlayerScoreEntry[] }>(
    GET_HALL_OF_FAME_LEADERBOARD, 
    { limit, excludeBots }
  );
  return data.hallOfFameLeaderboard;
}

export async function refreshPlayerStatsDb(): Promise<boolean> {
  const data = await graphqlClient.request<{ refreshPlayerStatsDb: boolean }>(REFRESH_PLAYER_STATS_DB);
  return data.refreshPlayerStatsDb;
}

