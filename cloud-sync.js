// Cloud Sync Manager for WeekDeck
// Handles synchronization with Google Drive using Google Sign-In

class CloudSyncManager {
  constructor() {
    this.isGoogleDriveConnected = false;
    this.syncEnabled = localStorage.getItem('weekdeck-cloud-sync-enabled') === 'true';
    this.lastSyncTime = localStorage.getItem('weekdeck-last-sync-time');
    this.userEmail = localStorage.getItem('weekdeck-user-email') || null;
    this.accessToken = localStorage.getItem('weekdeck-access-token') || null;
    
    // Google Drive API configuration - Using public client ID for Google Sign-In
    this.googleConfig = {
      clientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Public client ID (placeholder)
      discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      scopes: 'https://www.googleapis.com/auth/drive.file'
    };
    
    this.init();
  }

  async init() {
    console.log('🔄 CloudSyncManager: Initializing...');
    
    // Check if user was previously signed in
    if (this.userEmail && this.accessToken) {
      this.isGoogleDriveConnected = true;
      await this.initGoogleAPI();
    }
    
    // Load Google Sign-In
    await this.loadGoogleSignIn();
    
    // Set up auto-sync if enabled
    if (this.syncEnabled && this.isGoogleDriveConnected) {
      this.setupAutoSync();
    }
  }

  // Load Google Sign-In
  async loadGoogleSignIn() {
    try {
      // Load Google Identity Services
      await this.loadScript('https://accounts.google.com/gsi/client');
      
      // Initialize Google Sign-In
      if (window.google) {
        google.accounts.id.initialize({
          client_id: this.googleConfig.clientId,
          callback: (response) => this.handleSignInResponse(response)
        });
        
        console.log('✅ Google Sign-In initialized');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error loading Google Sign-In:', error);
      return false;
    }
  }
  
  // Initialize Google API for Drive access
  async initGoogleAPI() {
    try {
      // Load Google API
      await this.loadScript('https://apis.google.com/js/api.js');
      
      await new Promise((resolve) => {
        gapi.load('client', resolve);
      });
      
      await gapi.client.init({
        discoveryDocs: [this.googleConfig.discoveryDoc]
      });
      
      // Set access token
      gapi.client.setToken({ access_token: this.accessToken });
      
      console.log('✅ Google Drive API initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google API:', error);
      return false;
    }
  }

  // Handle Google Sign-In response
  handleSignInResponse(response) {
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      this.userEmail = payload.email;
      this.isGoogleDriveConnected = true;
      
      // Store user info
      localStorage.setItem('weekdeck-user-email', this.userEmail);
      
      // Now request access token for Drive API
      this.requestDriveAccess();
      
      console.log('✅ User signed in:', this.userEmail);
      this.showSyncNotification(`Signed in as ${this.userEmail}`);
      
    } catch (error) {
      console.error('❌ Error handling sign-in:', error);
      this.showSyncNotification('Sign-in failed', 'error');
    }
  }
  
