import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError, sendCreated } from '../utils/response.js';

export async function syncUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { uid, email } = req.user;
    const { name } = req.body as { name?: string };

    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // Update last login
      user.updatedAt = new Date();
      if (name && !user.name) user.name = name;
      await user.save();
      sendSuccess(res, user);
    } else {
      // Create new user on first login
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || '',
      });
      sendCreated(res, user);
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    sendError(res, 'Failed to sync user');
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Error getting profile:', error);
    sendError(res, 'Failed to get profile');
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { name, phone } = req.body as { name?: string; phone?: string };

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { ...(name && { name }), ...(phone && { phone }) },
      { new: true }
    );

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Error updating profile:', error);
    sendError(res, 'Failed to update profile');
  }
}

// Address Management
export async function getAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user.addresses);
  } catch (error) {
    console.error('Error getting addresses:', error);
    sendError(res, 'Failed to get addresses');
  }
}

export async function addAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) { sendError(res, 'User not found', 404); return; }

    const address = req.body;

    // If new address is default, unset other defaults
    if (address.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    user.addresses.push(address);
    await user.save();
    sendCreated(res, user.addresses);
  } catch (error) {
    console.error('Error adding address:', error);
    sendError(res, 'Failed to add address');
  }
}

export async function updateAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) { sendError(res, 'User not found', 404); return; }

    const { id } = req.params;
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === id
    );

    if (addressIndex === -1) {
      sendError(res, 'Address not found', 404);
      return;
    }

    const updatedAddress = { ...(user.addresses[addressIndex] as any).toObject(), ...req.body };

    // If updated address is default, unset others
    if (updatedAddress.isDefault) {
      user.addresses.forEach((addr, i) => {
        if (i !== addressIndex) addr.isDefault = false;
      });
    }

    user.addresses[addressIndex] = updatedAddress;
    await user.save();
    sendSuccess(res, user.addresses);
  } catch (error) {
    console.error('Error updating address:', error);
    sendError(res, 'Failed to update address');
  }
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) { sendError(res, 'User not found', 404); return; }

    const { id } = req.params;
    user.addresses = user.addresses.filter((addr) => addr._id?.toString() !== id);
    await user.save();
    sendSuccess(res, user.addresses);
  } catch (error) {
    console.error('Error deleting address:', error);
    sendError(res, 'Failed to delete address');
  }
}
