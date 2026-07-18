// NexCondo Service Worker v3
const CACHE_NAME = 'nexcondo-v3';

self.addEventListener('install', function(e) {
  // Forçar ativação imediata — limpar cache antigo
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return clients.claim(); })
  );
});

// NÃO interceptar fetch — deixar tudo passar
// SW existe apenas para notificações push

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {
    data = {title:'NexCondo', body: e.data ? e.data.text() : 'Nova notificação'};
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'NexCondo', {
      body: data.body || 'Você tem uma mensagem do condomínio.',
      icon: '/icon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(function(list){
      if(list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
