const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'invoices.yaml');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Отправка index.html по умолчанию
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Вспомогательные функции ---

function loadInvoices() {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return yaml.load(content) || [];
  } catch (err) {
    return [];
  }
}

function saveInvoices(invoices) {
  const yamlStr = yaml.dump(invoices);
  fs.writeFileSync(DATA_FILE, yamlStr);
}

// --- Роуты ---

app.get('/invoices', (req, res) => {
  res.json(loadInvoices());
});

app.post('/invoice', (req, res) => {
  const invoices = loadInvoices();
  const newInvoice = {
    id: Date.now(),
    ...req.body,
    amount: parseFloat(req.body.amount),
  };
  invoices.push(newInvoice);
  saveInvoices(invoices);
  res.sendStatus(201);
});

app.put('/invoice/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const invoices = loadInvoices();
  const index = invoices.findIndex(inv => inv.id === id);
  if (index === -1) return res.status(404).send('Not found');

  invoices[index] = { ...invoices[index], ...req.body, amount: parseFloat(req.body.amount) };
  saveInvoices(invoices);
  res.sendStatus(200);
});

app.delete('/invoice/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const invoices = loadInvoices();
  const updated = invoices.filter(inv => inv.id !== id);
  saveInvoices(updated);
  res.sendStatus(200);
});

app.get('/invoice/:id/pdf', (req, res) => {
  const id = parseInt(req.params.id);
  const invoices = loadInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return res.status(404).send('Not found');

  const doc = new PDFDocument();
  res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  doc.fontSize(18).text(`Invoice #${invoice.id}`);
  doc.moveDown();
  doc.text(`Client: ${invoice.client}`);
  doc.text(`Summ: ${invoice.amount}`);
  doc.text(`Description: ${invoice.description || '-'}`);
  doc.text(`Date: ${invoice.payment_date || '-'}`);
  doc.end();
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
