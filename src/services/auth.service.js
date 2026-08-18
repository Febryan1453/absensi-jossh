const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/user.repository');
const teacherRepository = require('../repositories/teacher.repository');
const studentRepository = require('../repositories/student.repository');
const parentRepository = require('../repositories/parent.repository');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { withTransaction } = require('../config/database');
const { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } = require('../utils/appError');

class AuthService {
  /**
   * Register a new user with optional role-specific profile in an atomic transaction
   */
  async register(data) {
    const { name, email, password, role = 'student', profile = {} } = data;

    // Check if email already exists
    if (email) {
      const existingUser = await userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    const hashedPassword = await hashPassword(password);
    const userUuid = uuidv4();

    // Execute atomic creation of user and role profile
    const result = await withTransaction(async (conn) => {
      const userId = await userRepository.create(
        {
          uuid: userUuid,
          name,
          email: email || null,
          password: hashedPassword,
          role,
          status: 'active',
          email_verified_at: new Date()
        },
        conn
      );

      let createdProfile = null;

      if (role === 'teacher') {
        const teacherId = await teacherRepository.create(
          {
            user_id: userId,
            nip: profile.nip || null,
            phone: profile.phone || null,
            gender: profile.gender || null,
            birth_date: profile.birth_date || null,
            address: profile.address || null,
            status: 'active'
          },
          conn
        );
        createdProfile = { id: teacherId, role: 'teacher' };
      } else if (role === 'student') {
        if (!profile.class_id || !profile.nis) {
          throw new BadRequestError('class_id and nis are required when registering a student');
        }
        const studentId = await studentRepository.create(
          {
            user_id: userId,
            class_id: profile.class_id,
            nis: profile.nis,
            nisn: profile.nisn || null,
            gender: profile.gender || null,
            birth_place: profile.birth_place || null,
            birth_date: profile.birth_date || null,
            phone: profile.phone || null,
            address: profile.address || null,
            photo: profile.photo || null,
            status: 'active'
          },
          conn
        );
        createdProfile = { id: studentId, role: 'student' };
      } else if (role === 'parent') {
        const parentId = await parentRepository.create(
          {
            user_id: userId,
            nik: profile.nik || null,
            phone: profile.phone || null,
            gender: profile.gender || null,
            address: profile.address || null,
            occupation: profile.occupation || null,
            status: 'active'
          },
          conn
        );
        createdProfile = { id: parentId, role: 'parent' };
      }

      return { userId, createdProfile };
    });

    const user = await userRepository.findById(result.userId);
    const token = generateToken(user);

    return {
      user,
      profile: result.createdProfile,
      token
    };
  }

  /**
   * Login user with email and password
   */
  async login(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'blocked') {
      throw new UnauthorizedError('Account is blocked. Please contact administrator');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedError('Account is inactive');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // Fetch profile details according to role
    let profile = null;
    if (user.role === 'teacher') {
      profile = await teacherRepository.findByUserId(user.id);
    } else if (user.role === 'student') {
      profile = await studentRepository.findByUserId(user.id);
    } else if (user.role === 'parent') {
      profile = await parentRepository.findByUserId(user.id);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Sanitize user object (never return password)
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      profile,
      token
    };
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    let profile = null;
    if (user.role === 'teacher') {
      profile = await teacherRepository.findByUserId(user.id);
    } else if (user.role === 'student') {
      profile = await studentRepository.findByUserId(user.id);
      if (profile) {
        profile.parents = await studentRepository.getParents(profile.id);
      }
    } else if (user.role === 'parent') {
      profile = await parentRepository.findByUserId(user.id);
      if (profile) {
        profile.children = await parentRepository.getChildren(profile.id);
      }
    }

    return {
      user,
      profile
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userWithPassword = await userRepository.findByEmailWithPassword(user.email);
    const isMatch = await comparePassword(oldPassword, userWithPassword.password);
    if (!isMatch) {
      throw new BadRequestError('Current password does not match');
    }

    const newHashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { password: newHashedPassword });

    return true;
  }
}

module.exports = new AuthService();
