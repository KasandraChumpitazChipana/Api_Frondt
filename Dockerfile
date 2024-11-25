# Usa una versión reciente de Node.js
FROM node:16

# Crear el directorio /app dentro del contenedor
RUN mkdir -p /app

# Establecer /app como el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json para instalar las dependencias
COPY package*.json /app

# Instalar dependencias de manera confiable con npm ci
RUN npm ci

# Copiar el resto de la aplicación
COPY . /app

# Verificar la versión de node y npm
RUN node -v
RUN npm -v

# Mostrar el contenido del directorio (para ver si todo se copió correctamente)
RUN ls -al /app

# Ejecutar el build en modo producción con salida detallada
RUN npm run build --prod --verbose

# Exponer el puerto 4200 (puerto de Angular por defecto)
EXPOSE 4200

# Configurar el contenedor para ejecutar la aplicación con npm start
CMD ["npm", "start"]
