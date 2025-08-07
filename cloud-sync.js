// Cloud Sync Manager for WeekDeck
// Handles synchronization with Google Drive and Dropbox

class CloudSyncManager {
  constructor() {
    this.isGoogleDriveConnected = false;
    this.isDropboxConnected = false;
    this.syncEnabled = localStorage.getItem('weekdeck-cloud-sync-enabled') === 'true';
    this.lastSyncTime = localStorage.getItem('weekdeck-last-sync-time');
    this.syncProvider = localStorage.getItem('weekdeck-sync-provider') || null;
    
    // Google Drive API configuration
    this.googleDriveConfig = {
      clientId: '', // Add your Google Drive Client ID here
      apiKey: '', // Add your Google Drive API Key here
      discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      scopes: 'https://www.googleapis.com/auth/drive.file'
    };
    
    // Dropbox API configuration
    this.dropboxConfig = {
      clientId: '', // Add your Dropbox App Key here
      redirectUri: window.location.origin
    };
    
    this.init();
  }

  async init() {
    console.log('🔄 CloudSyncManager: Initializing...');
    
    // Check if user has previously connected to a service
    if (this.syncProvider === 'googledrive') {
      await this.initGoogleDrive();
    } else if (this.syncProvider === 'dropbox') {
      await this.initDropbox();
    }
    
    // Set up auto-sync if enabled
    if (this.syncEnabled) {
      this.setupAutoSync();
    }
  }

  // Google Drive Integration
  async initGoogleDrive() {
    try {
      if (!this.googleDriveConfig.clientId || !this.googleDriveConfig.apiKey) {
        console.warn('⚠️ Google Drive API credentials not configured');
        return false;
      }

      // Load Google API
      await this.loadScript('https://apis.google.com/js/api.js');
      await this.loadScript('https://accounts.google.com/gsi/client');
      
      await gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: this.googleDriveConfig.apiKey,
          discoveryDocs: [this.googleDriveConfig.discoveryDoc]
        });
        
        console.log('✅ Google Drive API initialized');
        this.isGoogleDriveConnected = true;
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Drive:', error);
      return false;
    }
  }

  async connectGoogleDrive() {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.googleDriveConfig.clientId,
        scope: this.googleDriveConfig.scopes,
        callback: (response) => {
          if (response.error) {
            console.error('❌ Google Drive auth error:', response.error);
            return;
          }
          
          console.log('✅ Google Drive connected successfully');
          this.isGoogleDriveConnected = true;
          this.syncProvider = 'googledrive';
          localStorage.setItem('weekdeck-sync-provider', 'googledrive');
          this.showSyncNotification('Connected to Google Drive successfully!');
        }
      });
      
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('❌ Error connecting to Google Drive:', error);
      this.showSyncNotification('Failed to connect to Google Drive', 'error');
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

  // Dropbox Integration
  async initDropbox() {
    try {
      if (!this.dropboxConfig.clientId) {
        console.warn('⚠️ Dropbox API credentials not configured');
        return false;
      }
      
      // Load Dropbox SDK
      await this.loadScript('https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js');
      
      this.dropboxClient = new Dropbox.Dropbox({
        clientId: this.dropboxConfig.clientId,
        fetch: fetch
      });
      
      console.log('✅ Dropbox API initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Dropbox:', error);
      return false;
    }
  }

  async connectDropbox() {
    try {
      const authUrl = this.dropboxClient.getAuthenticationUrl(this.dropboxConfig.redirectUri);
      
      // Open popup for authentication
      const popup = window.open(authUrl, 'dropbox-auth', 'width=600,height=600');
      
      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if we got the access token from URL
          const urlParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = urlParams.get('access_token');
          
          if (accessToken) {
            this.dropboxClient.setAccessToken(accessToken);
            this.isDropboxConnected = true;
            this.syncProvider = 'dropbox';
            localStorage.setItem('weekdeck-sync-provider', 'dropbox');
            localStorage.setItem('weekdeck-dropbox-token', accessToken);
            this.showSyncNotification('Connected to Dropbox successfully!');
          }
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error connecting to Dropbox:', error);
      this.showSyncNotification('Failed to connect to Dropbox', 'error');
    }
  }

  async syncToDropbox(data) {
    try {
      if (!this.isDropboxConnected) {
        throw new Error('Dropbox not connected');
      }

      const fileName = `/${data.pageTitle || 'weekdeck'}_${new Date().toISOString().split('T')[0]}.wdeck`;
      const fileContent = JSON.stringify(data, null, 2);
      
      const response = await this.dropboxClient.filesUpload({
        path: fileName,
        contents: fileContent,
        mode: 'overwrite',
        autorename: true
      });
      
      console.log('✅ File synced to Dropbox:', response.result);
      
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('weekdeck-last-sync-time', this.lastSyncTime);
      
      return response.result;
    } catch (error) {
      console.error('❌ Error syncing to Dropbox:', error);
      throw error;
    }
  }

  // Main sync function
  async syncData(data) {
    try {
      if (!this.syncEnabled) {
        console.log('🔄 Cloud sync is disabled');
        return;
      }

      console.log('🔄 Starting cloud sync...');
      
      if (this.syncProvider === 'googledrive' && this.isGoogleDriveConnected) {
        await this.syncToGoogleDrive(data);
        this.showSyncNotification('Synced to Google Drive successfully!');
      } else if (this.syncProvider === 'dropbox' && this.isDropboxConnected) {
        await this.syncToDropbox(data);
        this.showSyncNotification('Synced to Dropbox successfully!');
      } else {
        console.warn('⚠️ No cloud provider connected');
      }
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
    localStorage.setItem('weekdeck-cloud-sync-enabled', enabled.toString());
    
    if (enabled) {
      this.setupAutoSync();
      this.showSyncNotification('Cloud sync enabled');
    } else {
      this.showSyncNotification('Cloud sync disabled');
    }
  }

  // Disconnect from cloud provider
  disconnect() {
    this.isGoogleDriveConnected = false;
    this.isDropboxConnected = false;
    this.syncProvider = null;
    this.syncEnabled = false;
    
    localStorage.removeItem('weekdeck-sync-provider');
    localStorage.removeItem('weekdeck-cloud-sync-enabled');
    localStorage.removeItem('weekdeck-dropbox-token');
    
    this.showSyncNotification('Disconnected from cloud storage');
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

  // Get sync status
  getSyncStatus() {
    return {
      enabled: this.syncEnabled,
      provider: this.syncProvider,
      connected: this.isGoogleDriveConnected || this.isDropboxConnected,
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