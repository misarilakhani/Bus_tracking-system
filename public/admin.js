// Admin dashboard — Vue 3 Options API.
// Vue owns the bus form, the bus table, the history table, and messages.
// Add, edit, and delete still call the existing /api/admin routes.

var app = Vue.createApp({
  data: function () {
    return {
      buses: [],
      drivers: [],
      history: [],
      busesLoaded: false,
      historyLoaded: false,
      saving: false,
      message: '',
      messageType: 'success',
      form: {
        id: '',
        bus_number: '',
        route_name: '',
        driver_id: '',
        status: 'active'
      }
    };
  },

  computed: {
    totalBuses: function () {
      return this.buses.length;
    },
    formHeading: function () {
      if (this.form.id) return 'Edit Bus #' + this.form.id;
      return 'Add New Bus';
    },
    saveButtonText: function () {
      if (this.saving) return 'Saving...';
      if (this.form.id) return 'Update Bus';
      return 'Save Bus';
    }
  },

  mounted: function () {
    this.loadDrivers();
    this.loadBuses();
    this.loadTrackingHistory();
  },

  methods: {
    loadDrivers: async function () {
      var response = await fetch('/api/admin/drivers');
      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      var data = await response.json();
      this.drivers = data.drivers || [];
    },

    loadBuses: async function () {
      var response = await fetch('/api/admin/buses');
      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      var data = await response.json();
      this.buses = data.buses || [];
      this.busesLoaded = true;
    },

    loadTrackingHistory: async function () {
      var response = await fetch('/api/admin/history');
      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      var data = await response.json();
      this.history = data.history || [];
      this.historyLoaded = true;
    },

    editBus: function (bus) {
      this.form.id = bus.id;
      this.form.bus_number = bus.bus_number;
      this.form.route_name = bus.route_name;
      this.form.driver_id = bus.driver_id ? String(bus.driver_id) : '';
      this.form.status = bus.status || 'active';
      this.message = '';
    },

    saveBus: async function () {
      this.saving = true;
      this.message = '';

      var payload = {
        bus_number: this.form.bus_number,
        route_name: this.form.route_name,
        driver_id: this.form.driver_id || null,
        status: this.form.status
      };

      var isEdit = !!this.form.id;
      var url = isEdit ? '/api/admin/buses/' + this.form.id : '/api/admin/buses';
      var method = isEdit ? 'PUT' : 'POST';

      var response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.saving = false;

      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }

      if (!response.ok) {
        var err = await response.json();
        this.message = err.message || 'Could not save the bus';
        this.messageType = 'error';
        return;
      }

      this.message = isEdit ? 'Bus updated successfully.' : 'Bus added successfully.';
      this.messageType = 'success';
      this.clearForm();
      this.loadBuses();
    },

    deleteBus: async function (busId) {
      var sure = confirm('Are you sure you want to delete this bus?');
      if (!sure) return;

      var response = await fetch('/api/admin/buses/' + busId, { method: 'DELETE' });

      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }

      if (!response.ok) {
        this.message = 'Could not delete the bus.';
        this.messageType = 'error';
        return;
      }

      if (String(this.form.id) === String(busId)) {
        this.clearForm();
      }

      this.message = 'Bus deleted.';
      this.messageType = 'success';
      this.loadBuses();
    },

    clearForm: function () {
      this.form.id = '';
      this.form.bus_number = '';
      this.form.route_name = '';
      this.form.driver_id = '';
      this.form.status = 'active';
    },

    formatDate: function (value) {
      var d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    },

    formatTime: function (value) {
      var d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    logout: async function () {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'index.html';
    }
  }
});

app.mount('#app');
