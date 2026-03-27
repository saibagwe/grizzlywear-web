import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ─── NOTIFICATION HELPER ──────────────────────────────────────────────────────

/**
 * Creates a notification document in the `notifications` collection.
 * Checks for duplicate notifications with the same referenceId + type within 1 minute.
 */
async function createNotification(data: {
  type: 'order' | 'cancellation' | 'review' | 'ticket' | 'user' | 'stock';
  category: 'orders' | 'reviews' | 'tickets' | 'users';
  title: string;
  message: string;
  referenceId: string;
  referenceUrl: string;
  triggeredBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
}): Promise<void> {
  try {
    // Duplicate check: same referenceId + type within last 1 minute
    const oneMinuteAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 60000);
    const dupCheck = await db
      .collection('notifications')
      .where('referenceId', '==', data.referenceId)
      .where('type', '==', data.type)
      .where('createdAt', '>=', oneMinuteAgo)
      .limit(1)
      .get();

    if (!dupCheck.empty) {
      functions.logger.info(
        `[createNotification] Skipping duplicate ${data.type} notification for referenceId ${data.referenceId}`
      );
      return;
    }

    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      notificationId: notifRef.id,
      type: data.type,
      category: data.category,
      title: data.title,
      message: data.message,
      referenceId: data.referenceId,
      referenceUrl: data.referenceUrl,
      triggeredBy: data.triggeredBy,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(
      `[createNotification] Created ${data.type} notification: "${data.title}" for ref ${data.referenceId}`
    );
  } catch (err) {
    functions.logger.error('[createNotification] Failed to write notification:', err);
  }
}

// ─── onOrderCreated ──────────────────────────────────────────────────────────
// Handles: stock decrement + order notification + low stock/out of stock alerts

