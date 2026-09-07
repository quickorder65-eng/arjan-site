// Vercel Serverless Function: /api/lead
// Принимает заявку с сайта и создаёт лид в Bitrix24 через входящий вебхук.
// Секретный URL вебхука хранится ТОЛЬКО в переменной окружения Vercel
// (Settings → Environment Variables → BITRIX_WEBHOOK_URL) — здесь и в коде
// репозитория его нет и быть не должно.

module.exports = async function handler(req, res) {
  // Разрешаем только POST — форма с сайта шлёт именно так
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('BITRIX_WEBHOOK_URL is not set in Vercel Environment Variables');
    return res.status(500).json({ ok: false, error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = (body.name || '').toString().trim().slice(0, 200);
    const phone = (body.phone || '').toString().trim();
    const city = (body.city || '').toString().trim().slice(0, 200);
    const product = (body.product || '').toString().trim().slice(0, 200);
    const comment = (body.comment || '').toString().trim().slice(0, 2000);
    const source = (body.source || '').toString().trim().slice(0, 200);

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({ ok: false, error: 'Invalid phone' });
    }

    const commentLines = [];
    if (city) commentLines.push('Город: ' + city);
    if (product) commentLines.push('Продукция: ' + product);
    if (comment) commentLines.push('Комментарий: ' + comment);
    if (source) commentLines.push('Страница: ' + source);

    const params = new URLSearchParams();
    params.append('fields[TITLE]', 'Заявка с сайта arjan.kz' + (product ? ' — ' + product : ''));
    params.append('fields[NAME]', name || 'Без имени');
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
