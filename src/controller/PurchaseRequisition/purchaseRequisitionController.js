const pool = require("../../config/db");
const {
  uploadToCloudinary,
  updateCloudinaryFile,
} = require("../../utilities/cloudinary");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createPurchaseRequisition = async (req, res, next) => {
  const {
    pr_number,
    status,
    pr_detail,
    priority,
    requested_by,
    requested_date,
    required_date,
    shipment_preferences,
    delivery_address,
    items,
    total_amount,
  } = req.body;

  try {
    let purchase_item_ids = [];

    for (const item of JSON.parse(items)) {
      const { rows, rowCount } = await pool.query(
        `INSERT INTO purchase_items (item_id, available_stock, required_quantity , price , preffered_vendor_ids) VALUES ($1, $2, $3 , $4 , $5) RETURNING *`,
        [
          item.item_id,
          item.available_stock,
          item.required_quantity,
          item.price,
          item.preffered_vendor_id,
        ]
      );

      if (rowCount === 0) {
        return responseSender(res, 400, false, "Item Not Added");
      }

      purchase_item_ids.push(rows[0].id);
    }

    let uplodadDoc = null;

    if (req.file) {
      uplodadDoc = await uploadToCloudinary(
        req.file.path,
        "Purchase Requisition"
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO purchase_requisition (pr_number, status, pr_detail, priority, requested_by, requested_date, required_date, shipment_preferences, delivery_address , purchase_item_ids , document , total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9 , $10 , $11 , $12) RETURNING *`,
      [
        pr_number,
        status.toUpperCase(),
        pr_detail,
        priority.toUpperCase(),
        requested_by,
        requested_date,
        required_date,
        shipment_preferences,
        delivery_address,
        purchase_item_ids,
        uplodadDoc,
        total_amount,
      ]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Purchase Requisition Not Added");
    }
    return responseSender(
      res,
      201,
      true,
      "Purchase Requisition Added",
      rows[0]
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getPurchaseRequisition = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT pr.*, 
                json_agg(
                    json_build_object(
                        'id', pi.id, 
                        'item_id', pi.item_id, 
                        'available_stock', pi.available_stock, 
                        'required_quantity', pi.required_quantity, 
                        'price', pi.price, 
                        'preffered_vendor_id', pi.preffered_vendor_id, 
                        'preffered_vendor', v.vendor_display_name
                    )
                ) AS items_detail 
         FROM purchase_requisition pr 
         LEFT JOIN purchase_items pi 
         ON pi.id::text = ANY(pr.purchase_item_ids) 
         LEFT JOIN vendor v 
         ON v.id = pi.preffered_vendor_id
         WHERE pr.id = $1 
         GROUP BY pr.id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purhcase Requisition not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Purchase Requisition Retrieved",
      rows[0]
    );
  } catch (error) {
    next(error);
  }
};

const getAllPurchaseRequisition = async (req, res, next) => {
  let {
    page,
    limit,
    sortField,
    sortOrder,
    search,
    status,
    priority,
    required_date,
  } = req.query;

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 100;
  sortField = sortField || "created_at";
  sortOrder = sortOrder || "DESC";
  const offset = (page - 1) * limit;

  const filters = [];
  const values = [];
  let index = 1;

  if (search) {
    filters.push(`(pr.pr_number ILIKE $${index})`);
    values.push(`%${search}%`);
    index++;
  }

  if (status) {
    filters.push(`LOWER(pr.status) = LOWER($${index})`);
    values.push(status);
    index++;
  }

  if (priority) {
    filters.push(`LOWER(pr.priority) = LOWER($${index})`);
    values.push(priority);
    index++;
  }

  if (required_date) {
    filters.push(`pr.required_date = $${index}`);
    values.push(required_date);
    index++;
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const query = `
        SELECT pr.*, 
               json_agg(
                   json_build_object(
                       'id', pi.id, 
                       'item_id', pi.item_id, 
                       'available_stock', pi.available_stock, 
                       'required_quantity', pi.required_quantity, 
                       'price', pi.price, 
                       'preffered_vendor_id', pi.preffered_vendor_id, 
                       'preffered_vendor', v.vendor_display_name
                   )
               ) AS items_detail 
        FROM purchase_requisition pr 
        LEFT JOIN purchase_items pi 
        ON pi.id::text = ANY(pr.purchase_item_ids) 
        LEFT JOIN vendor v 
        ON v.id = pi.preffered_vendor_id
        ${whereClause}
        GROUP BY pr.id
        ORDER BY ${sortField} ${sortOrder}
        LIMIT $${index} OFFSET $${index + 1}`;

    const { rows, rowCount } = await pool.query(query, [
      ...values,
      limit,
      offset,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purchase Requisition not found");
    }

    const countQuery = `
        SELECT COUNT(*)
        FROM purchase_requisition pr
        ${whereClause}`;

    const totalRowsResult = await pool.query(countQuery, values);

    return responseSender(res, 200, true, "Purchase Requisition Retrieved", {
      p_requisitions: rows,
      pagination: pagination(totalRowsResult.rows[0].count, limit, page),
      totalCount: totalRowsResult.rows[0].count,
    });
  } catch (error) {
    next(error);
  }
};

const updatePurchaseRequisition = async (req, res, next) => {
  const {
    pr_number,
    status,
    pr_detail,
    priority,
    requested_by,
    requested_date,
    required_date,
    shipment_preferences,
    delivery_address,
    items,
    total_amount,
  } = req.body;
  const { id } = req.params;

  try {
    const { rows: existingRows, rowCount } = await pool.query(
      `SELECT * FROM purchase_requisition WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purchase requisition not found");
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (pr_number) {
      fields.push(`pr_number = $${index}`);
      values.push(pr_number);
      index++;
    }

    if (status) {
      fields.push(`status = $${index}`);
      values.push(status.toUpperCase());
      index++;
    }

    if (pr_detail) {
      fields.push(`pr_detail = $${index}`);
      values.push(pr_detail);
      index++;
    }

    if (priority) {
      fields.push(`priority = $${index}`);
      values.push(priority.toUpperCase());
      index++;
    }

    if (requested_by) {
      fields.push(`requested_by = $${index}`);
      values.push(requested_by);
      index++;
    }

    if (requested_date) {
      fields.push(`requested_date = $${index}`);
      values.push(requested_date);
      index++;
    }

    if (required_date) {
      fields.push(`required_date = $${index}`);
      values.push(required_date);
      index++;
    }

    if (shipment_preferences) {
      fields.push(`shipment_preferences = $${index}`);
      values.push(shipment_preferences);
      index++;
    }

    if (delivery_address) {
      fields.push(`delivery_address = $${index}`);
      values.push(delivery_address);
      index++;
    }

    if (total_amount) {
      fields.push(`total_amount = $${index}`);
      values.push(total_amount);
      index++;
    }

    if (req.file) {
      const doc = existingRows[0]?.document;
      if (doc) {
        const updateDoc = await updateCloudinaryFile(
          req.file.path,
          doc.public_id
        );
        fields.push(`document = $${index}`);
        values.push(updateDoc);
        index++;
      } else {
        const uploadDoc = await uploadToCloudinary(
          req.file.path,
          "Purchase Requisition"
        );
        fields.push(`document = $${index}`);
        values.push(uploadDoc);
        index++;
      }
    }

    if (fields.length > 0) {
      const updatePurchaseRequisitionQuery = `
          UPDATE purchase_requisition
          SET ${fields.join(", ")}
          WHERE id = $${index}
          RETURNING *;
        `;
      values.push(id);
      await pool.query(updatePurchaseRequisitionQuery, values);
    }

    if (items && items.length > 0) {
      for (const item of JSON.parse(items)) {
        const {
          id: itemId,
          item_id,
          available_stock,
          required_quantity,
          price,
          preffered_vendor_id,
        } = item;

        const itemFields = [];
        const itemValues = [];
        let itemIndex = 1;

        if (item_id) {
          itemFields.push(`item_id = $${itemIndex}`);
          itemValues.push(item_id);
          itemIndex++;
        }

        if (available_stock !== undefined) {
          itemFields.push(`available_stock = $${itemIndex}`);
          itemValues.push(available_stock);
          itemIndex++;
        }

        if (required_quantity !== undefined) {
          itemFields.push(`required_quantity = $${itemIndex}`);
          itemValues.push(required_quantity);
          itemIndex++;
        }

        if (price !== undefined) {
          itemFields.push(`price = $${itemIndex}`);
          itemValues.push(price);
          itemIndex++;
        }

        if (preffered_vendor_id) {
          itemFields.push(`preffered_vendor_ids = $${itemIndex}`);
          itemValues.push(preffered_vendor_id);
          itemIndex++;
        }

        if (itemFields.length > 0) {
          itemFields.push(`updated_at = NOW()`);
          const updatePurchaseItemsQuery = `
              UPDATE purchase_items
              SET ${itemFields.join(", ")}
              WHERE id = $${itemIndex}
              RETURNING *;
            `;
          itemValues.push(itemId);
          await pool.query(updatePurchaseItemsQuery, itemValues);
        }
      }
    }

    const updatedRequisitionQuery = `
        SELECT pr.*, 
               json_agg(
                 json_build_object(
                   'id', pi.id, 
                   'item_id', pi.item_id, 
                   'available_stock', pi.available_stock, 
                   'required_quantity', pi.required_quantity, 
                   'price', pi.price, 
                   'preffered_vendor_id', pi.preffered_vendor_id, 
                   'preffered_vendor', v.vendor_display_name
                 )
               ) AS items_detail
        FROM purchase_requisition pr
        LEFT JOIN purchase_items pi ON pi.id::text = ANY(pr.purchase_item_ids)
        LEFT JOIN vendor v ON v.id = pi.preffered_vendor_id
        WHERE pr.id = $1
        GROUP BY pr.id;
      `;
    const { rows: updatedRequisitionRows } = await pool.query(
      updatedRequisitionQuery,
      [id]
    );

    return responseSender(
      res,
      200,
      true,
      "Purchase Requisition Updated",
      updatedRequisitionRows[0]
    );
  } catch (error) {
    next(error);
  }
};

const deletePurchaseRequisition = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM purchase_requisition WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purchase Requisition Not Found");
    }

    return responseSender(
      res,
      200,
      true,
      "Purchase Requisition Deleted",
      rows[0]
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPurchaseRequisition,
  getPurchaseRequisition,
  deletePurchaseRequisition,
  getAllPurchaseRequisition,
  updatePurchaseRequisition,
};
