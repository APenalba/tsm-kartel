#!/bin/bash

# Script para ejecutar el servidor en modo desarrollo

echo "🚀 Iniciando Minecraft Server GraphQL API en modo desarrollo..."

# Verificar si existe .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Copiando desde env.example..."
    cp env.example .env
    echo "📝 Por favor, edita .env con los datos de tu servidor Minecraft"
    exit 1
fi

# Verificar si existe el entorno virtual
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar/actualizar dependencias
echo "📥 Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar el servidor
echo "✨ Iniciando servidor..."
echo "🌐 GraphQL Playground disponible en: http://localhost:8000/graphql"
echo "📖 Documentación de la API en: http://localhost:8000"
echo ""
python -m src.main
