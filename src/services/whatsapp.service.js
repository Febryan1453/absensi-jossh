const whatsappSettingRepository = require('../repositories/whatsappSetting.repository');
const whatsappTemplateRepository = require('../repositories/whatsappTemplate.repository');
const notificationRepository = require('../repositories/notification.repository');
const fonnte = require('./whatsapp/fonnte.provider');
const { render } = require('./whatsapp/template');
const { BadRequestError, NotFoundError } = require('../utils/appError');

/**
 * WhatsApp gateway service.
 *
 * The API key never leaves this layer. Anything travelling towards a client
 * goes through maskSettings() first: the key is the school's billing
 * credential, and a leaked one lets a stranger spend their message quota.
 */

/** Characters kept visible on each side of a masked key. */
const MASK_VISIBLE = 3;

/**
 * Sentinel returned in place of a stored key.
 *
 * ASCII on purpose. An earlier version used bullet characters, and they were
 * mangled into '?' somewhere between the browser and MySQL -- which made the
 * "is this the mask?" check below miss, and the real credential got
 * overwritten with punctuation. Every message then failed while the settings
 * screen still showed a key, so nothing looked wrong. Asterisks survive every
 * encoding this stack touches.
 */
const MASK_UNCHANGED = '********';

/**
 * Characters that can never appear in a real gateway credential but do appear
 * in a mask, including a mask damaged by a charset conversion. Used as a
 * second line of defence so this cannot silently break again if the sentinel
 * above is ever changed.
 */
const MASK_CHARS = /[*?\u2022\u00b7]/;

function maskKey(key) {
  if (!key) return '';
  if (key.length <= MASK_VISIBLE * 2) return MASK_UNCHANGED;
  return `${key.slice(0, MASK_VISIBLE)}${MASK_UNCHANGED}${key.slice(-MASK_VISIBLE)}`;
}

/** Shape sent to clients. Never includes the raw key. */
function maskSettings(row) {
  return {
    is_active: Boolean(row.is_active),
    provider: row.provider,
    base_url: row.base_url,
    api_key: maskKey(row.api_key),
    /** Lets the UI tell "no key yet" from "key set but hidden". */
    api_key_set: Boolean(row.api_key),
    sender: row.sender ?? '',
    send_on_arrival: Boolean(row.send_on_arrival),
    send_on_late: Boolean(row.send_on_late),
    send_on_departure: Boolean(row.send_on_departure),
    send_on_absent: Boolean(row.send_on_absent),
    quiet_hours_start: row.quiet_hours_start,
    quiet_hours_end: row.quiet_hours_end,
    simulation_mode: Boolean(row.simulation_mode),
    max_attempts: Number(row.max_attempts)
  };
}

/**
 * Seed the credential from the environment ONCE, then never again.
 *
 * The first version read the env var on every request as a silent fallback,
 * and that turned out to be dangerous rather than convenient: when a bug wiped
 * the stored key, the fallback kept the gateway working, so the damage stayed
 * invisible. The database is the single source of truth; the env var only
 * bootstraps a fresh install so nobody has to paste a key before the settings
 * screen has ever been opened.
 *
 * Returns the row as it now stands in the database.
 */
async function seedKeyFromEnv(row) {
  const fromEnv = (process.env.WA_API_KEY || '').trim();
  if (row.api_key || !fromEnv) return row;

  await whatsappSettingRepository.update({ api_key: fromEnv });
  return { ...row, api_key: fromEnv };
}

/** Defaults that are safe to derive on read because they carry no secret. */
function withDefaults(row) {
  return {
    ...row,
    base_url: row.base_url || process.env.WA_BASE_URL || fonnte.DEFAULT_BASE_URL,
    // Simulation stays on unless it was explicitly switched off in the
    // database. No environment variable may start real sending on its own.
    simulation_mode: row.simulation_mode === 0 ? false : true
  };
}

class WhatsappService {
  async getSettings() {
    const row = await whatsappSettingRepository.get();
    if (!row) throw new NotFoundError('WhatsApp settings row is missing');
    return maskSettings(withDefaults(await seedKeyFromEnv(row)));
  }

  /** Raw settings, key included. Internal callers only. */
  async getSettingsInternal() {
    const row = await whatsappSettingRepository.get();
    if (!row) throw new NotFoundError('WhatsApp settings row is missing');
    return withDefaults(await seedKeyFromEnv(row));
  }

  async updateSettings(payload = {}) {
    const data = { ...payload };

    /**
     * A key that comes back looking masked means the operator did not touch
     * that field, so it must be dropped rather than written. Storing the mask
     * would replace a working credential with bullet characters and every
     * message would fail afterwards -- silently, because the settings screen
     * would still show a key.
     */
    if (typeof data.api_key === 'string') {
      const kept = data.api_key.trim();
      // Anything empty, or carrying a masking character, means "not edited".
      // Refusing on the character class rather than on an exact match is what
      // makes this survive an encoding change: a mask that arrives damaged is
      // still recognisably not a credential.
      if (!kept || MASK_CHARS.test(kept)) delete data.api_key;
      else data.api_key = kept;
    }

    if (data.provider) data.provider = String(data.provider).toLowerCase();

    await whatsappSettingRepository.update(data);
    return this.getSettings();
  }

  async getTemplates() {
    return whatsappTemplateRepository.findAll();
  }

