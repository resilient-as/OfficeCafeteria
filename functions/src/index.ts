import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onCall } from 'firebase-functions/v2/https';

admin.initializeApp();

export const deleteAuthUser = onCall(
  { enforceAppCheck: false }, // you can enable if using App Check
  async (request) => {
    const { auth, data } = request;

    if (!auth || !auth.token.admin) {
      throw new Error('Permission denied. Only admins can delete users.');
    }

    const { uid } = data;
    if (!uid) {
      throw new Error('UID is required.');
    }

    try {
      await admin.auth().deleteUser(uid);
      logger.info(`Deleted user ${uid}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user', error);
      throw new Error('User deletion failed.');
    }
  }
);
