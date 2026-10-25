// express server for college bus tracking
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = 3000;

// body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple session middleware
app.use(session({
  secret: 'simple_college_secret_key',
  resave: false,
  saveUninitialized: false
}));

// serve static files from public folder
app.use(express.static('public'));

// college emails only, for example name@nirmauni.ac.in
function isCollegeEmail(email) {
  var parts = String(email || '').trim().toLowerCase().split('@');
  return parts.length === 2 && parts[1] === 'nirmauni.ac.in';
}

// authentication: must be logged in with a college email
function checkLogin(req, res, next) {
  if (!req.session.user || !isCollegeEmail(req.session.user.email)) {
    return res.status(401).json({ message: 'Please log in with your nirmauni.ac.in email' });
  }
  next();
}

// authorisation: role must be admin
function checkAdmin(req, res, next) {
  if (!req.session.user || !isCollegeEmail(req.session.user.email) || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

// authorisation: role must be driver
function checkDriver(req, res, next) {
  if (!req.session.user || !isCollegeEmail(req.session.user.email) || req.session.user.role !== 'driver') {
    return res.status(403).json({ message: 'Driver access only' });
  }
  next();
}

// authentication routes

// login
app.post('/api/login', async function (req, res) {
  var email = String(req.body.email || '').trim().toLowerCase();
  var password = req.body.password || '';

  if (!isCollegeEmail(email)) {
    return res.status(401).json({ message: 'Use your nirmauni.ac.in email address' });
  }

  var [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  var user = rows[0];
  var isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // save in session
  req.session.user = user;

  // decide redirect page
  var redirectUrl = '/student.html';
  if (user.role === 'driver') redirectUrl = '/driver.html';
  if (user.role === 'admin') redirectUrl = '/admin.html';

  res.json({ success: true, redirectUrl: redirectUrl });
});

// create a student account
app.post('/api/register', async function (req, res) {
  var name = String(req.body.name || '').trim();
  var email = String(req.body.email || '').trim().toLowerCase();
  var password = req.body.password || '';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!isCollegeEmail(email)) {
    return res.status(400).json({ message: 'Use your nirmauni.ac.in email address' });
  }

  var [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  // new accounts are always students; role is not taken from the form
  var hash = bcrypt.hashSync(password, 10);
  await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, 'student']
  );

  res.json({ success: true, message: 'Account created. You can log in now.' });
});

// logout
app.post('/api/logout', function (req, res) {
  req.session.destroy();
  res.json({ success: true });
});

// current user info
app.get('/api/current-user', function (req, res) {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

// student routes

// get all buses for dropdown
app.get('/api/buses', checkLogin, async function (req, res) {
  var [buses] = await db.query('SELECT * FROM buses');
  res.json({ buses: buses });
});

// get current location of one bus
app.get('/api/buses/:id/location', checkLogin, async function (req, res) {
  var sql = `
    SELECT b.bus_number, b.status, loc.latitude, loc.longitude 
    FROM buses b 
    LEFT JOIN bus_locations loc ON b.id = loc.bus_id 
    WHERE b.id = ?
  `;
  var [rows] = await db.query(sql, [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Bus not found' });
  }
  res.json(rows[0]);
});

// save student tracking history
app.post('/api/student/track', checkLogin, async function (req, res) {
  var busId = req.body.bus_id;
  if (!busId) {
    return res.status(400).json({ message: 'bus_id is required' });
  }
  var [busRows] = await db.query('SELECT id FROM buses WHERE id = ?', [busId]);
  if (busRows.length === 0) {
    return res.status(404).json({ message: 'Bus not found' });
  }
  var userId = req.session.user.id;
  await db.query('INSERT INTO tracking_history (user_id, bus_id) VALUES (?, ?)', [userId, busId]);
  res.json({ success: true });
});

// driver routes

// get assigned bus for driver
app.get('/api/driver/assigned-bus', checkDriver, async function (req, res) {
  var driverId = req.session.user.id;
  var [rows] = await db.query('SELECT * FROM buses WHERE driver_id = ?', [driverId]);
  if (rows.length === 0) {
    return res.json({ bus: null });
  }
  res.json({ bus: rows[0] });
});

// update bus location in mysql
app.post('/api/driver/location', checkDriver, async function (req, res) {
  var busId = req.body.bus_id;
  var lat = req.body.latitude;
  var lng = req.body.longitude;

  var sql = `
    INSERT INTO bus_locations (bus_id, latitude, longitude) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude)
  `;
  await db.query(sql, [busId, lat, lng]);
  res.json({ success: true });
});

// admin routes

// view all buses
app.get('/api/admin/buses', checkAdmin, async function (req, res) {
  var sql = `
    SELECT b.*, u.name AS driver_name 
    FROM buses b 
    LEFT JOIN users u ON b.driver_id = u.id 
    ORDER BY b.id ASC
  `;
  var [buses] = await db.query(sql);
  res.json({ buses: buses });
});

// add a bus
app.post('/api/admin/buses', checkAdmin, async function (req, res) {
  var b = req.body;
  var [result] = await db.query(
    'INSERT INTO buses (bus_number, route_name, driver_id, status) VALUES (?, ?, ?, ?)',
    [b.bus_number, b.route_name, b.driver_id || null, b.status || 'active']
  );
  // initial location
  await db.query(
    'INSERT INTO bus_locations (bus_id, latitude, longitude) VALUES (?, 23.1287, 72.5451)',
    [result.insertId]
  );
  res.json({ success: true });
});

// edit a bus
app.put('/api/admin/buses/:id', checkAdmin, async function (req, res) {
  var b = req.body;
  await db.query(
    'UPDATE buses SET bus_number=?, route_name=?, driver_id=?, status=? WHERE id=?',
    [b.bus_number, b.route_name, b.driver_id || null, b.status || 'active', req.params.id]
  );
  res.json({ success: true });
});

// delete a bus
app.delete('/api/admin/buses/:id', checkAdmin, async function (req, res) {
  await db.query('DELETE FROM buses WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// get list of drivers for assignment
app.get('/api/admin/drivers', checkAdmin, async function (req, res) {
  var [drivers] = await db.query('SELECT id, name FROM users WHERE role = "driver"');
  res.json({ drivers: drivers });
});

// get student tracking history
app.get('/api/admin/history', checkAdmin, async function (req, res) {
  var sql = `
    SELECT th.id, u.name, u.email, b.bus_number, th.tracked_at 
    FROM tracking_history th 
    JOIN users u ON th.user_id = u.id 
    JOIN buses b ON th.bus_id = b.id 
    ORDER BY th.tracked_at DESC
  `;
  var [history] = await db.query(sql);
  res.json({ history: history });
});

// start server
app.listen(PORT, function () {
  console.log('Server is running at http://localhost:' + PORT);
});
