const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/hash');
const {
  BadRequestError,
  ConflictError,
  NotFoundError
} = require('../utils/appError');

const ROLES = ['admin', 'teacher', 'student', 'parent'];

/**
 * Account administration.
 *
 * The repository already had every query this needs; what was missing was any
 * route to reach them. Accounts could be created through /auth/register and
 * then never listed, edited, or disabled again — a staff member who left the
 * school kept a working login forever, and nobody could see that they had one.
 */
class UserService {
  async getAll(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // An unrecognised role is refused rather than ignored. Dropping the filter
    // instead would answer a request for one kind of account with a list of
    // every account in the school — including the administrators — and the
    // caller would have no way to tell that the narrowing they asked for never
    // happened.
    const roles = String(query.role || '')
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);

    const asing = roles.filter((r) => !ROLES.includes(r));
    if (asing.length) {
      throw new BadRequestError(
        `Unknown role: ${asing.join(', ')}. Allowed roles are ${ROLES.join(', ')}`
      );
    }

    const filter = {
      role: roles.length ? roles : undefined,
      status: query.status || undefined,
      search: query.search || undefined
    };

    const [items, total] = await Promise.all([
      userRepository.findAll({ ...filter, limit, offset }),
      userRepository.countAll(filter)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * @param {number} actorId id of the administrator performing the change.
   *   Passed in so the two lockout guards below can see who is acting; without
   *   it the service cannot tell a routine edit from an admin removing their
   *   own access.
   */
  async update(id, data, actorId) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const { name, email, role, status } = data;

    if (email !== undefined && email !== user.email) {
      const taken = await userRepository.findByEmailWithPassword(email);
      if (taken && String(taken.id) !== String(id)) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    // An administrator must not be able to remove their own access. It is a
    // single click, it takes effect immediately, and the person who made the
    // mistake is by definition the one who can no longer sign in to undo it.
    if (String(id) === String(actorId)) {
      if (role !== undefined && role !== user.role) {
        throw new BadRequestError('You cannot change your own role');
      }
      if (status !== undefined && status !== 'active') {
        throw new BadRequestError('You cannot deactivate your own account');
      }
    }

    // Backstop: the school must keep at least one active administrator.
    //
    // Through PUT /users/:id this cannot currently fire. The caller is always
    // an active admin (authenticateToken rejects inactive accounts,
    // requireRole rejects non-admins), so if the target is a *different* active
    // admin the count is already two. It is kept because it guards the service,
    // not the route: any future caller — a seeding script, a bulk import, a
    // second entry point that passes a different actorId — reaches this method
    // without the guard above, and locking every administrator out of a school
    // attendance system is not a mistake worth leaving room for.
    const kehilanganAdmin =
      user.role === 'admin' &&
      user.status === 'active' &&
      ((role !== undefined && role !== 'admin') || (status !== undefined && status !== 'active'));

    if (kehilanganAdmin) {
      const aktif = await userRepository.countAll({ role: 'admin', status: 'active' });
      if (aktif <= 1) {
        throw new BadRequestError(
          'This is the last active administrator; promote another administrator first'
        );
      }
    }

    await userRepository.update(id, { name, email, role, status });
    return userRepository.findById(id);
  }

  /**
   * Administrative password reset.
   *
   * Deliberately separate from update(): a password never travels in the same
   * request as a name change, so it cannot be set by accident, and the audit
   * of "who changed what" stays readable.
   */
  async resetPassword(id, password) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const hashed = await hashPassword(password);
    await userRepository.update(id, { password: hashed });
    return true;
  }
}

module.exports = new UserService();
