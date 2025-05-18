document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('invoiceForm');
  const list = document.getElementById('invoiceList');
  const idInput = document.getElementById('invoiceId');

  async function fetchInvoices() {
    const res = await fetch('/invoices');
    const invoices = await res.json();
    renderInvoices(invoices);
  }

  function renderInvoices(invoices) {
    list.innerHTML = '';
    invoices.forEach(inv => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${inv.client}</strong> — ${inv.amount} ₽ 
        <div>${inv.description || ''}</div>
        <div class="invoice-actions">
          <button onclick="editInvoice(${inv.id})">✏</button>
          <button onclick="deleteInvoice(${inv.id})">🗑</button>
          <a href="/invoice/${inv.id}/pdf" target="_blank">📄</a>
        </div>
      `;
      list.appendChild(li);
    });
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = idInput.value;
    const data = {
      client: document.getElementById('client').value,
      amount: document.getElementById('amount').value,
      description: document.getElementById('description').value,
      payment_date: document.getElementById('paymentDate').value,
    };

    if (id) {
      await fetch(`/invoice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    form.reset();
    idInput.value = '';
    fetchInvoices();
  };

  window.editInvoice = async (id) => {
    const res = await fetch('/invoices');
    const invoices = await res.json();
    const inv = invoices.find(i => i.id === id);
    document.getElementById('client').value = inv.client;
    document.getElementById('amount').value = inv.amount;
    document.getElementById('description').value = inv.description;
    document.getElementById('paymentDate').value = inv.payment_date;
    idInput.value = inv.id;
  };

  window.deleteInvoice = async (id) => {
    await fetch(`/invoice/${id}`, { method: 'DELETE' });
    fetchInvoices();
  };

  fetchInvoices();
});
