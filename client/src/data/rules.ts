// Reglas del servidor TSM Kartel & Comp.

export interface Rule {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'important' | 'info';
}

export const serverRules: Rule[] = [
  {
    id: 1,
    title: 'No Cheating',
    description: 'El uso de hacks, x-ray, fly hacks o cualquier software de terceros que proporcione una ventaja injusta está estrictamente prohibido.',
    severity: 'critical'
  },
  {
    id: 2,
    title: 'No Griefing',
    description: 'No destruyas, modifiques o robes construcciones o propiedades de otros jugadores sin su permiso explícito.',
    severity: 'critical'
  }
];

export const serverInfo = {
  name: 'TSM Kartel & Comp.',
  version: '1.21.7',
  modloader: 'Fabric',
  description: 'Servidor vanilla+ con mods técnicos y de construcción para una experiencia mejorada de Minecraft.',
};

