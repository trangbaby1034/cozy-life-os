/* Cozy Life OS – service worker: cho app chạy offline.
   MỖI LẦN SỬA APP: tăng VERSION để điện thoại nhận bản mới. */
const VERSION = 'cozy-2026.11.18-4';
const SHELL = [
  './', './index.html', './app.js', './db.js', './backup.js', './exercises.js', './vendor/confetti.js', './vendor/body-highlighter.js', './manifest.webmanifest',
  './fonts/fonts.css',
  './fonts/quicksand-vietnamese-wght-normal.woff2', './fonts/quicksand-latin-ext-wght-normal.woff2', './fonts/quicksand-latin-wght-normal.woff2',
  './fonts/nunito-vietnamese-wght-normal.woff2', './fonts/nunito-latin-ext-wght-normal.woff2', './fonts/nunito-latin-wght-normal.woff2',
  /* hình tư thế bài tập (Everkinetic, CC BY-SA 4.0) – danh sách do tools tạo */
  './img/ex/Barbell_Bench_Press-Medium_Grip-1.svg', './img/ex/Barbell_Bench_Press-Medium_Grip-2.svg', './img/ex/Barbell_Curl-1.svg', './img/ex/Barbell_Curl-2.svg', './img/ex/Barbell_Deadlift-1.svg', './img/ex/Barbell_Deadlift-2.svg', './img/ex/Barbell_Squat-1.svg', './img/ex/Barbell_Squat-2.svg', './img/ex/Bench_Dips-1.svg', './img/ex/Bench_Dips-2.svg', './img/ex/Bent_Over_Barbell_Row-1.svg', './img/ex/Bent_Over_Barbell_Row-2.svg', './img/ex/Bodyweight_Walking_Lunge-1.svg', './img/ex/Bodyweight_Walking_Lunge-2.svg', './img/ex/Butt_Lift_Bridge-1.svg', './img/ex/Butt_Lift_Bridge-2.svg', './img/ex/Calf_Raise_On_A_Dumbbell-1.svg', './img/ex/Calf_Raise_On_A_Dumbbell-2.svg', './img/ex/Chin_To_Chest_Stretch-1.svg', './img/ex/Concentration_Curls-1.svg', './img/ex/Concentration_Curls-2.svg', './img/ex/Crunches-1.svg', './img/ex/Crunches-2.svg', './img/ex/Dumbbell_Bench_Press-1.svg', './img/ex/Dumbbell_Bench_Press-2.svg', './img/ex/Dumbbell_Bicep_Curl-1.svg', './img/ex/Dumbbell_Bicep_Curl-2.svg', './img/ex/Dumbbell_Flyes-1.svg', './img/ex/Dumbbell_Flyes-2.svg', './img/ex/Dumbbell_Lunges-1.svg', './img/ex/Dumbbell_Lunges-2.svg', './img/ex/Dumbbell_One-Arm_Triceps_Extension-1.svg', './img/ex/Dumbbell_One-Arm_Triceps_Extension-2.svg', './img/ex/Dumbbell_Shoulder_Press-1.svg', './img/ex/Dumbbell_Shoulder_Press-2.svg', './img/ex/Dumbbell_Step_Ups-1.svg', './img/ex/Dumbbell_Step_Ups-2.svg', './img/ex/Hammer_Curls-1.svg', './img/ex/Hammer_Curls-2.svg', './img/ex/Hyperextensions_Back_Extensions-1.svg', './img/ex/Hyperextensions_Back_Extensions-2.svg', './img/ex/Incline_Dumbbell_Press-1.svg', './img/ex/Incline_Dumbbell_Press-2.svg', './img/ex/Inverted_Row-1.svg', './img/ex/Inverted_Row-2.svg', './img/ex/Leg_Extensions-1.svg', './img/ex/Leg_Extensions-2.svg', './img/ex/Leg_Press-1.svg', './img/ex/Leg_Press-2.svg', './img/ex/Lying_Leg_Curls-1.svg', './img/ex/Lying_Leg_Curls-2.svg', './img/ex/Machine_Bench_Press-1.svg', './img/ex/Machine_Bench_Press-2.svg', './img/ex/Machine_Shoulder_Military_Press-1.svg', './img/ex/Machine_Shoulder_Military_Press-2.svg', './img/ex/Pullups-1.svg', './img/ex/Pullups-2.svg', './img/ex/Push-Ups-Close_Triceps_Position-1.svg', './img/ex/Push-Ups-Close_Triceps_Position-2.svg', './img/ex/Pushups-1.svg', './img/ex/Pushups-2.svg', './img/ex/Reverse_Flyes-1.svg', './img/ex/Reverse_Flyes-2.svg', './img/ex/Romanian_Deadlift-1.svg', './img/ex/Romanian_Deadlift-2.svg', './img/ex/Seated_Cable_Rows-1.svg', './img/ex/Seated_Cable_Rows-2.svg', './img/ex/Seated_Calf_Raise-1.svg', './img/ex/Seated_Calf_Raise-2.svg', './img/ex/Seated_Leg_Curl-1.svg', './img/ex/Seated_Leg_Curl-2.svg', './img/ex/Side_Bridge-1.svg', './img/ex/Side_Bridge-2.svg', './img/ex/Side_Lateral_Raise-1.svg', './img/ex/Side_Lateral_Raise-2.svg', './img/ex/Side_Neck_Stretch-1.svg', './img/ex/Side_Neck_Stretch-2.svg', './img/ex/Standing_Calf_Raises-1.svg', './img/ex/Standing_Calf_Raises-2.svg', './img/ex/Stiff-Legged_Dumbbell_Deadlift-1.svg', './img/ex/Stiff-Legged_Dumbbell_Deadlift-2.svg', './img/ex/Superman-1.svg', './img/ex/Superman-2.svg', './img/ex/Tricep_Dumbbell_Kickback-1.svg', './img/ex/Tricep_Dumbbell_Kickback-2.svg', './img/ex/Triceps_Pushdown-1.svg', './img/ex/Triceps_Pushdown-2.svg', './img/ex/Triceps_Pushdown-Rope_Attachment-1.svg', './img/ex/Triceps_Pushdown-Rope_Attachment-2.svg', './img/ex/Wide-Grip_Lat_Pulldown-1.svg', './img/ex/Wide-Grip_Lat_Pulldown-2.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

/* Bản mới tự kích hoạt ngay khi tải xong (iPhone hay "giữ chờ" bản mới nếu không làm vậy) */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (req.mode === 'navigate') {
      return (await cache.match('./index.html')) || fetch(req);
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return new Response('', { status: 504 });
    }
  })());
});
