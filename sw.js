// NexCondo Service Worker — Push Notifications
const CACHE_NAME = 'nexcondo-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// Receber push notification
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = {title:'NexCondo', body: e.data ? e.data.text() : 'Nova notificação'}; }
  
  var options = {
    body: data.body || 'Você tem uma nova mensagem do condomínio.',
    icon: data.icon || '/icon-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/', moradorId: data.moradorId },
    actions: [
      { action: 'ver', title: '👁 Ver agora' },
      { action: 'fechar', title: '✕ Fechar' }
    ],
    requireInteraction: true
  };
  
  e.waitUntil(
    self.registration.showNotification(data.title || 'NexCondo', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if (e.action === 'fechar') return;
  var url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Sync em background
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-movimentacoes') {
    console.log('Background sync: movimentacoes');
  }
});
