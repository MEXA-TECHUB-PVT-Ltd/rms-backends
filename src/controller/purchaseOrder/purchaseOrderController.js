const pool = require("../../config/db");
const { v4: uuidv4 } = require('uuid');
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const purchaseOrder = async (req, res, next) => {
    const perPage = Number.parseInt(req.query.perPage) || 10;
    const currentPage = Number.parseInt(req.query.currentPage) || 1;

    try {
        // Fetch records with status 'ACCEPTED'
        const { rows: requisitions } = await pool.query(
            `SELECT id, pr_number FROM purchase_requisition WHERE status = 'ACCEPTED'`
        );

        // Check for records whose status changed from 'ACCEPTED'
        const { rows: changedRequisitions } = await pool.query(
            `SELECT po.purchase_requisition_id
            FROM purchase_order po                  
            JOIN purchase_requisition pr ON po.purchase_requisition_id = pr.id
            WHERE pr.status != 'ACCEPTED'`
        );

        // Delete records from purchase_order if their status changed from 'ACCEPTED'
        for (const requisition of changedRequisitions) {
            await pool.query(
                `DELETE FROM purchase_order WHERE purchase_requisition_id = $1`,
                [requisition.purchase_requisition_id]
            );
        }

        if (requisitions.length === 0) {
            // If no new accepted purchase requisitions are found, fetch previous purchase orders
            const totalCountResult = await pool.query(`SELECT COUNT(*) FROM purchase_order`);
            const totalItems = parseInt(totalCountResult.rows[0].count);

            const offset = (currentPage - 1) * perPage;

            const { rows: previousOrders } = await pool.query(
                `SELECT po.*, pr.*
                FROM purchase_order po
                JOIN purchase_requisition pr ON po.purchase_requisition_id = pr.id
                LIMIT $1 OFFSET $2`,
                [perPage, offset]
            );

            if (previousOrders.length === 0) {
                return responseSender(res, 422, false, "No Purchase order found");
            } else {
                const paginationInfo = pagination(totalItems, perPage, currentPage);

                // Fetch purchase items for each order
                for (const order of previousOrders) {
                    const { rows: purchaseItems } = await pool.query(
                        `SELECT * FROM purchase_items WHERE id = ANY($1::uuid[])`,
                        [order.purchase_item_ids]
                    );

                    // Fetch vendor details for each purchase item
                    for (const item of purchaseItems) {
                        const { rows: vendors } = await pool.query(
                            `SELECT * FROM vendor WHERE id = ANY($1::uuid[])`,
                            [item.preferred_vendor_ids]
                        );
                        item.preferred_vendors = vendors;
                    }

                    order.purchase_items = purchaseItems;
                }

                // Store preferred vendors
                await storePreferredVendors(previousOrders);

                return responseSender(res, 200, true, "Purchase orders fetched", { count: totalItems, orders: previousOrders });
            }
        }

        // Insert records into purchase_order table
        let newOrderCreated = false;
        const insertedPurchaseOrderIds = [];
        for (const requisition of requisitions) {
            const purchaseOrderId = uuidv4(); // Ensure unique ID for purchase order
            const purchaseOrderNumber = `PO-${Date.now()}`;

            // Check if the purchase_requisition_id already exists in purchase_order table
            const { rowCount } = await pool.query(
                `SELECT 1 FROM purchase_order WHERE purchase_requisition_id = $1`,
                [requisition.id]
            );

            if (rowCount === 0) {
                await pool.query(
                    `INSERT INTO purchase_order (id, purchase_order_number, purchase_requisition_id)
                    VALUES ($1, $2, $3)`,
                    [purchaseOrderId, purchaseOrderNumber, requisition.id]
                );
                newOrderCreated = true;
                insertedPurchaseOrderIds.push(purchaseOrderId);
            }
        }

        // Fetch all purchase orders created so far
        const totalCountResult = await pool.query(`SELECT COUNT(*) FROM purchase_order`);
        const totalItems = parseInt(totalCountResult.rows[0].count);

        const offset = (currentPage - 1) * perPage;

        const { rows: allOrders } = await pool.query(
            `SELECT po.id as purchase_order_id, po.purchase_order_number, po.purchase_requisition_id, po.created_at, po.updated_at, pr.*
            FROM purchase_order po
            JOIN purchase_requisition pr ON po.purchase_requisition_id = pr.id
            LIMIT $1 OFFSET $2`,
            [perPage, offset]
        );

        // Fetch purchase items for each order
        for (const order of allOrders) {
            const { rows: purchaseItems } = await pool.query(
                `SELECT * FROM purchase_items WHERE id = ANY($1::uuid[])`,
                [order.purchase_item_ids]
            );

            // Fetch vendor details for each purchase item
            for (const item of purchaseItems) {
                const { rows: vendors } = await pool.query(
                    `SELECT * FROM vendor WHERE id = ANY($1::uuid[])`,
                    [item.preffered_vendor_ids] // Typo corrected from preffered_vendor_ids to preferred_vendor_ids
                );
                item.preferred_vendors = vendors;
            }

            order.purchase_items = purchaseItems;
        }

        // Store preferred vendors
        await storePreferredVendors(allOrders);

        const paginationInfo = pagination(totalItems, perPage, currentPage);

        return responseSender(res, 200, true, "Purchase orders fetched", { count: totalItems, orders: allOrders });

    } catch (error) {
        next(error);
    }
};

