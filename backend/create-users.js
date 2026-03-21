const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createTestUsers() {
  console.log(' Criando usuários de teste...\n');

  try {
    // Criar admin
    console.log(' Criando administrador...');
    const adminRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Administrador',
      email: 'admin@photoapp.com',
      password: 'admin123',
      role: 'admin'
    });

    if (adminRes.status === 201) {
      console.log(' Admin criado com sucesso!');
      console.log('   Email: admin@photoapp.com');
      console.log('   Senha: admin123\n');
    } else {
      console.log('  Admin já existe ou erro:', adminRes.data.error);
    }

    // Criar promotor
    console.log(' Criando promotor...');
    const promotorRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Promotor Silva',
      email: 'promotor@photoapp.com',
      password: 'promo123',
      role: 'promotor'
    });

    if (promotorRes.status === 201) {
      console.log('Promotor criado com sucesso!');
      console.log('   Email: promotor@photoapp.com');
      console.log('   Senha: promo123\n');
    } else {
      console.log('  Promotor já existe ou erro:', promotorRes.data.error);
    }

    console.log(' Usuários criados! Agora você pode testar os logins.');

  } catch (err) {
    console.error(' Erro geral:', err.message);
    console.log('\n Certifique-se de que o servidor está rodando: npm start');
  }
}

createTestUsers();