"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderCancelled = exports.onOrderCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
exports.onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snapshot, context) => {
    const orderData = snapshot.data();
    const firestoreOrderId = context.params.orderId;
    const humanOrderId = (orderData === null || orderData === void 0 ? void 0 : orderData.orderId) || firestoreOrderId;
    if (!orderData) {
        functions.logger.error(`[onOrderCreated] No data for order ${firestoreOrderId}`);
        return null;
    }
    const items = (orderData.items || []).map((item) => {
        var _a, _b, _c;
        return ({
            productId: (_a = item.productId) !== null && _a !== void 0 ? _a : '',
            size: (_b = item.size) !== null && _b !== void 0 ? _b : '',
            quantity: Number(item.quantity) || 1,
            name: (_c = item.name) !== null && _c !== void 0 ? _c : '',
        });
    });
    if (items.length === 0) {
        functions.logger.warn(`[onOrderCreated] Order ${humanOrderId} has no items — skipping stock decrement.`);
        return null;
    }
    try {
        await db.runTransaction(async (tx) => {
            var _a;
            // ── 1. Read all product documents inside the transaction ──────────────
            const productReads = [];
            for (const item of items) {
                if (!item.productId) {
                    functions.logger.warn(`[onOrderCreated] Item "${item.name}" has no productId — skipping.`);
                    continue;
                }
                const ref = db.collection('products').doc(item.productId);
                const snap = await tx.get(ref);
                if (!snap.exists) {
                    functions.logger.warn(`[onOrderCreated] Product ${item.productId} ("${item.name}") not found — skipping stock decrement for this item.`);
                    continue;
                }
                productReads.push({ ref, snap, item });
            }
            // ── 2. Compute new stock and write updates ────────────────────────────
            for (const { ref, snap, item } of productReads) {
                const pData = snap.data();
                const stockData = pData.stock;
                if (typeof stockData === 'object' && stockData !== null) {
                    // Size-wise map: { S: 10, M: 5, L: 2 }
                    const newStock = Object.assign({}, stockData);
                    const currentSizeStock = Number((_a = newStock[item.size]) !== null && _a !== void 0 ? _a : 0);
                    if (currentSizeStock <= 0) {
                        functions.logger.error(`[onOrderCreated] Order ${humanOrderId}: "${item.name}" (size ${item.size}) is already out of stock. Setting to 0.`);
                        newStock[item.size] = 0;
                    }
                    else {
                        const decremented = currentSizeStock - item.quantity;
                        if (decremented < 0) {
                            functions.logger.error(`[onOrderCreated] Order ${humanOrderId}: Stock for "${item.name}" (size ${item.size}) would go negative (${decremented}). Clamping to 0.`);
                            newStock[item.size] = 0;
                        }
                        else {
                            newStock[item.size] = decremented;
                        }
                    }
                    const totalStock = Object.values(newStock).reduce((sum, val) => sum + (Number(val) || 0), 0);
                    const updatePayload = {
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
                    functions.logger.info(`[onOrderCreated] Order ${humanOrderId}: Decremented "${item.name}" size ${item.size} by ${item.quantity}. New stock: ${newStock[item.size]}, total: ${totalStock}.`);
                }
                else {
                    // Flat numeric stock
                    const currentStock = Number(stockData !== null && stockData !== void 0 ? stockData : 0);
                    const decremented = currentStock - item.quantity;
                    const newStock = Math.max(0, decremented);
                    if (decremented < 0) {
                        functions.logger.error(`[onOrderCreated] Order ${humanOrderId}: Stock for "${item.name}" would go negative (${decremented}). Clamping to 0.`);
                    }
                    const updatePayload = {
                        stock: newStock,
                        totalStock: newStock,
                        inStock: newStock > 0,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    if (newStock === 0) {
                        updatePayload.status = 'out_of_stock';
                    }
                    tx.update(ref, updatePayload);
                    functions.logger.info(`[onOrderCreated] Order ${humanOrderId}: Decremented "${item.name}" by ${item.quantity}. New stock: ${newStock}.`);
                }
            }
        });
        functions.logger.info(`[onOrderCreated] Stock decrement transaction completed successfully for order ${humanOrderId}.`);
    }
    catch (err) {
        functions.logger.error(`[onOrderCreated] Failed to decrement stock for order ${humanOrderId}:`, err);
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
exports.onOrderCancelled = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const firestoreOrderId = context.params.orderId;
    const humanOrderId = (after === null || after === void 0 ? void 0 : after.orderId) || firestoreOrderId;
    // Only act when status transitions TO 'cancelled'
    if ((before === null || before === void 0 ? void 0 : before.status) === 'cancelled' || (after === null || after === void 0 ? void 0 : after.status) !== 'cancelled') {
        return null;
    }
    const items = (after.items || []).map((item) => {
        var _a, _b, _c;
        return ({
            productId: (_a = item.productId) !== null && _a !== void 0 ? _a : '',
            size: (_b = item.size) !== null && _b !== void 0 ? _b : '',
            quantity: Number(item.quantity) || 1,
            name: (_c = item.name) !== null && _c !== void 0 ? _c : '',
        });
    });
    if (items.length === 0) {
        functions.logger.warn(`[onOrderCancelled] Order ${humanOrderId} has no items — skipping stock restoration.`);
        return null;
    }
    try {
        await db.runTransaction(async (tx) => {
            var _a;
            // ── 1. Read all product documents inside the transaction ──────────────
            const productReads = [];
            for (const item of items) {
                if (!item.productId) {
                    functions.logger.warn(`[onOrderCancelled] Item "${item.name}" has no productId — skipping.`);
                    continue;
                }
                const ref = db.collection('products').doc(item.productId);
                const snap = await tx.get(ref);
                if (!snap.exists) {
                    functions.logger.warn(`[onOrderCancelled] Product ${item.productId} ("${item.name}") not found — skipping stock restoration for this item.`);
                    continue;
                }
                productReads.push({ ref, snap, item });
            }
            // ── 2. Compute restored stock and write updates ───────────────────────
            for (const { ref, snap, item } of productReads) {
                const pData = snap.data();
                const stockData = pData.stock;
                if (typeof stockData === 'object' && stockData !== null) {
                    // Size-wise map: { S: 10, M: 5, L: 2 }
                    const newStock = Object.assign({}, stockData);
                    const currentSizeStock = Number((_a = newStock[item.size]) !== null && _a !== void 0 ? _a : 0);
                    newStock[item.size] = currentSizeStock + item.quantity;
                    const totalStock = Object.values(newStock).reduce((sum, val) => sum + (Number(val) || 0), 0);
                    const updatePayload = {
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
                    functions.logger.info(`[onOrderCancelled] Order ${humanOrderId}: Restored "${item.name}" size ${item.size} by ${item.quantity}. New stock: ${newStock[item.size]}, total: ${totalStock}.`);
                }
                else {
                    // Flat numeric stock
                    const currentStock = Number(stockData !== null && stockData !== void 0 ? stockData : 0);
                    const newStock = currentStock + item.quantity;
                    const updatePayload = {
                        stock: Math.max(0, newStock),
                        totalStock: Math.max(0, newStock),
                        inStock: newStock > 0,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    if (newStock > 0 && pData.status === 'out_of_stock') {
                        updatePayload.status = 'active';
                    }
                    tx.update(ref, updatePayload);
                    functions.logger.info(`[onOrderCancelled] Order ${humanOrderId}: Restored "${item.name}" by ${item.quantity}. New stock: ${Math.max(0, newStock)}.`);
                }
            }
        });
        functions.logger.info(`[onOrderCancelled] Stock restoration transaction completed successfully for order ${humanOrderId}.`);
    }
    catch (err) {
        functions.logger.error(`[onOrderCancelled] Failed to restore stock for order ${humanOrderId}:`, err);
    }
    return null;
});
//# sourceMappingURL=index.js.map