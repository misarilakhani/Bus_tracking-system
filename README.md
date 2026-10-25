# 🚌 Live College Bus Tracking System (Simplified Version)
> **Nirma University — Full Stack Development (FSD) Practical Project**

---

## 📌 Project Overview
A very simple, beginner-friendly live bus tracking website built with:
- **Frontend**: HTML, simple Tailwind CSS, **Vue 3 (CDN, Options API)**, and Leaflet.js (using a **simple red dot** for the bus).
- **Backend**: Node.js & Express.js (unchanged).
- **Database**: MySQL (using `mysql2/promise`).

---

## 🚀 How to Run the Project

1. **Option 1 (One-Click)**: Double-click [`start.bat`](file:///c:/Users/misar/OneDrive/Desktop/fsd%20innovative/start.bat) in this folder.
2. **Option 2 (Terminal)**:
   ```bash
   npm start
   ```
   Open your browser and visit: **`http://localhost:3000`**

---

## 🔑 Login Credentials

| Role | Email | Password | What You Can Do |
| :--- | :--- | :--- | :--- |
| **Student (Default)** | `s@nirmauni.ac.in` | `123` | Select bus, click "Track Bus", saves history, see red dot move |
| **Student (Rahul)** | `rahul@nirmauni.ac.in` | `123` | Sample student for testing tracking history |
| **Student (Priya)** | `priya@nirmauni.ac.in` | `123` | Sample student for testing tracking history |
| **Student (Aman)** | `aman@nirmauni.ac.in` | `123` | Sample student for testing tracking history |
| **Driver** | `d@nirmauni.ac.in` | `1234` | Start real GPS or start 5-point college demo route |
| **Admin** | `a@nirmauni.ac.in` | `12345` | Manage buses and view Student Tracking History table |

---

## 📁 File Structure & Purpose

- **[`database.js`](file:///c:/Users/misar/OneDrive/Desktop/fsd%20innovative/database.js)**: Connects Node.js to MySQL using a connection pool (15 lines).
- **[`server.js`](file:///c:/Users/misar/OneDrive/Desktop/fsd%20innovative/server.js)**: Handles login, sessions, role checks, and simple SQL queries for students, drivers, and admins.
- **[`database.sql`](file:///c:/Users/misar/OneDrive/Desktop/fsd%20innovative/database.sql)**: SQL script defining `users`, `buses`, `bus_locations`, and `tracking_history` tables.
- **[`public/style.css`](public/style.css)**: Sets the map height. Page layout uses Tailwind.
- **[`public/index.html`](public/index.html)** & **[`public/login.js`](public/login.js)**: Login and create-account forms. Only `@nirmauni.ac.in` emails are accepted. New accounts are saved as students.
- **[`public/student.html`](public/student.html)** & **[`public/student.js`](public/student.js)**:
  - Bus dropdown (`v-for` + `v-model`) and Track Bus button (`@click`).
  - Tracking details (`v-if` / `v-else` and `{{ }}`) including status, speed, and last update time.
  - A **simple red dot** using Leaflet `L.circleMarker`, moved from the Vue method every 5 seconds.
- **[`public/driver.html`](public/driver.html)** & **[`public/driver.js`](public/driver.js)**:
  - Assigned bus, latitude, longitude, and speed.
  - Start/Stop buttons for real GPS and the 5-point demo route, with `:disabled` while a mode is running.
- **[`public/admin.html`](public/admin.html)** & **[`public/admin.js`](public/admin.js)**:
  - Inline form to add or edit a bus (`v-model`).
  - Bus table and student tracking history (`v-for`), plus a computed total.

Vue is loaded from a CDN. There is no Vue CLI, Vite, Pinia, Vue Router, or Composition API. The Node.js routes are the same.

---

## 🗺️ How the Map Works (Viva Answer)

Instead of complex markers or images, we use Leaflet's built-in **circleMarker**:
```javascript
// Create the red dot
marker = L.circleMarker([latitude, longitude], {
  radius: 7,
  color: 'red',
  fillColor: 'red',
  fillOpacity: 1
}).addTo(map);

// Move the red dot
marker.setLatLng([newLatitude, newLongitude]);
```
Every 5 seconds, `setInterval()` calls `updateLocation()`, which fetches the latest coordinates from the server and moves the dot without reloading the page.