export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const orderData = snapshot.data();
    const firestoreOrderId = context.params.orderId;
    const humanOrderId = orderData?.orderId || firestoreOrderId;

    if (!orderData) {
      functions.logger.error(`[onOrderCreated] No data for order ${firestoreOrderId}`);
      return null;
    }

    // ── NEW ORDER NOTIFICATION ────────────────────────────────────────────────
    const customerName = orderData.customerName || 'A customer';
    const customerEmail = orderData.customerEmail || '';
    const total = orderData.total ?? orderData.pricing?.total ?? 0;

    await createNotification({
      type: 'order',
      category: 'orders',
      title: 'New Order Placed',
      message: `${customerName} placed a new order #${humanOrderId} worth ₹${total}`,
      referenceId: humanOrderId,
      referenceUrl: `/admin/orders/${firestoreOrderId}`,
      triggeredBy: {
        userId: orderData.userId || '',
        userName: customerName,
        userEmail: customerEmail,
      },
    });

    // ── PAYMENT RECEIVED (online payment at order time) ──────────────────────
    const paymentMethod = orderData.paymentMethod ?? orderData.payment?.method ?? 'cod';
    const paymentStatus = orderData.paymentStatus ?? orderData.payment?.status ?? '';
    if (
      (paymentMethod === 'online' || paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'upi') &&
      (paymentStatus === 'paid' || paymentStatus === 'paid_online')
    ) {
      await createNotification({
        type: 'order',
        category: 'orders',
        title: 'Payment Received',
        message: `Payment of ₹${total} received for order #${humanOrderId}`,
        referenceId: `payment-${humanOrderId}`,
        referenceUrl: `/admin/orders/${firestoreOrderId}`,
        triggeredBy: {
          userId: orderData.userId || '',
          userName: customerName,
          userEmail: customerEmail,
        },
      });
    }

    // ── STOCK DECREMENT (existing logic) ─────────────────────────────────────
    const items: Array<{ productId: string; size: string; quantity: number; name: string }> =
      (orderData.items || []).map((item: any) => ({
        productId: item.productId ?? '',
        size: item.size ?? '',
        quantity: Number(item.quantity) || 1,
        name: item.name ?? '',
      }));

    if (items.length === 0) {
      functions.logger.warn(`[onOrderCreated] Order ${humanOrderId} has no items — skipping stock decrement.`);
      return null;
    }

    try {
      await db.runTransaction(async (tx) => {
        // ── 1. Read all product documents inside the transaction ──────────────
        const productReads: Array<{
          ref: admin.firestore.DocumentReference;
          snap: admin.firestore.DocumentSnapshot;
          item: typeof items[0];
        }> = [];

        for (const item of items) {
          if (!item.productId) {
            functions.logger.warn(`[onOrderCreated] Item "${item.name}" has no productId — skipping.`);
            continue;
          }
          const ref = db.collection('products').doc(item.productId);
          const snap = await tx.get(ref);
          if (!snap.exists) {
            functions.logger.warn(
              `[onOrderCreated] Product ${item.productId} ("${item.name}") not found — skipping stock decrement for this item.`
            );
            continue;
          }
          productReads.push({ ref, snap, item });
        }

        // ── 2. Compute new stock and write updates ────────────────────────────
        for (const { ref, snap, item } of productReads) {
          const pData = snap.data() as admin.firestore.DocumentData;
          const stockData = pData.stock;

          if (typeof stockData === 'object' && stockData !== null) {
            // Size-wise map: { S: 10, M: 5, L: 2 }
            const newStock: Record<string, number> = { ...stockData };
            const currentSizeStock = Number(newStock[item.size] ?? 0);

            if (currentSizeStock <= 0) {
              functions.logger.error(
                `[onOrderCreated] Order ${humanOrderId}: "${item.name}" (size ${item.size}) is already out of stock. Setting to 0.`
              );
              newStock[item.size] = 0;
            } else {
              const decremented = currentSizeStock - item.quantity;
              if (decremented < 0) {
                functions.logger.error(
                  `[onOrderCreated] Order ${humanOrderId}: Stock for "${item.name}" (size ${item.size}) would go negative (${decremented}). Clamping to 0.`
                );
                newStock[item.size] = 0;
              } else {
                newStock[item.size] = decremented;
              }
            }

            const totalStock = Object.values(newStock).reduce(
              (sum: number, val: any) => sum + (Number(val) || 0),
              0
            );

            const updatePayload: Record<string, any> = {
              stock: newStock,
              totalStock: Math.max(0, totalStock),
              inStock: totalStock > 0,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Mark product as out_of_stock if every size is exhausted
            if (totalStock === 0) {
              updatePayload.status = 'out_of_stock';
            }

            tx.update(ref, updatePayload);

            functions.logger.info(
              `[onOrderCreated] Order ${humanOrderId}: Decremented "${item.name}" size ${item.size} by ${item.quantity}. New stock: ${newStock[item.size]}, total: ${totalStock}.`
            );

            // ── STOCK ALERTS (outside transaction, best-effort) ──────────────
            // We schedule these after the transaction completes below
          } else {
            // Flat numeric stock
            const currentStock = Number(stockData ?? 0);
            const decremented = currentStock - item.quantity;
            const newStock = Math.max(0, decremented);

            if (decremented < 0) {
              functions.logger.error(
                `[onOrderCreated] Order ${humanOrderId}: Stock for "${item.name}" would go negative (${decremented}). Clamping to 0.`
              );
            }

            const updatePayload: Record<string, any> = {
              stock: newStock,
              totalStock: newStock,
              inStock: newStock > 0,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (newStock === 0) {
              updatePayload.status = 'out_of_stock';
            }

            tx.update(ref, updatePayload);

            functions.logger.info(
              `[onOrderCreated] Order ${humanOrderId}: Decremented "${item.name}" by ${item.quantity}. New stock: ${newStock}.`
            );
          }
        }
      });

      functions.logger.info(
        `[onOrderCreated] Stock decrement transaction completed successfully for order ${humanOrderId}.`
      );

      // ── POST-TRANSACTION: Check for low stock / out of stock alerts ────────
      for (const item of items) {
        if (!item.productId) continue;
        try {
          const productSnap = await db.collection('products').doc(item.productId).get();
          if (!productSnap.exists) continue;
          const pData = productSnap.data()!;
          const stockData = pData.stock;

          if (typeof stockData === 'object' && stockData !== null) {
            const sizeStock = Number(stockData[item.size] ?? 0);
            const productName = pData.name || item.name || 'Unknown Product';

            if (sizeStock === 0) {
              await createNotification({
                type: 'stock',
                category: 'orders',
                title: 'Out of Stock Alert',
                message: `${productName} — Size ${item.size} is now out of stock`,
                referenceId: `stock-${item.productId}-${item.size}`,
                referenceUrl: `/admin/products/${item.productId}`,
                triggeredBy: {
                  userId: 'system',
                  userName: 'System',
                  userEmail: '',
                },
              });
            } else if (sizeStock <= 10) {
              await createNotification({
                type: 'stock',
                category: 'orders',
                title: 'Low Stock Alert',
                message: `${productName} — Size ${item.size} is running low (${sizeStock} left)`,
                referenceId: `stock-${item.productId}-${item.size}`,
                referenceUrl: `/admin/products/${item.productId}`,
                triggeredBy: {
                  userId: 'system',
                  userName: 'System',
                  userEmail: '',
                },
              });
            }
          }
        } catch (stockErr) {
          functions.logger.warn(
            `[onOrderCreated] Failed to check stock alert for product ${item.productId}:`,
            stockErr
          );
        }
      }
    } catch (err) {
      functions.logger.error(
        `[onOrderCreated] Failed to decrement stock for order ${humanOrderId}:`,
        err
      );
    }

    return null;
  });