  // Request Drive API access
  async requestDriveAccess() {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.googleConfig.clientId,
        scope: this.googleConfig.scopes,
        callback: (response) => {
          if (response.error) {
            console.error('❌ Drive access error:', response.error);
            return;
          }
          
          this.accessToken = response.access_token;
          localStorage.setItem('weekdeck-access-token', this.accessToken);
          
          // Initialize Google API with token
          this.initGoogleAPI();
          
          console.log('✅ Drive access granted');
          this.showSyncNotification('Google Drive connected successfully!');
        }
      });
      
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('❌ Error requesting Drive access:', error);
      this.showSyncNotification('Failed to connect to Google Drive', 'error');
    }
  }
  
  // Sign in with Google
  signInWithGoogle() {
    if (window.google) {
      google.accounts.id.prompt();
    } else {
      this.showSyncNotification('Google Sign-In not loaded', 'error');
    }
  }

  async syncToGoogleDrive(data) {
    try {
      if (!this.isGoogleDriveConnected) {
        throw new Error('Google Drive not connected');
      }

      const fileName = `${data.pageTitle || 'weekdeck'}_${new Date().toISOString().split('T')[0]}.wdeck`;
      const fileContent = JSON.stringify(data, null, 2);
      
      // Check if file already exists
      const existingFiles = await gapi.client.drive.files.list({
        q: `name='${fileName}' and parents in 'appDataFolder'`,
        spaces: 'appDataFolder'
      });
      
      let fileId = null;
      if (existingFiles.result.files.length > 0) {
        fileId = existingFiles.result.files[0].id;
      }
      
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      
      const metadata = {
        'name': fileName,
        'parents': ['appDataFolder']
      };
      
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;
      
      const request = gapi.client.request({
        'path': fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files',
        'method': fileId ? 'PATCH' : 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        'body': multipartRequestBody
      });
      
      const response = await request;
      console.log('✅ File synced to Google Drive:', response.result);
      
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('weekdeck-last-sync-time', this.lastSyncTime);
      
      return response.result;
    } catch (error) {
      console.error('❌ Error syncing to Google Drive:', error);
      throw error;
    }
  }

  // Sign out from Google
  signOut() {
    try {
      // Clear stored data
      this.isGoogleDriveConnected = false;
      this.userEmail = null;
      this.accessToken = null;
      this.syncEnabled = false;
      
      // Clear localStorage
      localStorage.removeItem('weekdeck-user-email');
      localStorage.removeItem('weekdeck-access-token');
      localStorage.removeItem('weekdeck-cloud-sync-enabled');
      localStorage.removeItem('weekdeck-last-sync-time');
      
      // Sign out from Google
      if (window.google) {
        google.accounts.id.disableAutoSelect();
      }
      
      console.log('✅ Signed out successfully');
      this.showSyncNotification('Signed out from Google Drive');
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      this.showSyncNotification('Error signing out', 'error');
    }
  }

  // Main sync function
  async syncData(data) {
    try {
      if (!this.syncEnabled) {
        console.log('🔄 Cloud sync is disabled');
        return;
      }

      if (!this.isGoogleDriveConnected) {
        console.warn('⚠️ Google Drive not connected');
        return;
      }

      console.log('🔄 Starting cloud sync...');
      
      await this.syncToGoogleDrive(data);
      this.showSyncNotification('Synced to Google Drive successfully!');
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.showSyncNotification('Sync failed: ' + error.message, 'error');
    }
  }

  // Auto-sync setup
  setupAutoSync() {
    // Sync every 5 minutes if enabled
    setInterval(() => {
      if (this.syncEnabled && window.weekdeckApp) {
        const currentTasks = window.weekdeckApp.getCurrentTasksFromDOM();
        if (currentTasks) {
          this.syncData({
            tasks: currentTasks,
            weekendHidden: window.weekdeckApp.weekendHidden,
            pageTitle: window.weekdeckApp.pageTitle,
            currentTheme: window.themeManager ? window.themeManager.getCurrentTheme() : 'default',
            exportDate: new Date().toISOString(),
            version: '1.0'
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Enable/disable sync
  toggleSync(enabled) {
    this.syncEnabled = enabled;
    localStorage.setItem('weekdeck_sync_enabled', enabled.toString());
    
    if (enabled) {
      this.setupAutoSync();
      this.showSyncNotification('Auto-sync enabled');
    } else {
      this.showSyncNotification('Auto-sync disabled');
    }
  }

  // Disconnect from cloud provider
  disconnect() {
    if (this.isGoogleDriveConnected) {
      this.isGoogleDriveConnected = false;
      this.syncProvider = null;
      localStorage.removeItem('weekdeck_google_drive_connected');
      localStorage.removeItem('weekdeck_sync_provider');
      this.showSyncNotification('Disconnected from Google Drive');
    }
  }

  // Utility functions
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  showSyncNotification(message, type = 'success') {
    if (window.weekdeckApp && window.weekdeckApp.showNotification) {
      window.weekdeckApp.showNotification(message, type);
    } else {
      console.log(`🔄 Sync: ${message}`);
    }
  }

  // Show sync menu
  showSyncMenu() {
    const menuItems = [];
    
    if (!this.isGoogleDriveConnected) {
      // User not signed in
      menuItems.push(
        { text: '🔐 Sign in with Google', action: () => this.signInWithGoogle() },
        { separator: true },
        { text: '📋 How it works:', action: null, disabled: true },
        { text: '• Sign in with your Google account', action: null, disabled: true },
        { text: '• Your tasks sync to your Google Drive', action: null, disabled: true },
        { text: '• Access from any device', action: null, disabled: true }
      );
    } else {
      // User signed in
      menuItems.push(
        { text: `✅ Signed in as ${this.userEmail}`, action: null, disabled: true },
        { separator: true },
        { text: '🔄 Sync Now', action: () => this.manualSync() },
        { text: this.syncEnabled ? '⏸️ Disable Auto-sync' : '▶️ Enable Auto-sync', action: () => this.toggleSync(!this.syncEnabled) },
        { separator: true },
        { text: '🚪 Sign Out', action: () => this.signOut() }
      );
      
      if (this.lastSyncTime) {
        const lastSyncDate = new Date(this.lastSyncTime).toLocaleString();
        menuItems.push({ text: `Last sync: ${lastSyncDate}`, action: null, disabled: true });
      }
    }
    
    // Registrar o actualizar el menú de cloud sync
    if (window.contextMenuManager) {
      if (window.contextMenuManager.menus.has('cloud-sync-menu')) {
        window.contextMenuManager.menus.get('cloud-sync-menu').options = menuItems;
      } else {
        window.registerContextMenu('cloud-sync-menu', menuItems);
      }
      
      // Mostrar el menú usando el botón de configuración como trigger
      const settingsButton = document.querySelector('.settings-btn');
      window.showContextMenu('cloud-sync-menu', settingsButton, 'bottom-right');
    } else {
      console.warn('Context menu manager not available');
    }
  }
  

  
  // Manual sync function
  async manualSync() {
    if (!this.isGoogleDriveConnected) {
      this.showSyncNotification('Please sign in with Google first', 'error');
      return;
    }
    
    try {
      // Get current data from the app
      const currentData = window.getAppData ? window.getAppData() : {};
      await this.syncData(currentData);
    } catch (error) {
      console.error('Manual sync failed:', error);
      this.showSyncNotification('Manual sync failed: ' + error.message, 'error');
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      enabled: this.syncEnabled,
      connected: this.isGoogleDriveConnected,
      userEmail: this.userEmail,
      lastSync: this.lastSyncTime
    };
  }
}

// Initialize cloud sync manager
window.cloudSyncManager = new CloudSyncManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudSyncManager;
}