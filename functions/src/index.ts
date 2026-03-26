import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: onOrderCreated
 *
 * Triggered when a new document is created in the top-level `orders` collection.
 * Decrements stock in the `products` collection for each item in the order using
 * a Firestore transaction (atomic). Runs with Firebase Admin privileges so it is
 * not subject to Firestore Security Rules.
 *
 * This separation of concerns is the reason stock decrement was moved off the
 * client: Firestore rules allow only admins to write to `products`, so any
 * client-side write inside a transaction would fail with "Insufficient permissions"
 * and roll back the entire transaction — including the order creation itself.
 */
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
    } catch (err) {
      functions.logger.error(
        `[onOrderCreated] Failed to decrement stock for order ${humanOrderId}:`,
        err
      );
      // Do NOT re-throw — we don't want the function to retry indefinitely on
      // a partial failure; the order is already created and the customer has
      // completed their purchase. An admin can manually adjust stock if needed.
    }

    return null;
  });

/**
 * Cloud Function: onOrderCancelled
 *
 * Triggered when an order document is updated. If the new status is 'cancelled'
 * and the previous status was not 'cancelled', restores stock in the `products`
 * collection for each item in the order using an atomic Firestore transaction.
 * Runs with Firebase Admin privileges — not subject to Firestore Security Rules.
 *
 * This separation of concerns mirrors onOrderCreated: the client only updates
 * the order document status to 'cancelled'. Stock restoration happens here
 * server-side, bypassing the admin-only restriction on the products collection.
 */
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
        // ── 1. Read all product documents inside the transaction ──────────────
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

        // ── 2. Compute restored stock and write updates ───────────────────────
        for (const { ref, snap, item } of productReads) {
          const pData = snap.data() as admin.firestore.DocumentData;
          const stockData = pData.stock;

          if (typeof stockData === 'object' && stockData !== null) {
            // Size-wise map: { S: 10, M: 5, L: 2 }
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

            // Clear out_of_stock status if stock is restored
            if (totalStock > 0 && pData.status === 'out_of_stock') {
              updatePayload.status = 'active';
            }

            tx.update(ref, updatePayload);

            functions.logger.info(
              `[onOrderCancelled] Order ${humanOrderId}: Restored "${item.name}" size ${item.size} by ${item.quantity}. New stock: ${newStock[item.size]}, total: ${totalStock}.`
            );
          } else {
            // Flat numeric stock
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

/**
 * Cloud Function: onReviewWritten
 * 
 * Triggered when a review is created, updated, or deleted.
 * Recalculates average rating and review count for the modified product.
 */
export const onReviewWritten = functions.firestore
  .document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : change.before.data();
    if (!data || !data.productId) return null;

    const productId = data.productId;

    try {
      // Fetch all approved reviews for this product
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

      // Update product document
      const productRef = db.collection('products').doc(productId);
      
      // We check if product exists first, it might have been deleted, though rare
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
