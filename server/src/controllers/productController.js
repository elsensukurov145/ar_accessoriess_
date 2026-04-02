const db = require('../config/db');

function normalizeProduct(raw) {
  return {
    ...raw,
    image_url: raw.image_url || raw.image || '',
    in_stock: raw.in_stock === null ? true : raw.in_stock,
    stock: raw.stock || 0,
    colors: raw.colors || [],
    specs: raw.specs || {},
  };
}

exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = result.rows.map(normalizeProduct);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: normalizeProduct(result.rows[0]) });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { id, name, description, price, discount_price, category, image_url, image, colors, in_stock, specs, status, stock } = req.body;

    const checkId = await db.query('SELECT id FROM products WHERE id = $1', [id]);
    if (checkId.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Product ID already exists.' });
    }

    const cleanImage = image_url || image || '';

    const result = await db.query(
      `INSERT INTO products (id, name, description, price, discount_price, category, image_url, colors, in_stock, specs, status${stock !== undefined ? ', stock' : ''})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11${stock !== undefined ? ', $12' : ''}) RETURNING *`,
      [
        id,
        JSON.stringify(name || {}),
        JSON.stringify(description || {}),
        Number(price),
        discount_price != null ? Number(discount_price) : null,
        category,
        cleanImage,
        JSON.stringify(colors || []),
        in_stock !== undefined ? in_stock : true,
        JSON.stringify(specs || {}),
        status || 'active',
        ...(stock !== undefined ? [Number(stock)] : []),
      ].flat()
    );

    res.status(201).json({ success: true, product: normalizeProduct(result.rows[0]) });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discount_price, category, image_url, image, colors, in_stock, specs, status, stock } = req.body;

    const cleanedImage = image_url || image || null;

    const existing = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = {
      name: JSON.stringify(name || existing.rows[0].name),
      description: JSON.stringify(description || existing.rows[0].description),
      price: price !== undefined ? Number(price) : existing.rows[0].price,
      discount_price: discount_price !== undefined ? (discount_price != null ? Number(discount_price) : null) : existing.rows[0].discount_price,
      category: category || existing.rows[0].category,
      image_url: cleanedImage || existing.rows[0].image_url || existing.rows[0].image || '',
      colors: JSON.stringify(colors || existing.rows[0].colors || []),
      in_stock: in_stock !== undefined ? in_stock : existing.rows[0].in_stock,
      specs: JSON.stringify(specs || existing.rows[0].specs || {}),
      status: status || existing.rows[0].status,
      stock: stock !== undefined ? Number(stock) : existing.rows[0].stock,
    };

    const query = `UPDATE products SET name=$1, description=$2, price=$3, discount_price=$4, category=$5, image_url=$6, colors=$7, in_stock=$8, specs=$9, status=$10${stock !== undefined || existing.rows[0].stock !== undefined ? ', stock=$11' : ''} WHERE id=$12 RETURNING *`;
    const params = [
      data.name,
      data.description,
      data.price,
      data.discount_price,
      data.category,
      data.image_url,
      data.colors,
      data.in_stock,
      data.specs,
      data.status,
    ];

    if (data.stock !== undefined) {
      params.push(data.stock);
    }

    params.push(id);

    const result = await db.query(query, params);

    res.json({ success: true, product: normalizeProduct(result.rows[0]) });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
