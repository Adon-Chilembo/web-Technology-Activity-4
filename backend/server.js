require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Serve the frontend from the same server (handy for one-link cloud deployment)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- helpers ----------
function validate(body) {
  const errors = [];
  const name = typeof body.product_name === 'string' ? body.product_name.trim() : '';
  if (!name) errors.push('product_name is required');
  if (name.length > 150) errors.push('product_name must be 150 characters or fewer');

  const price = Number(body.price);
  if (body.price === undefined || body.price === '' || Number.isNaN(price) || price < 0)
    errors.push('price must be a number >= 0');

  const stock = Number(body.stock_quantity ?? 0);
  if (!Number.isInteger(stock) || stock < 0)
    errors.push('stock_quantity must be a whole number >= 0');

  return {
    errors,
    data: {
      product_name: name,
      brand: body.brand?.toString().trim() || null,
      category: body.category?.toString().trim() || null,
      price,
      stock_quantity: stock,
      description: body.description?.toString().trim() || null,
    },
  };
}

const getById = (id) => db.prepare('SELECT * FROM products WHERE id = ?').get(id);

// ---------- routes ----------
// List all
app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY id DESC').all());
});

// Get one
app.get('/api/products/:id', (req, res) => {
  const row = getById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

// Create
app.post('/api/products', (req, res) => {
  const { errors, data } = validate(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  const info = db
    .prepare(
      `INSERT INTO products (product_name, brand, category, price, stock_quantity, description)
       VALUES (@product_name, @brand, @category, @price, @stock_quantity, @description)`
    )
    .run(data);
  res.status(201).json(getById(info.lastInsertRowid));
});

// Update
app.put('/api/products/:id', (req, res) => {
  if (!getById(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const { errors, data } = validate(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  db.prepare(
    `UPDATE products SET product_name=@product_name, brand=@brand, category=@category,
       price=@price, stock_quantity=@stock_quantity, description=@description,
       updated_at=CURRENT_TIMESTAMP
     WHERE id=@id`
  ).run({ ...data, id: req.params.id });
  res.json(getById(req.params.id));
});

// Delete
app.delete('/api/products/:id', (req, res) => {
  const row = getById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted', deleted: row });
});

// JSON for everything else
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
