#!/bin/sh

echo "Initializing database..."
cd /app

# 데이터 디렉토리 확인
mkdir -p /app/data

# Prisma 데이터베이스 초기화
npx prisma db push --accept-data-loss --skip-generate

echo "Database initialized. Starting server..."
node server.js

