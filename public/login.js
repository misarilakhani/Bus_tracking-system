// Login and create-account page.
// The same college-email check runs here and again on the server.

function isCollegeEmail(email) {
  var parts = email.trim().toLowerCase().split('@');
  return parts.length === 2 && parts[1] === 'nirmauni.ac.in';
}

var app = Vue.createApp({
  data: function () {
    return {
      mode: 'login',
      name: '',
      email: '',
      password: '',
      errorMessage: '',
      successMessage: '',
      loading: false
    };
  },

  computed: {
    submitLabel: function () {
      return this.mode === 'register' ? 'Create account' : 'Login';
    }
  },

  methods: {
    switchMode: function () {
      this.mode = this.mode === 'login' ? 'register' : 'login';
      this.errorMessage = '';
      this.successMessage = '';
      this.password = '';
    },

    submitForm: function () {
      if (this.mode === 'register') {
        this.register();
      } else {
        this.login();
      }
    },

    login: async function () {
      this.errorMessage = '';
      this.successMessage = '';

      if (!isCollegeEmail(this.email)) {
        this.errorMessage = 'Use your nirmauni.ac.in email address';
        return;
      }

      this.loading = true;
      var response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      });
      var data = await response.json();
      this.loading = false;

      if (data.success) {
        window.location.href = data.redirectUrl;
      } else {
        this.errorMessage = data.message || 'Login failed';
      }
    },

    register: async function () {
      this.errorMessage = '';
      this.successMessage = '';

      if (!isCollegeEmail(this.email)) {
        this.errorMessage = 'Use your nirmauni.ac.in email address';
        return;
      }

      this.loading = true;
      var response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.name,
          email: this.email,
          password: this.password
        })
      });
      var data = await response.json();
      this.loading = false;

      if (data.success) {
        this.successMessage = data.message;
        this.mode = 'login';
        this.name = '';
        this.password = '';
      } else {
        this.errorMessage = data.message || 'Could not create the account';
      }
    }
  }
});

app.mount('#app');
