const { pool } = require('../config/database');

// whatsapp_settings is a single-row table (see database/schema.sql section 18).
// The CHECK constraint makes any id but 1 impossible, so no caller ever has to
// pass one -- "the settings" is always this row.
const SETTING_ID = 1;

const SETTING_COLUMNS = `
      id, is_active, provider, base_url, api_key, sender,
      send_on_arrival, send_on_late, send_on_departure, send_on_absent,
      quiet_hours_start, quiet_hours_end, simulation_mode, max_attempts,
      created_at, updated_at
`;

/**
 * Accept 'HH:MM' as well as 'HH:MM:SS' for the quiet-hours columns.
 * The frontend contract sends 'HH:MM'; MySQL would take it, but only by
 * guessing at the missing field. Padding it here keeps what we store identical
 * to what we read back, so a saved '21:00' never reappears as something else.
 */
const normalizeTime = (value) => {
  if (typeof value !== 'string') return value;
  return /^\d{1,2}:\d{2}$/.test(value) ? `${value}:00` : value;
};

/**
 * Boolean words this repository is willing to recognise, matching the reader on
 * the other side of the wire (frontend/src/api/backend/whatsapp.ts, keBoolean).
 */
const TRUE_WORDS = ['1', 'true', 'yes', 'ya', 'on', 'aktif'];
const FALSE_WORDS = ['0', 'false', 'no', 'tidak', 'off', 'nonaktif'];

/**
 * Read a boolean column value, or undefined when the input does not actually
 * say true or false.
 *
 * The naive `value ? 1 : 0` is wrong in both directions here, and there is no
 * validation middleware in front of PUT /whatsapp/settings to catch it:
 *
 *   is_active: 'false'      -> truthy -> 1 -> the gateway is switched ON by a
 *                              request that was asking to switch it off.
 *   simulation_mode: null   -> falsy  -> 0 -> the interlock that stops real
 *                              messages reaching parents is switched OFF by a
 *                              field the caller never meant to send.
 *
 * Both were reproduced against the running server before this guard existed.
 * Anything that is not a recognisable boolean is therefore treated as "not
 * provided" and leaves the stored value alone -- a partial update must never
 * be able to arm or disarm the sender by accident.
 */
const toBool = (value) => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? (value !== 0 ? 1 : 0) : undefined;
  if (typeof value === 'string') {
    const word = value.trim().toLowerCase();
    if (TRUE_WORDS.includes(word)) return 1;
    if (FALSE_WORDS.includes(word)) return 0;
  }
  return undefined;
};

/**
 * The API returns api_key masked. If the admin edits any other field and saves,
 * that mask travels back here unchanged -- and writing it would destroy the real
 * token, breaking every later send with no obvious cause. Gateway tokens are
 * alphanumeric (Fonnte and Wablas) or base64url (Meta Cloud), so a value
 * carrying any of the mask characters is never a real key: treat it as
 * "unchanged" rather than overwriting.
 *
 * The character class is deliberately the same one the frontend refuses to send
 * (BERTANDA_SENSOR in frontend/src/api/backend/whatsapp.ts): star, bullet,
 * middle dot and black circle. Keep the two in step -- a mask character that
 * only one side knows about is a mask that gets written to the database.
 */
const isMaskedKey = (value) => typeof value === 'string' && /[*•·●]/.test(value);

class WhatsappSettingRepository {
  /**
   * Read the one settings row.
   *
   * Returns api_key RAW -- the sender needs the real token. The service layer
   * must mask it before it reaches any HTTP response.
   * Returns provider lowercase ('fonnte'); the public contract spells it
   * 'FONNTE', so the reader uppercases on the way out.
   */
  async get(conn = pool) {
    const sql = `SELECT ${SETTING_COLUMNS} FROM whatsapp_settings WHERE id = ? LIMIT 1`;
    const [rows] = await conn.execute(sql, [SETTING_ID]);
    return rows[0] || null;
  }

