// If the page is served by the Express server, use same-origin.
// Otherwise (file:// or a separate static host) point to the API URL.
// For a separately hosted frontend, set window.API_BASE before this script loads,
// e.g. <script>window.API_BASE = 'https://your-api.onrender.com'</script>
const API_BASE = window.API_BASE ?? (location.protocol === 'file:' ? 'http://localhost:3000' : '');
const API = `${API_BASE}/api/products`;

const $ = (id) => document.getElementById(id);
const form = $('product-form');
const fields = ['product_name', 'brand', 'category', 'price', 'stock_quantity', 'description'];
let products = [];

function setStatus(msg, type = '') {
  const el = $('status');
  el.textContent = msg;
  el.className = type;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.errors?.join(', ') || body.error || `Request failed (${res.status})`);
  return body;
}

function render() {
  const tbody = $('rows');
  tbody.innerHTML = '';
  $('empty').hidden = products.length > 0;
  $('count').textContent = products.length ? `(${products.length})` : '';

  for (const p of products) {
    const tr = document.createElement('tr');
    const cell = (text, cls) => {
      const td = document.createElement('td');
      td.textContent = text ?? '';
      if (cls) td.className = cls;
      return td;
    };
    tr.append(cell(p.id));

    const nameTd = cell(p.product_name);
    if (p.brand || p.description) {
      const s = document.createElement('small');
      s.textContent = [p.brand, p.description].filter(Boolean).join(' - ');
      nameTd.append(s);
    }
    tr.append(nameTd, cell(p.category), cell(`$${Number(p.price).toFixed(2)}`, 'num'), cell(p.stock_quantity, 'num'));

    const btns = document.createElement('td');
    btns.className = 'btns';
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.onclick = () => startEdit(p.id);
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'danger';
    del.onclick = () => remove(p);
    btns.append(edit, ' ', del);
    tr.append(btns);
    tbody.append(tr);
  }
}

async function load() {
  try {
    products = await request(API);
    render();
  } catch (e) {
    setStatus(`Could not load products: ${e.message}`, 'err');
  }
}

function resetForm() {
  form.reset();
  $('id').value = '';
  $('stock_quantity').value = 0;
  $('form-title').textContent = 'Add a product';
  $('save-btn').textContent = 'Add product';
  $('cancel-btn').hidden = true;
}

function startEdit(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  $('id').value = p.id;
  fields.forEach((f) => ($(f).value = p[f] ?? ''));
  $('form-title').textContent = `Edit product #${p.id}`;
  $('save-btn').textContent = 'Save changes';
  $('cancel-btn').hidden = false;
  setStatus('');
  $('product_name').focus();
}

async function remove(p) {
  if (!confirm(`Delete "${p.product_name}"?`)) return;
  try {
    await request(`${API}/${p.id}`, { method: 'DELETE' });
    if ($('id').value === String(p.id)) resetForm();
    setStatus('Product deleted', 'ok');
    await load();
  } catch (e) {
    setStatus(e.message, 'err');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const payload = Object.fromEntries(fields.map((f) => [f, $(f).value]));
  const id = $('id').value;
  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    setStatus(id ? 'Changes saved' : 'Product added', 'ok');
    resetForm();
    await load();
  } catch (err) {
    setStatus(err.message, 'err');
  }
});

$('cancel-btn').addEventListener('click', () => { resetForm(); setStatus(''); });

load();
