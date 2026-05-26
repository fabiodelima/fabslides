/**
   🎭 FABSLIDES WEBSOCKET SIGNALING SERVER
   Servidor de Comunicação Bidirecional para Controle Remoto e Teleprompter Sincronizado
   ========================================================================== */

const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Mapa de Salas: { [sessionId: string]: { host: WebSocket, remotes: Set<WebSocket> } }
const rooms = new Map();

wss.on('connection', (ws) => {
  let userSessionId = null;
  let userRole = null;

  console.log('[WS] Nova conexão estabelecida.');

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.warn('[WS] Erro parsing JSON:', e.message);
      return;
    }

    // 1. Registro de Conexão na Sala
    if (data.type === 'register') {
      const { sessionId, role } = data;
      userSessionId = sessionId;
      userRole = role;

      if (!rooms.has(sessionId)) {
        rooms.set(sessionId, { host: null, remotes: new Set() });
      }

      const room = rooms.get(sessionId);

      if (role === 'host') {
        room.host = ws;
        console.log(`[WS] Host registrado com sucesso na sala: ${sessionId}`);
        
        // Solicita sincronização de estado se já existirem controles conectados
        if (room.remotes.size > 0) {
          ws.send(JSON.stringify({ type: 'request-state' }));
        }
      } else if (role === 'remote') {
        room.remotes.add(ws);
        console.log(`[WS] Controle Remoto conectado na sala: ${sessionId}`);
        
        // Se o Host já existir, pede para ele enviar seu estado para o celular
        if (room.host) {
          room.host.send(JSON.stringify({ type: 'request-state' }));
        }
      }
      return;
    }

    // Retorna se o usuário não se registrou em nenhuma sala
    if (!userSessionId || !rooms.has(userSessionId)) return;
    const room = rooms.get(userSessionId);

    // 2. Encaminhamento de Comandos (Remoto -> Host)
    if (data.type === 'command') {
      if (userRole === 'remote' && room.host && room.host.readyState === 1) {
        room.host.send(JSON.stringify(data));
      }
      return;
    }

    // 3. Encaminhamento de Atualizações de Estado (Host -> Remoto)
    if (data.type === 'state-update') {
      if (userRole === 'host') {
        room.remotes.forEach(remoteWs => {
          if (remoteWs.readyState === 1) {
            remoteWs.send(JSON.stringify(data));
          }
        });
      }
      return;
    }
  });

  // 4. Limpeza de Recursos ao Desconectar
  ws.on('close', () => {
    console.log(`[WS] Conexão encerrada para papel: ${userRole}`);
    if (userSessionId && rooms.has(userSessionId)) {
      const room = rooms.get(userSessionId);
      
      if (userRole === 'host') {
        room.host = null;
        console.log(`[WS] Host desconectado da sala: ${userSessionId}`);
      } else if (userRole === 'remote') {
        room.remotes.delete(ws);
        console.log(`[WS] Controle Remoto removido da sala: ${userSessionId}`);
      }

      // Deleta a sala inteira se estiver vazia
      if (!room.host && room.remotes.size === 0) {
        rooms.delete(userSessionId);
        console.log(`[WS] Sala ${userSessionId} inativa removida.`);
      }
    }
  });
});

console.log(`[WS] Servidor de sinalização FabSlides rodando com sucesso na porta: ${PORT}`);
