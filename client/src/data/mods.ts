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
    name: 'Cloth Config',
    version: '19.0.147',
    description: 'Librería de configuración',
    required: false,
    link: 'https://modrinth.com/mod/cloth-config'
  },
  {
    name: 'Architecture',
    version: '17.0.8',
    description: 'Bloques decorativos arquitectónicos',
    required: false,
    link: 'https://modrinth.com/mod/architecture'
  },
  {
    name: 'Fabric Carpet',
    version: '1.21.7-1.4.177+v250',
    description: 'Herramientas técnicas y debugging',
    required: false,
    link: 'https://modrinth.com/mod/carpet'
  },
  {
    name: 'Roughly Enough Items',
    version: '20.0.811',
    description: 'Visor de recetas e items',
    required: false,
    link: 'https://modrinth.com/mod/rei'
  },
  {
    name: 'Servux',
    version: '1.21.8-0.7.3',
    description: 'Sincronización de datos para mods cliente',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/servux'
  },
  {
    name: 'Player Statistics',
    version: '0.1.0',
    description: 'Registra estadísticas detalladas de los jugadores.',
    required: false,
    link: 'https://modrinth.com/mod/player-statistics' // Enlace de ejemplo
  }
];

// Mods para cliente
export const clientMods: Mod[] = [
  {
    name: 'Fabric API',
    version: '0.129.0+1.21.7',
    description: 'API esencial de Fabric. Requerida por la mayoría de mods cliente.',
    required: false,
    link: 'https://modrinth.com/mod/fabric-api'
  },
  {
    name: 'Sodium',
    version: '0.6.7+mc1.21.7',
    description: 'Optimización de rendimiento gráfico',
    required: false,
    link: 'https://modrinth.com/mod/sodium',
    dependencies: ['Fabric API']
  },
  {
    name: 'Iris Shaders',
    version: '1.9.3+mc1.21.7',
    description: 'Soporte para shaders',
    required: false,
    link: 'https://modrinth.com/mod/iris',
    dependencies: ['Fabric API', 'Sodium']
  },
  {
    name: 'MiniHUD',
    version: '0.35.0',
    description: 'HUD informativo en pantalla',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/minihud',
    dependencies: ['Fabric API']
  },
  {
    name: 'Litematica',
    version: '0.23.0',
    description: 'Esquemas y planos de construcciones',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/litematica',
    dependencies: ['Fabric API']
  },
  {
    name: 'Xaero\'s Minimap',
    version: 'Latest',
    description: 'Minimapa en tiempo real',
    required: false,
    link: 'https://modrinth.com/mod/xaeros-minimap',
    dependencies: ['Fabric API']
  },
  {
    name: 'AppleSkin',
    version: 'Latest',
    description: 'Información de comida y saturación',
    required: false,
    link: 'https://modrinth.com/mod/appleskin',
    dependencies: ['Fabric API']
  },
  {
    name: 'Item Scroller',
    version: 'Latest',
    description: 'Mejor manejo de items en inventario',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/item-scroller',
    dependencies: ['Fabric API']
  },
  {
    name: 'Tweakeroo',
    version: 'Latest',
    description: 'Múltiples mejoras de QoL',
    required: false,
    link: 'https://www.curseforge.com/minecraft/mc-mods/tweakeroo',
    dependencies: ['Fabric API']
  }
];

