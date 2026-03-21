#!/usr/bin/env node

/**
 * Script de Teste dos Endpoints do Backend
 * Execução: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  log(colors.blue, '\n=== 🧪 TESTANDO BACKEND PHOTOAPP ===\n');

  try {
    // Test 1: Health Check
    log(colors.yellow, '1️⃣  Testando /health...');
    let res = await makeRequest('GET', '/health');
    if (res.status === 200) {
      log(colors.green, '✅ Health check OK\n');
    } else {
      log(colors.red, `❌ Erro: Status ${res.status}\n`);
    }

    // Test 2: Register User
    log(colors.yellow, '2️⃣  Registrando novo usuário...');
    const userData = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      role: 'promotor'
    };
    res = await makeRequest('POST', '/auth/register', userData);
    if (res.status === 201 && res.data.user) {
      const userId = res.data.user.id;
      log(colors.green, `✅ Usuário criado: ${userId}`);
      log(colors.green, `   Email: ${res.data.user.email}\n`);

      // Test 3: Login
      log(colors.yellow, '3️⃣  Fazendo login...');
      res = await makeRequest('POST', '/auth/login', {
        email: userData.email,
        password: userData.password
      });
      if (res.status === 200 && res.data.token) {
        const token = res.data.token;
        log(colors.green, `✅ Login realizado`);
        log(colors.green, `   Token: ${token.substring(0, 20)}...\n`);

        // Test 4: Get Admin Logs
        log(colors.yellow, '4️⃣  Buscando logs (com autenticação)...');
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/admin/logs',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const logRes = await new Promise((resolve) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve({ status: res.statusCode, data: json });
              } catch {
                resolve({ status: res.statusCode, data });
              }
            });
          });
          req.on('error', (err) => resolve({ status: 0, error: err.message }));
          req.end();
        });

        if (logRes.status === 200) {
          log(colors.green, `✅ Logs recuperados: ${logRes.data.logs?.length || 0} registros\n`);
        } else {
          log(colors.red, `❌ Erro ao recuperar logs: Status ${logRes.status}\n`);
        }

        // Test 5: Get all photos
        log(colors.yellow, '5️⃣  Buscando fotos...');
        res = await makeRequest('GET', '/photos');
        if (res.status === 200) {
          log(colors.green, `✅ Fotos recuperadas: ${res.data.photos?.length || 0} fotos\n`);
        } else {
          log(colors.red, `❌ Erro ao recuperar fotos\n`);
        }

        // Test 6: Get user photos
        log(colors.yellow, '6️⃣  Buscando fotos do usuário...');
        res = await makeRequest('GET', `/photos/${userId}`);
        if (res.status === 200) {
          log(colors.green, `✅ Fotos do usuário: ${res.data.photos?.length || 0} fotos\n`);
        } else {
          log(colors.red, `❌ Erro\n`);
        }

      } else {
        log(colors.red, `❌ Falha no login\n`);
      }
    } else {
      log(colors.red, `❌ Falha ao registrar usuário`);
      log(colors.red, `   Status: ${res.status}`);
      log(colors.red, `   Erro: ${res.data.error}\n`);
    }

    log(colors.green, '\n=== ✅ TESTES CONCLUÍDOS ===\n');

  } catch (err) {
    log(colors.red, `\n❌ ERRO: ${err.message}\n`);
    log(colors.yellow, 'Certifique-se de que o servidor está rodando em http://localhost:3001\n');
    log(colors.blue, 'Para iniciar o servidor, execute: npm start\n');
  }
}

runTests();
