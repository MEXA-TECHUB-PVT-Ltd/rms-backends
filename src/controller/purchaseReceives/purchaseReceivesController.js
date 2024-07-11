const pool = require("../../config/db");
const { v4: uuidv4 } = require('uuid');
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const generatePurchaseReceivedNumber = () => {
  const timestamp = Date.now(); // Get current timestamp in milliseconds
  return `PR-${timestamp}`;
};

const purchaseReceives = async (req, res, next) => {
  const { purchase_order_id, vendor_id, items, received_date, description } = req.body;
  const purchase_received_number = generatePurchaseReceivedNumber();

  try {
    const client = await pool.connect();

    // Check if the purchase_order_id exists in the purchase_order table
    const checkPurchaseOrderQuery = `
      SELECT id FROM purchase_order WHERE id = $1;
    `;
    const checkPurchaseOrderResult = await client.query(checkPurchaseOrderQuery, [purchase_order_id]);

    if (checkPurchaseOrderResult.rowCount === 0) {
      client.release();
      return res.status(400).json({ error: 'Invalid purchase_order_id. The purchase order does not exist.' });
    }

    // Check if the vendor_id exists in the purchase_order_preferred_vendors table for the provided purchase_order_id
    const checkVendorQuery = `
      SELECT id FROM purchase_order_preferred_vendors
      WHERE purchase_order_id = $1 AND vendor_id = $2;
    `;
    const checkVendorResult = await client.query(checkVendorQuery, [purchase_order_id, vendor_id]);

    if (checkVendorResult.rowCount === 0) {
      client.release();
      return res.status(400).json({ error: 'Invalid vendor_id for the provided purchase_order_id. This vendor does not exist for the given purchase order.' });
    }

    const insertedItems = [];
    let hasRemainingItems = false;

    for (const item of items) {
      const { item_id, quantity_received, rate } = item;

      // Check if the item_id exists in the purchase_items table and get required_quantity
      const checkItemQuery = `
        SELECT id, required_quantity, available_stock
        FROM purchase_items
        WHERE id = $1;
      `;
      const checkItemResult = await client.query(checkItemQuery, [item_id]);

      if (checkItemResult.rowCount === 0) {
        client.release();
        return res.status(400).json({ error: `Invalid item_id ${item_id}. This item does not exist in the purchase_items table.` });
      }

      const purchaseItem = checkItemResult.rows[0];
      const { required_quantity, available_stock } = purchaseItem;
      const total_quantity = required_quantity;
      const remaining_quantity = total_quantity - quantity_received;

      // Validate quantity_received against required_quantity
      if (quantity_received > required_quantity) {
        client.release();
        return res.status(400).json({ error: `Received quantity  cannot be greater than required quantity ${required_quantity} for item ${item_id}.` });
      }

      // Proceed to insert the purchase_receives record for each item
      const insertQuery = `
        INSERT INTO purchase_receives 
        (purchase_order_id, purchase_received_number, vendor_id, item_id, total_quantity, quantity_received, rate, received_date, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

      const result = await client.query(insertQuery, [
        purchase_order_id,
        purchase_received_number,
        vendor_id,
        item_id,
        total_quantity,
        quantity_received,
        rate,
        received_date,
        description
      ]);

      const newItem = result.rows[0];
      insertedItems.push(newItem);

      if (remaining_quantity > 0) {
        hasRemainingItems = true;
      }

      // Update the purchase_items table
      const updateItemQuery = `
        UPDATE purchase_items
        SET available_stock = available_stock + $1,
            required_quantity = $2
        WHERE id = $3;
      `;
      await client.query(updateItemQuery, [
        quantity_received,
        remaining_quantity,
        item_id
      ]);
    }

    // Update the purchase_order status based on remaining quantities
    const updateStatusQuery = `
      UPDATE purchase_order
      SET status = $1
      WHERE id = $2;
    `;
    const newStatus = hasRemainingItems ? 'PARTIALLY RECEIVED' : 'FULLY DELIVERED';
    await client.query(updateStatusQuery, [newStatus, purchase_order_id]);

    client.release();

    res.status(201).json({ message: 'Purchase receive created successfully', purchase_received_number, items: insertedItems });
  } catch (err) {
    console.error('Error inserting data', err.stack);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  purchaseReceives
};
