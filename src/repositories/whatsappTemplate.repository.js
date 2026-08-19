const { pool } = require('../config/database');
const { BadRequestError } = require('../utils/appError');

/**
 * The six keys of the whatsapp_templates ENUM, in declaration order.
 *
 * Kept here as well as in the column so a bad key is answered with a readable
 * 400 instead of a raw SQL error -- PUT /whatsapp/templates has no validation
 * middleware in front of it.
 */
const TEMPLATE_KEYS = Object.freeze([
  'siswa_datang',
  'siswa_terlambat',
  'siswa_pulang',
  'siswa_alpa',
  'ringkasan_wali_kelas',
  'izin_disetujui'
]);

const TEMPLATE_COLUMNS = `
      id, template_key, name, body, is_active, created_at, updated_at
`;

/** Same recognised words as whatsappSetting.repository.js. */
const TRUE_WORDS = ['1', 'true', 'yes', 'ya', 'on', 'aktif'];
const FALSE_WORDS = ['0', 'false', 'no', 'tidak', 'off', 'nonaktif'];

const toBool = (value, fallback) => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? (value !== 0 ? 1 : 0) : fallback;
  if (typeof value === 'string') {
    const word = value.trim().toLowerCase();
    if (TRUE_WORDS.includes(word)) return 1;
    if (FALSE_WORDS.includes(word)) return 0;
  }
  return fallback;
};

class WhatsappTemplateRepository {
  /**
   * List the message templates.
   *
   * The column is named template_key, not `key`, because KEY is reserved in
   * MySQL; the service layer renames it to `key` for the public contract.
   *
   * ORDER BY template_key sorts by the ENUM's declaration order, not
   * alphabetically -- so the list always arrives in the contract's own order
   * (datang, terlambat, pulang, alpa, ringkasan, izin) and the settings screen
   * does not have to re-sort it. id breaks ties that the UNIQUE key already
   * makes impossible, kept only so the ordering stays total.
   */
  async findAll({ is_active } = {}, conn = pool) {
    let sql = `SELECT ${TEMPLATE_COLUMNS} FROM whatsapp_templates WHERE 1=1`;
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    sql += ' ORDER BY template_key ASC, id ASC';

    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async findByKey(templateKey, conn = pool) {
    const sql = `SELECT ${TEMPLATE_COLUMNS} FROM whatsapp_templates WHERE template_key = ? LIMIT 1`;
    const [rows] = await conn.execute(sql, [templateKey]);
    return rows[0] || null;
  }

  /**
   * Insert or update templates by their key.
   *
   * Accepts the key under either name. The database column is template_key, but
   * the client sends `key` -- that is what the frontend contract calls it. Only
   * reading template_key made every template save answer
   * "Bind parameters must not contain undefined" with a 500, which was
   * reproduced against the running server; the whole editing screen was dead.
   *
   * Written as an upsert against uq_whatsapp_template_key so the settings
   * screen can save the whole list in one call without first checking which
   * keys already exist. It never deletes: a key the caller leaves out keeps
   * whatever text it had, so a partial save cannot wipe a template the admin
   * was not even looking at.
   *
   * Pass a transaction connection to make the whole list one atomic save --
   * otherwise a failure halfway leaves some templates updated and some not.
   */
  async upsertMany(list = [], conn = pool) {
    if (!Array.isArray(list) || list.length === 0) return 0;

    const sql = `
      INSERT INTO whatsapp_templates (template_key, name, body, is_active)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = COALESCE(NULLIF(VALUES(name), ''), name),
        body = VALUES(body),
        is_active = VALUES(is_active)
    `;

    let affected = 0;
    for (const item of list) {
      const row = item || {};
      const templateKey = row.template_key ?? row.key;

      if (!TEMPLATE_KEYS.includes(templateKey)) {
        throw new BadRequestError(
          `Unknown template key "${String(templateKey)}". Valid keys: ${TEMPLATE_KEYS.join(', ')}`
        );
      }

      // Rejected rather than defaulted: an empty body means the message that
      // reaches a parent would be empty too, and that is worth an error the
      // admin can read instead of a template that quietly stops saying anything.
      if (typeof row.body !== 'string' || !row.body.trim()) {
        throw new BadRequestError(`Template "${templateKey}" has no message body`);
      }

      // A blank name keeps the stored one (see COALESCE above), so a caller may
      // update only the body without having to repeat the label.
      const name = typeof row.name === 'string' ? row.name.trim() : '';

      await conn.execute(sql, [templateKey, name, row.body, toBool(row.is_active, 1)]);
      affected++;
    }
    return affected;
  }
}

module.exports = new WhatsappTemplateRepository();
