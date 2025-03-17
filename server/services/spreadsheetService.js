
const { google } = require('googleapis');
const sheets = google.sheets('v4');

class SpreadsheetService {
  constructor(credentials) {
    this.auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  }

  async setupFramingDatabaseRelationships(spreadsheetId) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      // Get existing sheets
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title'
      });

      const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
      
      // Create required tables if they don't exist
      const requiredTables = ['Moulding', 'Mat', 'Fabric', 'Glass', 'OrderLookup'];
      for (const table of requiredTables) {
        if (!existingSheets.includes(table)) {
          await this.createNewSheet(spreadsheetId, table);
        }
      }

      // Setup headers and formatting for each table
      await this.setupTableHeaders(spreadsheetId);
      
      return { success: true, message: "Framing database relationships setup complete" };
    } catch (error) {
      console.error('Error in setupFramingDatabaseRelationships:', error);
      throw new Error(`Failed to setup database relationships: ${error.message}`);
    }
  }

  async createNewSheet(spreadsheetId, sheetTitle) {
    const request = {
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: { title: sheetTitle }
          }
        }]
      }
    };

    return await sheets.spreadsheets.batchUpdate(request);
  }

  async setupTableHeaders(spreadsheetId) {
    const headerConfigs = {
      'OrderLookup': ['Order ID', 'Customer Name', 'Description', 'Moulding ID', 'Mat ID', 'Fabric ID', 'Glass ID', 'Progress', 'Status', 'Due Date'],
      'Moulding': ['Order ID', 'Description', 'Material ID', 'Quantity', 'Status', 'Progress Bar', 'Notes'],
      'Mat': ['Order ID', 'Description', 'Material ID', 'Quantity', 'Status', 'Progress Bar', 'Notes'],
      'Fabric': ['Order ID', 'Description', 'Material ID', 'Quantity', 'Status', 'Progress Bar', 'Notes'],
      'Glass': ['Order ID', 'Description', 'Material ID', 'Quantity', 'Status', 'Progress Bar', 'Notes']
    };

    for (const [sheetName, headers] of Object.entries(headerConfigs)) {
      await this.updateHeaders(spreadsheetId, sheetName, headers);
    }
  }

  async updateHeaders(spreadsheetId, sheetName, headers) {
    const request = {
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    };

    return await sheets.spreadsheets.values.update(request);
  }
}

module.exports = SpreadsheetService;
