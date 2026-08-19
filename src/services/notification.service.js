const notificationRepository = require('../repositories/notification.repository');
const parentRepository = require('../repositories/parent.repository');
const { NotFoundError, ForbiddenError } = require('../utils/appError');

class NotificationService {
  async getAll(query, currentUser) {
    const { student_attendance_id, status, type, channel, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let targetParentId = query.parent_id;

    if (currentUser.role === 'parent') {
      const parentProfile = await parentRepository.findByUserId(currentUser.id);
      if (!parentProfile) throw new ForbiddenError('Parent profile not found');
      targetParentId = parentProfile.id;
    }

    const [items, total, unreadCount] = await Promise.all([
      notificationRepository.findAll({
        parent_id: targetParentId,
        student_attendance_id,
        status,
        type,
        channel,
        limit,
        offset
      }),
      notificationRepository.countAll({
        parent_id: targetParentId,
        student_attendance_id,
        status,
        type,
        channel
      }),
      targetParentId ? notificationRepository.countUnreadByParent(targetParentId) : 0
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, currentUser) {
    const item = await notificationRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Notification with ID ${id} not found`);
    }

    if (currentUser.role === 'parent') {
      const parentProfile = await parentRepository.findByUserId(currentUser.id);
      if (!parentProfile || parentProfile.id !== item.parent_id) {
        throw new ForbiddenError('You cannot view another parent notification');
      }
    }

    return item;
  }

  async markAsRead(id, currentUser) {
    await this.getById(id, currentUser);
    await notificationRepository.markAsRead(id);
    return true;
  }

  async markAllAsRead(currentUser) {
    if (currentUser.role !== 'parent') {
      throw new ForbiddenError('Only parents can mark their notifications as read in bulk');
    }

    const parentProfile = await parentRepository.findByUserId(currentUser.id);
    if (!parentProfile) throw new ForbiddenError('Parent profile not found');

    const affected = await notificationRepository.markAllAsReadByParent(parentProfile.id);
    return { affectedRows: affected };
  }
}

module.exports = new NotificationService();