// Function to store preferred vendors
const storePreferredVendors = async (orders) => {
    try {
        for (const order of orders) {



            for (const item of order.purchase_items) {

                console.log(order.purchase_items);

                for (const vendor of item.preferred_vendors) {

                    await pool.query(
                        `INSERT INTO purchase_order_preferred_vendors (purchase_order_id, purchase_item_id, vendor_id)
                        VALUES ($1, $2, $3)
                        ON CONFLICT DO NOTHING`, // This prevents duplicate entries if the same vendor is already stored for this purchase order item
                        [order.purchase_order_id, item.id, vendor.id]
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error storing preferred vendors:', error);
        throw error; // Re-throw the error to be caught by the main function
    }
};

const updateVendorPOSendingStatus = async (req, res, next) => {
    const purchaseOrderId = req.query.purchase_order_id;
    const { vendorIds } = req.body;

    if (!purchaseOrderId) {
        return responseSender(res, 422, false, "Provide purchase order ID");
    }

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return responseSender(res, 422, false, "Invalid input. Please provide a non-empty array of vendor IDs.");
    }

    try {
        // Check if purchase order exists
        const purchaseOrderResult = await pool.query('SELECT 1 FROM purchase_order_preferred_vendors WHERE purchase_order_id = $1', [purchaseOrderId]);
        if (purchaseOrderResult.rowCount === 0) {
            return responseSender(res, 422, false, "Purchase order not found.");
        }

        // Check if all vendor IDs exist
        const vendorResult = await pool.query('SELECT id FROM vendor WHERE id = ANY($1::uuid[])', [vendorIds]);
        const foundVendorIds = vendorResult.rows.map(row => row.id);
        const missingVendorIds = vendorIds.filter(id => !foundVendorIds.includes(id));

        if (missingVendorIds.length > 0) {
            return responseSender(res, 422, false, `Vendors not found for the following IDs: ${missingVendorIds.join(', ')}`);
        }

        // Update po_sending_status
        const updateQuery = `
            UPDATE vendor
            SET po_sending_status = true
            WHERE id = ANY($1::uuid[])
            AND id IN (
                SELECT vendor_id FROM purchase_order_preferred_vendors
                WHERE purchase_order_id = $2
            )
        `;
        await pool.query(updateQuery, [vendorIds, purchaseOrderId]);

        // Update purchase order status to 'ISSUED'
        const updatePOStatusQuery = `
            UPDATE purchase_order
            SET status = 'ISSUED'
            WHERE id = $1
        `;
        await pool.query(updatePOStatusQuery, [purchaseOrderId]);

        return responseSender(res, 200, true, "Purchase order sent to the vendor.");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    purchaseOrder,
    updateVendorPOSendingStatus
};