  async updateTemplates(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
      throw new BadRequestError('templates must be a non-empty array');
    }
    await whatsappTemplateRepository.upsertMany(list);
    return whatsappTemplateRepository.findAll();
  }

  /**
   * Check that the gateway accepts our credentials.
   *
   * Deliberately uses the device-status endpoint, which sends nothing. A
   * connection test that fires a real WhatsApp message would reach an actual
   * parent, and no amount of "it was only a test" takes that back.
   */
  async testConnection() {
    const settings = await this.getSettingsInternal();

    if (!settings.api_key) {
      return {
        ok: false,
        message: 'Kunci API gateway belum diisi.',
        latency_ms: null,
        simulation: settings.simulation_mode
      };
    }

    const hasil = await fonnte.checkDevice(settings.api_key, settings.base_url);

    return {
      ok: Boolean(hasil.ok),
      message: hasil.ok
        ? `Gateway terhubung. Perangkat ${hasil.device ?? '-'} berstatus ${hasil.status ?? '-'}` +
          (hasil.quota != null ? `, sisa kuota ${hasil.quota}.` : '.')
        : hasil.message || 'Gateway tidak dapat dihubungi.',
      latency_ms: hasil.latencyMs ?? null,
      simulation: settings.simulation_mode
    };
  }

  /**
   * Whether "now" falls inside the configured quiet hours. The window may wrap
   * past midnight (21:00 to 05:30), which is the normal case for a school.
   */
  isQuietHour(settings, now = new Date()) {
    const { quiet_hours_start: start, quiet_hours_end: end } = settings;
    if (!start || !end) return false;

    const menit = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return h * 60 + m;
    };
    const sekarang = now.getHours() * 60 + now.getMinutes();
    const a = menit(start);
    const b = menit(end);

    return a <= b ? sekarang >= a && sekarang < b : sekarang >= a || sekarang < b;
  }

  /** Maps an attendance event onto the template that describes it. */
  templateKeyFor(type) {
    switch (type) {
      case 'late': return 'siswa_terlambat';
      case 'check_out': return 'siswa_pulang';
      case 'absent': return 'siswa_alpa';
      default: return 'siswa_datang';
    }
  }

  /** Whether this event type is switched on in settings. */
  isEnabledFor(settings, type) {
    switch (type) {
      case 'late': return Boolean(settings.send_on_late);
      case 'check_out': return Boolean(settings.send_on_departure);
      case 'absent': return Boolean(settings.send_on_absent);
      default: return Boolean(settings.send_on_arrival);
    }
  }

  /**
   * Send one already-stored notification row through the gateway.
   *
   * Returns the row's new state rather than throwing on gateway failure: a
   * failed WhatsApp must never roll back an attendance record. The child was
   * present regardless of whether the message got through.
   */
  async dispatch(notification, { settings, target, vars } = {}) {
    const cfg = settings ?? (await this.getSettingsInternal());

    if (!cfg.is_active) {
      return { status: 'pending', reason: 'Gateway WhatsApp belum diaktifkan.' };
    }

    if (this.isQuietHour(cfg)) {
      // Held, not failed: it should go out once the quiet window ends.
      return { status: 'pending', reason: 'Ditahan jam tenang.' };
    }

    const tujuan = target ?? notification.parent_phone;
    if (!tujuan) {
      await notificationRepository.update(notification.id, {
        status: 'failed',
        error_message: 'Nomor tujuan tidak terdaftar di WhatsApp.'
      });
      return { status: 'failed', reason: 'Nomor tujuan tidak terdaftar.' };
    }

    const pesan = vars ? render(notification.message, vars) : notification.message;

    if (cfg.simulation_mode) {
      // Recorded as sent so the log tells the full story, but nothing left the
      // building. The simulation flag on the row is what keeps it honest.
      await notificationRepository.update(notification.id, {
        status: 'sent',
        sent_at: new Date(),
        error_message: null
      });
      return { status: 'sent', reason: 'Mode simulasi — pesan tidak dikirim.' };
    }

    const hasil = await fonnte.sendMessage({
      token: cfg.api_key,
      baseUrl: cfg.base_url,
      target: tujuan,
      message: pesan
    });

    await notificationRepository.update(notification.id, {
      status: hasil.ok ? 'sent' : 'failed',
      sent_at: hasil.ok ? new Date() : null,
      error_message: hasil.ok ? null : hasil.message
    });

    return { status: hasil.ok ? 'sent' : 'failed', reason: hasil.message };
  }

  async resend(id) {
    const row = await notificationRepository.findById(id);
    if (!row) throw new NotFoundError('Notification not found');
    if (row.channel !== 'whatsapp') {
      throw new BadRequestError('Only WhatsApp notifications can be resent');
    }
    await this.dispatch(row);
    return notificationRepository.findById(id);
  }

  /**
   * Retry every failed WhatsApp row.
   *
   * Sequential on purpose: gateways rate-limit, and a burst that trips the
   * limit turns a recoverable backlog into a permanently failed one.
   */
  async resendFailed() {
    const settings = await this.getSettingsInternal();
    const rows = await notificationRepository.findAll({
      channel: 'whatsapp',
      status: 'failed',
      limit: 200
    });

    let berhasil = 0;
    for (const row of rows) {
      const hasil = await this.dispatch(row, { settings });
      if (hasil.status === 'sent') berhasil += 1;
    }

    return {
      diproses: rows.length,
      berhasil,
      tetapGagal: rows.length - berhasil
    };
  }
}

module.exports = new WhatsappService();
module.exports.MASK_UNCHANGED = MASK_UNCHANGED;
