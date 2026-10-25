// Driver dashboard — Vue 3 Options API.
// Vue shows the assigned bus and the live latitude, longitude, and speed.
// GPS and the demo route stay as simple browser timers.

var DEMO_POINTS = [
  [23.1432, 72.5441],
  [23.1370, 72.5446],
  [23.1310, 72.5450],
  [23.1287, 72.5451],
  [23.1265, 72.5460]
];

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
      bus: null,
      latitude: null,
      longitude: null,
      speed: null,
      trackingMode: 'idle',
      errorMessage: ''
    };
  },

  computed: {
    latitudeText: function () {
      if (this.latitude === null) return '--';
      return Number(this.latitude).toFixed(4);
    },
    longitudeText: function () {
      if (this.longitude === null) return '--';
      return Number(this.longitude).toFixed(4);
    },
    speedText: function () {
      if (this.speed === null) return '--';
      return this.speed + ' km/h';
    }
  },

  mounted: function () {
    this._watchId = null;
    this._demoTimer = null;
    this._demoIndex = 0;
    this._prevLat = null;
    this._prevLng = null;
    this._prevTime = null;
    this.loadAssignedBus();
  },

  methods: {
    loadAssignedBus: async function () {
      var response = await fetch('/api/driver/assigned-bus');
      if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      var data = await response.json();
      this.bus = data.bus || null;
    },

    startGps: function () {
      if (!this.bus) return;

      this.clearDemoTimer();
      this.clearGpsWatch();
      this.errorMessage = '';

      if (!navigator.geolocation) {
        this.trackingMode = 'idle';
        this.errorMessage = 'GPS is not available in this browser.';
        return;
      }

      this.trackingMode = 'gps';
      var self = this;

      this._watchId = navigator.geolocation.watchPosition(
        function (position) {
          var meters = position.coords.speed;
          var speed = (meters === null || meters === undefined) ? 0 : Math.round(meters * 3.6);
          self.sendLocation(position.coords.latitude, position.coords.longitude, speed);
        },
        function (error) {
          self.errorMessage = 'GPS error: ' + error.message;
          self.stopGps();
        }
      );
    },

    stopGps: function () {
      this.clearGpsWatch();
      if (this.trackingMode === 'gps') {
        this.trackingMode = 'idle';
      }
    },

    startDemo: function () {
      if (!this.bus) return;

      this.clearGpsWatch();
      this.clearDemoTimer();
      this.trackingMode = 'demo';
      this.errorMessage = '';
      this._demoIndex = 0;
      this._prevLat = null;
      this._prevLng = null;
      this._prevTime = null;

      this.sendDemoPoint();
      var self = this;
      this._demoTimer = setInterval(function () {
        self.sendDemoPoint();
      }, 4000);
    },

    sendDemoPoint: function () {
      var point = DEMO_POINTS[this._demoIndex];
      var speed = 0;

      if (this._prevLat !== null && this._prevTime) {
        var km = distanceKm(this._prevLat, this._prevLng, point[0], point[1]);
        var hours = (Date.now() - this._prevTime) / 3600000;
        speed = hours > 0 ? Math.round(km / hours) : 0;
      }

      this._demoIndex = (this._demoIndex + 1) % DEMO_POINTS.length;
      this.sendLocation(point[0], point[1], speed);
    },

    stopDemo: function () {
      this.clearDemoTimer();
      if (this.trackingMode === 'demo') {
        this.trackingMode = 'idle';
      }
    },

    sendLocation: async function (lat, lng, speed) {
      this.latitude = lat;
      this.longitude = lng;
      this.speed = speed;
      this._prevLat = lat;
      this._prevLng = lng;
      this._prevTime = Date.now();

      if (!this.bus) return;

      await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: this.bus.id,
          latitude: lat,
          longitude: lng
        })
      });
    },

    clearGpsWatch: function () {
      if (this._watchId !== null && this._watchId !== undefined) {
        navigator.geolocation.clearWatch(this._watchId);
        this._watchId = null;
      }
    },

    clearDemoTimer: function () {
      if (this._demoTimer) {
        clearInterval(this._demoTimer);
        this._demoTimer = null;
      }
    },

    logout: async function () {
      this.stopGps();
      this.stopDemo();
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'index.html';
    }
  }
});

app.mount('#app');
