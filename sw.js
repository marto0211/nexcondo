// NexCondo Service Worker v2 — Push Notifications
const CACHE_NAME = 'nexcondo-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Limpar caches antigos
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return clients.claim();})
  );
});

// Não interceptar fetch — deixar tudo passar normalmente
// O SW é apenas para notificações push

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = {title:'NexCondo', body: e.data ? e.data.text() : 'Nova notificação'}; }
  var options = {
    body: data.body || 'Você tem uma nova mensagem do condomínio.',
    icon: data.icon || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    requireInteraction: false
  };
  e.waitUntil(self.registration.showNotification(data.title || 'NexCondo', options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(function(list){
      for(var i=0;i<list.length;i++){if('focus' in list[i])return list[i].focus();}
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
