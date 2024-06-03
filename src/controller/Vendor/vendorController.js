const pool = require("../../config/db");
const {
  uploadToCloudinary,
  deleteCloudinaryFile,
} = require("../../utilities/cloudinary");
const { responseSender } = require("../../utilities/responseHandlers");

const createVendor = async (req, res, next) => {
  const {
    v_type,
    provider_type,
    first_name,
    last_name,
    company_name,
    vendor_display_name,
    email,
    phone_no,
    address,
    city,
    country,
    work_no,
    zip_code,
    state,
    fax_number,
    shipping_address,
    currency_id,
    payment_term_id,
    contact_person,
  } = req.body;

  try {
    // Upload to cloudinary if there's a file
    let uploadDoc = null;
    if (req.file) {
      uploadDoc = await uploadToCloudinary(req.file.path, "Vendor");
    }

    const { rows, rowCount } = await pool.query(
      `
    INSERT INTO vendor (
      v_type, provider_type, first_name, last_name, company_name, 
      vendor_display_name, email, phone_no, address, city, country, 
      work_no, zip_code, state, fax_number, shipping_address, 
      currency_id, payment_term_id, contact_person, document
    ) 
    VALUES (
      $1, $2, $3, $4, $5, 
      $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, 
      $16, $17, $18, $19, $20
    ) 
    RETURNING *`,
      [
        v_type,
        provider_type,
        first_name,
        last_name,
        company_name,
        vendor_display_name,
        email,
        phone_no,
        address,
        city,
        country,
        work_no,
        zip_code,
        state,
        fax_number,
        shipping_address,
        currency_id,
        payment_term_id,
        contact_person,
        uploadDoc,
      ]
    );

    if (rowCount === 0) {
      await deleteCloudinaryFile(uploadDoc.public_id);
      return responseSender(res, 400, false, "Vendor Not Added");
    }

    return responseSender(res, 201, true, "Vendor Added", rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVendor,
};