  /**
   * Partial update of the settings row. Only the keys present in `data` are
   * written, so a caller sending just { simulation_mode: false } cannot blank
   * out the gateway credentials by omission.
   *
   * Written as an upsert on purpose. A plain UPDATE silently does nothing when
   * the row is missing (database seeded without it), and the admin's save would
   * vanish with a success response. Columns left out of `data` fall back to the
   * table defaults on first insert -- which is how simulation_mode still starts
   * TRUE even on a settings row created by the very first save.
   *
   * Every field is checked for shape, not merely for presence. This route takes
   * req.body straight from the controller with no validation middleware, so
   * this method is the last place a malformed value can be stopped before it
   * decides whether real WhatsApp messages leave the building.
   */
  async update(data = {}, conn = pool) {
    const columns = ['id'];
    const values = [SETTING_ID];
    const assignments = [];
    const assignParams = [];

    const setField = (column, value) => {
      columns.push(column);
      values.push(value);
      assignments.push(`${column} = ?`);
      assignParams.push(value);
    };

    /** Write a boolean column only when the input really says true or false. */
    const setBool = (column, value) => {
      if (value === undefined) return;
      const flag = toBool(value);
      if (flag !== undefined) setField(column, flag);
    };

    /**
     * Write a text column only when the input is actually text. Coercing here
     * would store '[object Object]' in a column the gateway later reads.
     */
    const setText = (column, value) => {
      if (value === undefined) return;
      if (typeof value === 'string') setField(column, value);
    };

    const {
      is_active,
      provider,
      base_url,
      api_key,
      sender,
      send_on_arrival,
      send_on_late,
      send_on_departure,
      send_on_absent,
      quiet_hours_start,
      quiet_hours_end,
      simulation_mode,
      max_attempts
    } = data;

    setBool('is_active', is_active);
    // Contract sends 'FONNTE'; the ENUM stores 'fonnte'.
    if (typeof provider === 'string') setField('provider', provider.trim().toLowerCase());
    setText('base_url', base_url);

    // An empty key is treated as "unchanged" too. Nothing in the product asks
    // to erase a credential, while a blank field arriving from a half-filled
    // form would silently stop every notification.
    if (typeof api_key === 'string' && api_key.trim() && !isMaskedKey(api_key)) {
      setField('api_key', api_key.trim());
    }

    setText('sender', sender);
    setBool('send_on_arrival', send_on_arrival);
    setBool('send_on_late', send_on_late);
    setBool('send_on_departure', send_on_departure);
    setBool('send_on_absent', send_on_absent);

    // Only a string is passed on; null would hit a NOT NULL column and fail as
    // a raw SQL error. A malformed string still goes through, so MySQL rejects
    // '25:99' loudly instead of this layer quietly inventing a quiet hour.
    if (typeof quiet_hours_start === 'string') {
      setField('quiet_hours_start', normalizeTime(quiet_hours_start.trim()));
    }
    if (typeof quiet_hours_end === 'string') {
      setField('quiet_hours_end', normalizeTime(quiet_hours_end.trim()));
    }

    setBool('simulation_mode', simulation_mode);

    // Only a real integer is passed on. Out-of-range integers still travel to
    // MySQL so chk_whatsapp_setting_max_attempts can reject them loudly, but
    // 'abc' used to arrive as NaN and surface as a check-constraint error that
    // described neither the field nor the problem.
    if (max_attempts !== undefined && max_attempts !== null && max_attempts !== '') {
      const attempts = Number(max_attempts);
      if (Number.isInteger(attempts)) setField('max_attempts', attempts);
    }

    if (assignments.length === 0) return false;

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `
      INSERT INTO whatsapp_settings (${columns.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${assignments.join(', ')}
    `;

    await conn.execute(sql, [...values, ...assignParams]);

    // affectedRows is 0 when the submitted values already match the stored ones.
    // That is a successful no-op, not a miss, so it must not be reported as a
    // failed update -- the statement either threw or the row is now correct.
    return true;
  }
}

module.exports = new WhatsappSettingRepository();
