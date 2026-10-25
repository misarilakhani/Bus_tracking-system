// Student dashboard — Vue 3 Options API.
// Vue holds the bus list, the selection, and the live tracking text.
// Leaflet only draws the map and the red dot.

// Distance between two GPS points, in kilometres.
function distanceKm(lat1, lng1, lat2, lng2) {
  var toRad = function (deg) { return deg * Math.PI / 180; };
  var dLat = toRad(lat2 - lat1);
  var dLng = toRad(lng2 - lng1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

var app = Vue.createApp({
  data: function () {
    return {
      buses: [],
      selectedBusId: '',
      trackingBusId: '',
      isTracking: false,
      speed: null,
      lastUpdate: null,
      errorMessage: '',
      location: {
        busNumber: '',
        status: '',
        latitude: null,
        longitude: null
      }
    };
  },

  computed: {
    // The bus object that matches the dropdown. Used by {{ selectedBus }}.
    selectedBus: function () {
      var id = String(this.selectedBusId);
      for (var i = 0; i < this.buses.length; i++) {
        if (String(this.buses[i].id) === id) {
          return this.buses[i];
        }
      }
      return null;
    },

    speedText: function () {
      if (this.speed === null) return '--';
      return this.speed + ' km/h';
    },

    lastUpdateText: function () {
      if (!this.lastUpdate) return '--';
      return this.lastUpdate.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },

    coordinateText: function () {
      if (this.location.latitude === null) return '--';
      return this.location.latitude.toFixed(4) + ', ' + this.location.longitude.toFixed(4);
    },

    // One readable line built from the live tracking values.
    formattedBus: function () {
      if (!this.location.busNumber) return 'Waiting for the first location...';
      return this.location.busNumber + ' is ' + this.location.status +
        ' at ' + this.speedText + ', updated ' + this.lastUpdateText;
    }
  },

  mounted: function () {
    this._map = null;
    this._marker = null;
    this._timer = null;
    this._prevLat = null;
    this._prevLng = null;
    this._prevTime = null;
    this.initMap();
    this.loadBuses();
  },

  methods: {
    initMap: function () {
      this._map = L.map('map').setView([23.1287, 72.5451], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._map);

      // handle container resize for responsive map view
      var self = this;
      window.addEventListener('resize', function () {
        if (self._map) {
          self._map.invalidateSize();
        }
      });
    },

    // Move the simple red dot. Called from updateLocation, not from a watcher.
    moveMarker: function (lat, lng) {
      if (!this._marker) {
        this._marker = L.circleMarker([lat, lng], {
          radius: 7,
          color: 'red',
          fillColor: 'red',
          fillOpacity: 1
        }).addTo(this._map);
      } else {
        this._marker.setLatLng([lat, lng]);
      }
      this._map.panTo([lat, lng]);
    },

    loadBuses: async function () {
      var response = await fetch('/api/buses');
      if (response.status === 401) {
        window.location.href = 'index.html';
        return;
      }
      var data = await response.json();
      this.buses = data.buses || [];
    },

    trackBus: function () {
      if (!this.selectedBusId) {
        this.errorMessage = 'Please select a bus first';
        return;
      }

      this.errorMessage = '';
      this.trackingBusId = this.selectedBusId;
      this.isTracking = true;
      this.speed = null;
      this.lastUpdate = null;
      this._prevLat = null;
      this._prevLng = null;
      this._prevTime = null;
      this.location = {
        busNumber: '',
        status: 'Loading...',
        latitude: null,
        longitude: null
      };

      this.saveTrackingHistory();
      this.updateLocation();

      if (this._timer) clearInterval(this._timer);
      var self = this;
      this._timer = setInterval(function () {
        self.updateLocation();
      }, 5000);
    },

    saveTrackingHistory: async function () {
      await fetch('/api/student/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus_id: this.trackingBusId })
      });
    },

    updateLocation: async function () {
      if (!this.trackingBusId) return;

      var response = await fetch('/api/buses/' + this.trackingBusId + '/location');
      if (response.status === 401) {
        window.location.href = 'index.html';
        return;
      }

      var data = await response.json();
      if (!response.ok) {
        this.errorMessage = data.message || 'Could not load the bus location';
        return;
      }

      var lat = parseFloat(data.latitude);
      var lng = parseFloat(data.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        this.errorMessage = 'This bus has no location yet.';
        return;
      }

      var now = Date.now();
      if (this._prevLat !== null && this._prevTime) {
        var km = distanceKm(this._prevLat, this._prevLng, lat, lng);
        var hours = (now - this._prevTime) / 3600000;
        this.speed = hours > 0 ? Math.round(km / hours) : 0;
      }

      this._prevLat = lat;
      this._prevLng = lng;
      this._prevTime = now;

      this.location = {
        busNumber: data.bus_number,
        status: data.status,
        latitude: lat,
        longitude: lng
      };
      this.lastUpdate = new Date();
      this.errorMessage = '';
      this.moveMarker(lat, lng);
    },

    logout: async function () {
      if (this._timer) clearInterval(this._timer);
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'index.html';
    }
  }
});

app.mount('#app');
