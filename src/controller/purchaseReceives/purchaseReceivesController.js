const pool = require("../../config/db");
const { v4: uuidv4 } = require('uuid');
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const generatePurchaseReceivedNumber = () => {
    const timestamp = Date.now(); // Get current timestamp in milliseconds
    return `PR-${timestamp}`;
  };

  async function updatePurchaseOrderStatus(purchase_order_id) {
    try {
      const client = await pool.connect();
  
      // Check if all items in the purchase order are fully received
      const checkFullyReceivedQuery = `
        SELECT SUM(total_quantity) AS total_quantity, SUM(quantity_received) AS total_received
        FROM purchase_receives
        WHERE purchase_order_id = $1
      `;
      const checkFullyReceivedResult = await client.query(checkFullyReceivedQuery, [purchase_order_id]);
      const { total_quantity, total_received } = checkFullyReceivedResult.rows[0];
  
      if (total_quantity === total_received) {
        // All items are fully received
        const updateStatusQuery = `
          UPDATE purchase_order
          SET status = 'RECEIVED', updated_at = NOW()
          WHERE id = $1;
        `;
        await client.query(updateStatusQuery, [purchase_order_id]);
      } else {
        // At least one item is partially received
        const updateStatusQuery = `
          UPDATE purchase_order
          SET status = 'PARTIALLY RECEIVED', updated_at = NOW()
          WHERE id = $1;
        `;
        await client.query(updateStatusQuery, [purchase_order_id]);
      }
  
      client.release();
    } catch (error) {
      console.error('Error updating purchase order status:', error);
    }
  }
  
const purchaseReceives = async (req, res, next) => {
    const {
        purchase_order_id,
        vendor_id,
        item_id,
        total_quantity,
        quantity_received,
        rate,
        received_date,
        description
      } = req.body;
    
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
    
        // Check if the item_id exists in the purchase_order_preferred_vendors table for the provided purchase_order_id and vendor_id
        const checkItemQuery = `
          SELECT id FROM purchase_order_preferred_vendors
          WHERE purchase_order_id = $1 AND vendor_id = $2 AND purchase_item_id = $3;
        `;
        const checkItemResult = await client.query(checkItemQuery, [purchase_order_id, vendor_id, item_id]);
    
        if (checkItemResult.rowCount === 0) {
          client.release();
          return res.status(400).json({ error: 'Invalid item_id for the provided purchase_order_id and vendor_id. This item does not exist for the given purchase order and vendor.' });
        }
    
        // Proceed to insert the purchase_receives record
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
    
        const newPurchaseReceive = result.rows[0];
        client.release();
    
        await updatePurchaseOrderStatus(purchase_order_id);

        res.status(201).json(newPurchaseReceive);
      } catch (err) {
        console.error('Error inserting data', err.stack);
        res.status(500).send('Server Error');
      }
};

module.exports = {
    purchaseReceives
};