// ─── onOrderUpdated ──────────────────────────────────────────────────────────
// Handles: cancellation notification + stock restoration

export const onOrderCancelled = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const firestoreOrderId = context.params.orderId;
    const humanOrderId = after?.orderId || firestoreOrderId;

    // Only act when status transitions TO 'cancelled'
    if (before?.status === 'cancelled' || after?.status !== 'cancelled') {
      return null;
    }

    // ── CANCELLATION NOTIFICATION ────────────────────────────────────────────
    const customerName = after.customerName || 'A customer';
    const customerEmail = after.customerEmail || '';

    await createNotification({
      type: 'cancellation',
      category: 'orders',
      title: 'Order Cancelled',
      message: `${customerName} cancelled order #${humanOrderId}`,
      referenceId: humanOrderId,
      referenceUrl: `/admin/orders/${firestoreOrderId}`,
      triggeredBy: {
        userId: after.userId || '',
        userName: customerName,
        userEmail: customerEmail,
      },
    });

    // ── STOCK RESTORATION (existing logic) ──────────────────────────────────
    const items: Array<{ productId: string; size: string; quantity: number; name: string }> =
      (after.items || []).map((item: any) => ({
        productId: item.productId ?? '',
        size: item.size ?? '',
        quantity: Number(item.quantity) || 1,
        name: item.name ?? '',
      }));

    if (items.length === 0) {
      functions.logger.warn(`[onOrderCancelled] Order ${humanOrderId} has no items — skipping stock restoration.`);
      return null;
    }

    try {
      await db.runTransaction(async (tx) => {
        const productReads: Array<{
          ref: admin.firestore.DocumentReference;
          snap: admin.firestore.DocumentSnapshot;
          item: typeof items[0];
        }> = [];

        for (const item of items) {
          if (!item.productId) {
            functions.logger.warn(`[onOrderCancelled] Item "${item.name}" has no productId — skipping.`);
            continue;
          }
          const ref = db.collection('products').doc(item.productId);
          const snap = await tx.get(ref);
          if (!snap.exists) {
            functions.logger.warn(
              `[onOrderCancelled] Product ${item.productId} ("${item.name}") not found — skipping stock restoration for this item.`
            );
            continue;
          }
          productReads.push({ ref, snap, item });
        }

        for (const { ref, snap, item } of productReads) {
          const pData = snap.data() as admin.firestore.DocumentData;
          const stockData = pData.stock;

          if (typeof stockData === 'object' && stockData !== null) {
            const newStock: Record<string, number> = { ...stockData };
            const currentSizeStock = Number(newStock[item.size] ?? 0);
            newStock[item.size] = currentSizeStock + item.quantity;

            const totalStock = Object.values(newStock).reduce(
              (sum: number, val: any) => sum + (Number(val) || 0),
              0
            );

            const updatePayload: Record<string, any> = {
              stock: newStock,
              totalStock: Math.max(0, totalStock),
              inStock: totalStock > 0,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (totalStock > 0 && pData.status === 'out_of_stock') {
              updatePayload.status = 'active';
            }

            tx.update(ref, updatePayload);

            functions.logger.info(
              `[onOrderCancelled] Order ${humanOrderId}: Restored "${item.name}" size ${item.size} by ${item.quantity}. New stock: ${newStock[item.size]}, total: ${totalStock}.`
            );
          } else {
            const currentStock = Number(stockData ?? 0);
            const newStock = currentStock + item.quantity;

            const updatePayload: Record<string, any> = {
              stock: Math.max(0, newStock),
              totalStock: Math.max(0, newStock),
              inStock: newStock > 0,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (newStock > 0 && pData.status === 'out_of_stock') {
              updatePayload.status = 'active';
            }

            tx.update(ref, updatePayload);

            functions.logger.info(
              `[onOrderCancelled] Order ${humanOrderId}: Restored "${item.name}" by ${item.quantity}. New stock: ${Math.max(0, newStock)}.`
            );
          }
        }
      });

      functions.logger.info(
        `[onOrderCancelled] Stock restoration transaction completed successfully for order ${humanOrderId}.`
      );
    } catch (err) {
      functions.logger.error(
        `[onOrderCancelled] Failed to restore stock for order ${humanOrderId}:`,
        err
      );
    }

    return null;
  });

// ─── onReviewWritten ────────────────────────────────────────────────────────
// Handles: recalculate average rating + new review notification

