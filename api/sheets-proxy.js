export default async function handler(req, res) {
  const { sheetId = '1X7xtW4YrjEv43t1byX6CjMFxh4UKsZft00KQJuXEroc' } = req.query || {};
  try {
    const targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const resp = await fetch(targetUrl);
    if (!resp.ok) {
      return res.status(resp.status).send('Error fetching spreadsheet from Google');
    }
    const csv = await resp.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).send(err.message || 'Internal server error proxying Google Sheets');
  }
}
