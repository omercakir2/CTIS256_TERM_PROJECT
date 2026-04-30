# Node.js 18 sürümünü kullanıyoruz
FROM node:18

# Konteynır içinde çalışacağımız klasör
WORKDIR /usr/src/app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install

# Tüm proje kodunu kopyala
COPY . .

EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "dev"]