export const onReviewWritten = functions.firestore
  .document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const reviewId = context.params.reviewId;
    const isCreate = !change.before.exists && change.after.exists;
    const data = change.after.exists ? change.after.data() : change.before.data();
    if (!data || !data.productId) return null;

    const productId = data.productId;

    // ── NEW REVIEW NOTIFICATION ──────────────────────────────────────────────
    if (isCreate) {
      const userName = data.userName || data.customerName || 'A user';
      const userEmail = data.customerEmail || '';
      const rating = data.rating ?? 0;

      // Fetch product name
      let productName = data.productName || 'a product';
      try {
        const productSnap = await db.collection('products').doc(productId).get();
        if (productSnap.exists) {
          productName = productSnap.data()?.name || productName;
        }
      } catch (_) { /* best effort */ }

      await createNotification({
        type: 'review',
        category: 'reviews',
        title: 'New Review Submitted',
        message: `${userName} submitted a ${rating}★ review for ${productName} — pending approval`,
        referenceId: reviewId,
        referenceUrl: `/admin/reviews/${reviewId}`,
        triggeredBy: {
          userId: data.userId || '',
          userName,
          userEmail,
        },
      });
    }

    // ── RECALCULATE AVERAGE RATING (existing logic) ─────────────────────────
    try {
      const reviewsRef = db.collection('reviews');
      const snapshot = await reviewsRef
        .where('productId', '==', productId)
        .where('status', '==', 'approved')
        .get();
      
      let totalRating = 0;
      let reviewCount = 0;

      snapshot.forEach(doc => {
        const review = doc.data();
        if (typeof review.rating === 'number') {
          totalRating += review.rating;
          reviewCount++;
        }
      });

      const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

      const productRef = db.collection('products').doc(productId);
      const productSnap = await productRef.get();
      if (productSnap.exists) {
        await productRef.update({
          averageRating: averageRating,
          reviewCount: reviewCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info(`[onReviewWritten] Updated product ${productId}: avgRating ${averageRating}, count ${reviewCount}`);
      } else {
        functions.logger.warn(`[onReviewWritten] Product ${productId} not found. Cannot update ratings.`);
      }
    } catch (err) {
      functions.logger.error(`[onReviewWritten] Failed to update product ${productId} rating:`, err);
    }
    return null;
  });

// ─── onTicketCreated ────────────────────────────────────────────────────────

export const onTicketCreated = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const ticketDocId = context.params.ticketId;

    if (!data) return null;

    const customerName = data.customerName || 'A user';
    const customerEmail = data.customerEmail || '';
    const subject = data.subject || 'No subject';
    const ticketId = data.ticketId || ticketDocId;

    await createNotification({
      type: 'ticket',
      category: 'tickets',
      title: 'New Support Ticket',
      message: `${customerName} raised a new ticket: ${subject}`,
      referenceId: ticketId,
      referenceUrl: `/admin/tickets/${ticketDocId}`,
      triggeredBy: {
        userId: data.userId || '',
        userName: customerName,
        userEmail: customerEmail,
      },
    });

    return null;
  });

// ─── onTicketUpdated — Detect new reply ──────────────────────────────────────

export const onTicketUpdated = functions.firestore
  .document('tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const ticketDocId = context.params.ticketId;

    if (!before || !after) return null;

    const oldMessages = before.messages ?? [];
    const newMessages = after.messages ?? [];

    // Detect new reply (messages array grew)
    if (newMessages.length > oldMessages.length) {
      const latestMessage = newMessages[newMessages.length - 1];
      // Only fire notification for customer replies, not admin replies
      if (latestMessage && latestMessage.senderRole === 'customer') {
        const customerName = latestMessage.senderName || after.customerName || 'A user';
        const customerEmail = after.customerEmail || '';
        const ticketId = after.ticketId || ticketDocId;

        await createNotification({
          type: 'ticket',
          category: 'tickets',
          title: 'Ticket Reply',
          message: `${customerName} replied to ticket #${ticketId}`,
          referenceId: ticketId,
          referenceUrl: `/admin/tickets/${ticketDocId}`,
          triggeredBy: {
            userId: latestMessage.senderId || after.userId || '',
            userName: customerName,
            userEmail: customerEmail,
          },
        });
      }
    }

    return null;
  });

// ─── onUserCreated ──────────────────────────────────────────────────────────

export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const userId = context.params.userId;

    if (!data) return null;

    const userName = data.fullName || data.displayName || 'New User';
    const userEmail = data.email || '';

    await createNotification({
      type: 'user',
      category: 'users',
      title: 'New User Registered',
      message: `New user signed up: ${userName} (${userEmail})`,
      referenceId: userId,
      referenceUrl: `/admin/customers/${userId}`,
      triggeredBy: {
        userId,
        userName,
        userEmail,
      },
    });

    return null;
  });
