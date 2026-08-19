/**
 * WhatsApp message template renderer.
 *
 * Pure string work: no database, no Express, no network. Templates are stored
 * with placeholders such as {nama_siswa} and are filled in right before a
 * message is handed to the gateway.
 *
 * The single most important rule here is that a parent must never receive the
 * word "undefined". A placeholder we do not recognise is therefore left exactly
 * as it was written, which makes the mistake obvious to the admin who wrote the
 * template instead of confusing the parent who reads the message.
 */

/** Variables offered to the admin in the template editor (frontend contract). */
const KNOWN_VARIABLES = [
  'nama_siswa',
  'kelas',
  'jam',
  'tanggal',
  'status',
  'nama_sekolah',
  'nama_wali'
];

/** Matches {nama_siswa} and the tolerated { nama_siswa } spelling. */
const PLACEHOLDER_PATTERN = /\{\s*([A-Za-z0-9_]+)\s*\}/g;

/**
 * Resolve a placeholder name against the supplied variables.
 * Lookup is exact first, then case insensitive, so {NAMA_SISWA} still works.
 * @param {object} vars
 * @param {string} name
 * @returns {{ found: boolean, value?: * }}
 */
const lookup = (vars, name) => {
  if (!vars || typeof vars !== 'object') return { found: false };

  if (Object.prototype.hasOwnProperty.call(vars, name)) {
    return { found: true, value: vars[name] };
  }

  const lower = name.toLowerCase();
  const key = Object.keys(vars).find((k) => k.toLowerCase() === lower);

  return key === undefined ? { found: false } : { found: true, value: vars[key] };
};

/**
 * Turn a variable value into message text.
 * Note that 0 and false are real values, only null/undefined become empty.
 * @param {*} value
 * @returns {string}
 */
const stringify = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
};

/**
 * Tidy up the whitespace an empty variable leaves behind.
 *
 * "Halo {nama_wali}, ananda ..." with an empty nama_wali would otherwise read
 * "Halo , ananda ...". Leading indentation of each line is preserved so bullet
 * lists in a template keep their shape.
 *
 * @param {string} text
 * @returns {string}
 */
const tidyWhitespace = (text) => text
  .split('\n')
  .map((line) => {
    const indent = (line.match(/^[ \t]*/) || [''])[0];
    const rest = line.slice(indent.length).replace(/[ \t]{2,}/g, ' ').replace(/\s+$/, '');
    // Repair the punctuation gap left by a removed value, e.g. "Halo ," -> "Halo,".
    return (indent + rest).replace(/ +([,.:;!?])/g, '$1');
  })
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

/**
 * Render a template body by substituting its placeholders.
 *
 * Behaviour:
 *  - a known variable with a value  -> replaced by that value
 *  - a known variable that is empty -> replaced by an empty string, and the
 *    leftover double spaces are cleaned up
 *  - an unknown variable            -> left untouched, never "undefined"
 *
 * A variable counts as known when it is one of KNOWN_VARIABLES or when the
 * caller supplied it in `vars`, so future templates (a homeroom summary, for
 * example) can pass extra variables without touching this file.
 *
 * Substitution is a single pass: a value that itself contains braces is not
 * scanned again.
 *
 * @param {string} body - template body, e.g. 'Ananda {nama_siswa} hadir {jam}'
 * @param {object} [vars] - e.g. { nama_siswa: 'Budi', jam: '07:02' }
 * @returns {string}
 */
const render = (body, vars = {}) => {
  if (typeof body !== 'string' || body === '') return '';

  const rendered = body.replace(PLACEHOLDER_PATTERN, (match, name) => {
    const hit = lookup(vars, name);

    if (hit.found) return stringify(hit.value);

    // Known variable the caller simply did not supply: treat it as empty.
    if (KNOWN_VARIABLES.includes(name.toLowerCase())) return '';

    // Unknown variable: keep the original text so nobody receives "undefined".
    return match;
  });

  return tidyWhitespace(rendered);
};

/**
 * List the placeholder names used in a template, in order, without duplicates.
 * @param {string} body
 * @returns {string[]}
 */
const extractVariables = (body) => {
  if (typeof body !== 'string') return [];

  const found = [];
  for (const match of body.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1].toLowerCase();
    if (!found.includes(name)) found.push(name);
  }

  return found;
};

/**
 * List placeholders that are not part of the supported variable set.
 * Useful for warning an admin while they are editing a template.
 * @param {string} body
 * @returns {string[]}
 */
const findUnknownVariables = (body) => extractVariables(body)
  .filter((name) => !KNOWN_VARIABLES.includes(name));

module.exports = {
  render,
  extractVariables,
  findUnknownVariables,
  KNOWN_VARIABLES
};
