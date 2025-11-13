// Información de los mods del servidor y cliente

export interface Mod {
  name: string;
  version: string;
  description: string;
  required: boolean;
  link?: string;
  dependencies?: string[];
}

// Mods del servidor
export const serverMods: Mod[] = [
  {
    name: 'Architectury',
    version: '17.0.8',
    description: 'API de compatibilidad entre Fabric y Forge',
    required: false,
    link: 'https://modrinth.com/mod/architectury-api'
  },
  {
    name: 'Cloth Config',
    version: '19.0.147',
    description: 'Librería de configuración',
    required: false,
    link: 'https://modrinth.com/mod/cloth-config'
  },
  {
    name: 'Fabric API',
    version: '0.129.0+1.21.7',
    description: 'API esencial de Fabric. Requerida por la mayoría de mods.',
    required: false,
    link: 'https://modrinth.com/mod/fabric-api'
  },
  {
    name: 'Fabric Carpet',
    version: '1.21.7-1.4.177+v250630',
    description: 'Herramientas técnicas y debugging',
    required: false,
    link: 'https://modrinth.com/mod/carpet'
  },
  {
    name: 'Fabric Language Kotlin',
    version: '1.13.6+kotlin.2.2.20',
    description: 'Soporte para mods escritos en Kotlin',
    required: false,
    link: 'https://modrinth.com/mod/fabric-language-kotlin'
  },
  {
    name: 'Ferrite Core',
    version: '8.0.0',
    description: 'Optimización de memoria',
    required: false,
    link: 'https://modrinth.com/mod/ferrite-core'
  },
  {
    name: 'Lithium',
    version: '0.18.0+mc1.21.7',
    description: 'Optimización del servidor',
    required: false,
    link: 'https://modrinth.com/mod/lithium'
  },
  {
    name: 'Player Statistics',
    version: '1.21.7-2.1.1',
    description: 'Registra estadísticas detalladas de los jugadores.',
    required: false,
    link: 'https://modrinth.com/mod/player-statistics'
  },
  {
    name: 'Servux',
    version: '1.21.8-0.7.3',
    description: 'Sincronización de datos para mods cliente',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/servux'
  }
];

// Mods para cliente
export const clientMods: Mod[] = [
  {
    name: 'Architectury',
    version: '17.0.8',
    description: 'API de compatibilidad entre Fabric y Forge',
    required: false,
    link: 'https://modrinth.com/mod/architectury'
  },
  {
    name: 'BetterF3',
    version: '15.0.0',
    description: 'Mejora la pantalla de depuración (F3) con información más útil.',
    required: false,
    link: 'https://modrinth.com/mod/betterf3'
  },
  {
    name: 'Cloth Config',
    version: '19.0.147',
    description: 'Librería de configuración',
    required: false,
    link: 'https://modrinth.com/mod/cloth-config'
  },
  {
    name: 'Continuity',
    version: '3.0.1-beta.1+1.21.6',
    description: 'Mejora la conexión de texturas para bloques adyacentes.',
    required: false,
    link: 'https://modrinth.com/mod/continuity'
  },
  {
    name: 'Cull Leaves',
    version: '4.0.5',
    description: 'Optimización de rendimiento para el renderizado de hojas de árboles.',
    required: false,
    link: 'https://modrinth.com/mod/cullleaves'
  },
  {
    name: 'Fabric API',
    version: '0.129.0+1.21.7',
    description: 'API esencial de Fabric. Requerida por la mayoría de mods cliente.',
    required: false,
    link: 'https://modrinth.com/mod/fabric-api'
  },
  {
    name: 'Fabric Carpet',
    version: '1.21.7-1.4.177+v250630',
    description: 'Herramientas técnicas y debugging',
    required: false,
    link: 'https://modrinth.com/mod/carpet'
  },
  {
    name: 'Fabric Language Kotlin',
    version: '1.13.6+kotlin.2.2.20',
    description: 'Soporte para mods escritos en Kotlin',
    required: false,
    link: 'https://modrinth.com/mod/fabric-language-kotlin'
  },
  {
    name: 'Ferrite Core',
    version: '8.0.0',
    description: 'Optimización de memoria',
    required: false,
    link: 'https://modrinth.com/mod/ferrite-core'
  },
  {
    name: 'Just Zoom',
    version: '2.1.1',
    description: 'Permite un zoom más suave y configurable.',
    required: false,
    link: 'https://modrinth.com/mod/justzoom'
  },
  {
    name: 'Konkrete',
    version: '1.9.12',
    description: 'Librería necesaria para algunos mods.',
    required: false,
    link: 'https://modrinth.com/mod/konkrete'
  },
  {
    name: 'LambDynamicLights',
    version: '4.8.5+1.21.8',
    description: 'Items sostenidos y proyectiles emiten luz dinámica.',
    required: false,
    link: 'https://modrinth.com/mod/lambdynamiclights'
  },
  {
    name: 'Litematica',
    version: '1.21.8-0.23.4',
    description: 'Esquemas y planos de construcciones',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/litematica'
  },
  {
    name: 'Lithium',
    version: '0.18.0+mc1.21.7',
    description: 'Optimización del servidor',
    required: false,
    link: 'https://modrinth.com/mod/lithium'
  },
  {
    name: 'MaLiLib',
    version: '1.21.8-0.25.5',
    description: 'Librería de código compartida para varios mods de masa.',
    required: false,
    link: 'https://modrinth.com/mod/malilib'
  },
  {
    name: 'MiniHUD',
    version: '1.21.8-0.36.4',
    description: 'HUD informativo en pantalla',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/minihud'
  },
  {
    name: 'Mod Menu',
    version: '15.0.0',
    description: 'Permite configurar mods desde el juego.',
    required: false,
    link: 'https://modrinth.com/mod/modmenu'
  },
  {
    name: 'Roughly Enough Items',
    version: '20.0.811',
    description: 'Visor de recetas e items',
    required: false,
    link: 'https://modrinth.com/mod/rei'
  },
  {
    name: 'Sodium',
    version: '0.7.2+mc1.21.8',
    description: 'Optimización de rendimiento gráfico',
    required: false,
    link: 'https://modrinth.com/mod/sodium',
    dependencies: ['Fabric API']
  },
  {
    name: 'Sodium Extra',
    version: '0.6.6+mc1.21.6',
    description: 'Añade más opciones de configuración a Sodium.',
    required: false,
    link: 'https://modrinth.com/mod/sodium-extra',
    dependencies: ['Fabric API', 'Sodium']
  },
  {
    name: 'Tweakeroo',
    version: '1.21.8-0.25.4',
    description: 'Múltiples mejoras de QoL',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/tweakeroo',
    dependencies: ['Fabric API']
  }
];

