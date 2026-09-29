// Vercel Serverless Function: /api/lead
// Принимает заявку с сайта и создаёт лид в Bitrix24 через входящий вебхук.
//
// Секретный URL вебхука хранится ТОЛЬКО в переменной окружения Vercel
// (Settings → Environment Variables → BITRIX_WEBHOOK_URL). Он никогда не
// попадает в код, который получает браузер — поэтому даже если бы на сайте
// нашлась XSS-уязвимость, вытащить эту ссылку со страницы было бы нельзя:
// её там физически нет, она существует только здесь, на сервере.
//
// Защита от спама/флуда (максимально возможная без платных сервисов):
// 1) лимит запросов с одного IP (антифлуд);
// 2) проверка Origin/Referer — запросы должны идти именно с сайта arjan.kz;
// 3) honeypot-поле — скрытое поле, которое видят только боты-парсеры;
// 4) минимальное время между загрузкой формы и отправкой (боты шлют мгновенно);
// 5) ограничение длины и формата полей.
// Это не остановит по-настоящему целенаправленную атаку (для этого нужна
// капча — можно добавить отдельно), но полностью закрывает вариант
// "кто-то от скуки жмёт кнопку" или простой скрипт-спамер.

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 минут
const RATE_LIMIT_MAX = 5; // не больше 5 заявок с одного IP за это окно

// Живёт, пока "тёплый" инстанс функции не перезапустится — это best-effort
// защита, а не гарантия (у serverless нет одной вечной памяти), но она
// реально ловит быстрый спам-флуд, который и является типичной угрозой.
const rateLimitStore = global.__arjanLeadRateLimit || (global.__arjanLeadRateLimit = new Map());

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  // periodic cleanup чтобы Map не рос бесконечно
  if (rateLimitStore.size > 5000) {
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.start > RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(key);
    }
  }
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

var ALLOWED_HOSTS = ['arjan.kz', 'www.arjan.kz', 'arjan-site-plum.vercel.app', 'localhost'];

function isAllowedOrigin(req) {
  var origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return true; // заголовок иногда отсутствует у обычных браузеров — не блокируем вслепую
  return ALLOWED_HOSTS.some(function (h) { return origin.indexOf(h) !== -1; });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  var ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок, попробуйте позже' });
  }

  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('BITRIX_WEBHOOK_URL is not set in Vercel Environment Variables');
    return res.status(500).json({ ok: false, error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // honeypot: обычный человек это поле не видит и не заполняет
    if ((body.website || '').toString().trim()) {
      // делаем вид, что всё ок, чтобы не подсказывать боту, что его вычислили
      return res.status(200).json({ ok: true, leadId: null });
    }

    // если форма "отправлена" быстрее чем за 1.5 секунды после загрузки —
    // это либо бот, либо автозаполнение скриптом, а не живой человек
    const loadedAt = Number(body.loadedAt) || 0;
    if (loadedAt && Date.now() - loadedAt < 1500) {
      return res.status(200).json({ ok: true, leadId: null });
    }

    const name = (body.name || '').toString().trim().slice(0, 200);
    const phone = (body.phone || '').toString().trim();
    const city = (body.city || '').toString().trim().slice(0, 200);
    const product = (body.product || '').toString().trim().slice(0, 200);
    const comment = (body.comment || '').toString().trim().slice(0, 2000);
    const source = (body.source || '').toString().trim().slice(0, 200);
    const role = (body.role || '').toString().trim().slice(0, 100);
    const company = (body.company || '').toString().trim().slice(0, 200);
    const objectType = (body.objectType || '').toString().trim().slice(0, 100);
    const size = (body.size || '').toString().trim().slice(0, 100);

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || phone.length > 30) {
      return res.status(400).json({ ok: false, error: 'Invalid phone' });
    }

    const commentLines = [];
    if (role) commentLines.push('Тип клиента: ' + role);
    if (objectType) commentLines.push('Тип объекта: ' + objectType);
    if (company) commentLines.push('Компания: ' + company);
    if (city) commentLines.push('Город: ' + city);
    if (product) commentLines.push('Продукция: ' + product);
    if (size) commentLines.push('Размеры: ' + size);
    if (comment) commentLines.push('Комментарий: ' + comment);
    if (source) commentLines.push('Страница: ' + source);

    const titleParts = ['Заявка с сайта arjan.kz'];
    if (role) titleParts.push(role);
    else if (product) titleParts.push(product);

    const params = new URLSearchParams();
    params.append('fields[TITLE]', titleParts.join(' — '));
    params.append('fields[NAME]', name || 'Без имени');
    if (company) params.append('fields[COMPANY_TITLE]', company);
    params.append('fields[PHONE][0][VALUE]', phone);
    params.append('fields[PHONE][0][VALUE_TYPE]', 'WORK');
    if (commentLines.length) params.append('fields[COMMENTS]', commentLines.join('\n'));
    params.append('fields[SOURCE_DESCRIPTION]', 'arjan.kz');
    params.append('params[REGISTER_SONET_EVENT]', 'Y');

    const endpoint = webhookUrl.replace(/\/?$/, '/') + 'crm.lead.add.json';

    const bitrixRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await bitrixRes.json();

    if (!bitrixRes.ok || data.error) {
      console.error('Bitrix24 error:', data.error_description || data.error || bitrixRes.status);
      return res.status(502).json({ ok: false, error: 'CRM error' });
    }

    return res.status(200).json({ ok: true, leadId: data.result });
  } catch (err) {
    console.error('Lead submit error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
