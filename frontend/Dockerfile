# Imagen base ligera de Node 20 Alpine
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Arrancar Vite exponiendo el host para permitir acceso desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]