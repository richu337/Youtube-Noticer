importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: self.location.search.includes('apiKey=')
    ? new URLSearchParams(self.location.search).get('apiKey')
    : undefined,
  authDomain: self.location.search.includes('authDomain=')
    ? new URLSearchParams(self.location.search).get('authDomain')
    : undefined,
  projectId: self.location.search.includes('projectId=')
    ? new URLSearchParams(self.location.search).get('projectId')
    : undefined,
  storageBucket: self.location.search.includes('storageBucket=')
    ? new URLSearchParams(self.location.search).get('storageBucket')
    : undefined,
  messagingSenderId: self.location.search.includes('messagingSenderId=')
    ? new URLSearchParams(self.location.search).get('messagingSenderId')
    : undefined,
  appId: self.location.search.includes('appId=')
    ? new URLSearchParams(self.location.search).get('appId')
    : undefined,
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'YouTube Noticer', {
    body: body || '',
    icon: '/icon-192.png',
  })
})
