// Wer diese Tagesform betreibt – für Datenschutzerklärung und Impressum, aus Umgebungsvariablen in Vercel.
// Ohne Name und Kontakt bleibt die offene Registrierung zu: Wer fremde Gesundheitsdaten speichert, muss sagen, wer er ist.
const DATENSCHUTZ_VERSION = '2026-10-27';

const text = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function betreiber() {
  const name = text(process.env.BETREIBER_NAME, 120), kontakt = text(process.env.BETREIBER_KONTAKT, 200);
  const anschrift = text(process.env.BETREIBER_ANSCHRIFT, 300);
  return { name: name || null, kontakt: kontakt || null, anschrift: anschrift || null, vollstaendig: !!(name && kontakt) };
}

module.exports = { betreiber, DATENSCHUTZ_VERSION };
