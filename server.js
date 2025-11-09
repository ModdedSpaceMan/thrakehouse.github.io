const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Helpers
const readData = (file) => {
  const path = `data/${file}`;
  if (!fs.existsSync(path)) fs.writeFileSync(path, '[]', 'utf8');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
};
const writeData = (file, data) => fs.writeFileSync(`data/${file}`, JSON.stringify(data, null, 2), 'utf8');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// Allowed email domains
const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

/* ----------------
   AUTH: check availability
   ---------------- */
app.post('/check-availability', (req, res) => {
  const { username, email } = req.body;
  const users = readData('users.json');

  const usernameTaken = users.some(u => u.username === username);
  let emailTaken = users.some(u => u.email === email);

  // Reject emails not in allowed domains
  const domain = email?.split("@")[1];
  if (email && !allowedDomains.includes(domain)) emailTaken = true;

  res.json({ usernameTaken, emailTaken });
});

/* ----------------
   AUTH: signup/login
   ---------------- */
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  const users = readData('users.json');

  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: 'Потребителското име вече съществува' });
  }

  if (!email) return res.json({ success: false, message: 'Имейлът е задължителен' });

  const domain = email.split("@")[1];
  if (!allowedDomains.includes(domain)) {
    return res.json({ success: false, message: 'Моля, използвайте валиден имейл (gmail, yahoo, outlook...)' });
  }

  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: 'Имейлът вече е регистриран' });
  }

  users.push({ username, email, password, role: 'user' });
  writeData('users.json', users);

  // ensure wishlist for user
  const wishlists = readData('wishlists.json');
  if (!wishlists.find(w => w.username === username)) {
    wishlists.push({ username, items: [] });
    writeData('wishlists.json', wishlists);
  }

  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData('users.json');
  const user = users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, role: user.role, username: user.username });
  else res.json({ success: false });
});

/* ----------------
   Password reset -> create support ticket
   ---------------- */
app.post('/reset-password', (req, res) => {
  const { emailOrUsername } = req.body;
  const messages = readData('messages.json');
  const ticket = {
    id: genId(),
    type: 'password-reset',
    emailOrUsername: emailOrUsername || '',
    message: `Искане за нулиране на парола: ${emailOrUsername || 'не е посочено'}`,
    createdAt: new Date().toISOString()
  };
  messages.push(ticket);
  writeData('messages.json', messages);
  res.json({ message: `Ако данните съществуват, ще получите инструкции. (Тикет създаден)` });
});

/* ----------------
   Properties endpoints
   ---------------- */
app.get('/properties', (req, res) => {
  const props = readData('properties.json');
  res.json(props);
});

// Add property (admin only)
app.post('/properties', (req, res) => {
  const { property, role } = req.body;
  if (role !== 'admin') return res.status(403).json({ message: 'Нямате права' });
  const properties = readData('properties.json');
  const p = {
    id: genId(),
    name: property.name,
    location: property.location,
    price: property.price,
    image: property.image,
    type: property.type || 'apartment',
    status: property.status || 'free',
    createdAt: new Date().toISOString()
  };
  properties.push(p);
  writeData('properties.json', properties);
  res.json({ success: true, property: p });
});

// Delete property (admin only)
app.delete('/properties/:id', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== 'admin') return res.status(403).json({ message: 'Нямате права' });
  let properties = readData('properties.json');
  properties = properties.filter(p => p.id !== id);
  writeData('properties.json', properties);
  // also remove property from all wishlists
  const wishlists = readData('wishlists.json');
  wishlists.forEach(w => { w.items = w.items.filter(i => i !== id); });
  writeData('wishlists.json', wishlists);
  res.json({ success: true });
});

// Edit property (admin only)
app.patch('/properties/:id', (req, res) => {
  const { id } = req.params;
  const { role, updates } = req.body;
  if (role !== 'admin') return res.status(403).json({ message: 'Нямате права' });
  const properties = readData('properties.json');
  const idx = properties.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Не е намерен имот' });
  properties[idx] = { ...properties[idx], ...updates };
  writeData('properties.json', properties);
  res.json({ success: true, property: properties[idx] });
});

// Toggle property status (admin only)
app.patch('/properties/:id/status', (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  if (role !== 'admin') return res.status(403).json({ message: 'Нямате права' });
  const properties = readData('properties.json');
  const idx = properties.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Не е намерен имот' });
  properties[idx].status = status === 'taken' ? 'taken' : 'free';
  writeData('properties.json', properties);
  res.json({ success: true, property: properties[idx] });
});

/* ----------------
   Support tickets
   ---------------- */
app.get('/support', (req, res) => {
  const { role } = req.query;
  if (role !== 'admin') return res.status(403).json({ message: 'Нямате права' });
  const messages = readData('messages.json');
  res.json(messages);
});

app.post('/support', (req, res) => {
  const messages = readData('messages.json');
  const msg = {
    id: genId(),
    name: req.body.name || 'Anonymous',
    email: req.body.email || '',
    message: req.body.message || '',
    createdAt: new Date().toISOString(),
    type: 'support'
  };
  messages.push(msg);
  writeData('messages.json', messages);
  res.json({ success: true });
});

/* ----------------
   Wishlists (per-user)
   ---------------- */
app.get('/wishlists/:username', (req, res) => {
  const { username } = req.params;
  const wishlists = readData('wishlists.json');
  const user = wishlists.find(w => w.username === username);
  res.json(user || { username, items: [] });
});

// add item to wishlist
app.post('/wishlists/add', (req, res) => {
  const { username, propertyId } = req.body;
  if (!username || !propertyId) return res.status(400).json({ message: 'Липсват данни' });
  const wishlists = readData('wishlists.json');
  let user = wishlists.find(w => w.username === username);
  if (!user) { user = { username, items: [] }; wishlists.push(user); }
  if (!user.items.includes(propertyId)) user.items.push(propertyId);
  writeData('wishlists.json', wishlists);
  res.json({ success: true });
});

// remove item from wishlist
app.post('/wishlists/remove', (req, res) => {
  const { username, propertyId } = req.body;
  if (!username || !propertyId) return res.status(400).json({ message: 'Липсват данни' });
  const wishlists = readData('wishlists.json');
  const user = wishlists.find(w => w.username === username);
  if (user) {
    user.items = user.items.filter(id => id !== propertyId);
    writeData('wishlists.json', wishlists);
  }
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
