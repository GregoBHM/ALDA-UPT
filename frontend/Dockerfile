# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copiar el código y construir
COPY . .

# Pasar variables de entorno de Vite al proceso de build
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:1.27-alpine

# Configurar Nginx para que soporte React Router (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados del frontend a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
