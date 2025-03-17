
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

  async setupProgressValidation(spreadsheetId, sheetName) {
    const progressOptions = [
      "░░░░░░░░░░ 0%",
      "█░░░░░░░░░ 10%",
      "██░░░░░░░░ 20%",
      "███░░░░░░░ 30%",
      "████░░░░░░ 40%",
      "█████░░░░░ 50%",
      "██████░░░░ 60%",
      "███████░░░ 70%",
      "████████░░ 80%",
      "█████████░ 90%",
      "██████████ 100%"
    ];

    return await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          setDataValidation: {
            range: {
              sheetId: await this.getSheetId(spreadsheetId, sheetName),
              startRowIndex: 1,
              startColumnIndex: 5,
              endColumnIndex: 6
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: progressOptions.map(option => ({ userEnteredValue: option }))
              },
              showCustomUi: true,
              strict: true
            }
          }
        }]
      }
    });
  }

  async standardizeProgressBars(spreadsheetId) {
    const sheets = ['OrderLookup', 'Mat', 'Fabric', 'Glass'];
    const mouldingData = await this.getSheetData(spreadsheetId, 'Moulding');
    
    for (const sheetName of sheets) {
      await this.updateProgressFormat(spreadsheetId, sheetName, mouldingData);
    }
  }

  async updateProgressFormat(spreadsheetId, sheetName, mouldingData) {
    const sheetId = await this.getSheetId(spreadsheetId, sheetName);
    
    const formatRules = [{
      ranges: [{
        sheetId,
        startRowIndex: 1,
        startColumnIndex: 5,
        endColumnIndex: 6
      }],
      booleanRule: {
        condition: {
          type: 'TEXT_CONTAINS',
          values: [{ userEnteredValue: '100%' }]
        },
        format: {
          backgroundColor: { red: 0.72, green: 0.88, blue: 0.8 }
        }
      }
    }, {
      ranges: [{
        sheetId,
        startRowIndex: 1,
        startColumnIndex: 5,
        endColumnIndex: 6
      }],
      booleanRule: {
        condition: {
          type: 'TEXT_CONTAINS',
          values: [{ userEnteredValue: '0%' }]
        },
        format: {
          backgroundColor: { red: 0.96, green: 0.78, blue: 0.76 }
        }
      }
    }];

    return await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          setConditionalFormatRules: {
            sheetId,
            rules: formatRules
          }
        }]
      }
    });
  }

  async getSheetId(spreadsheetId, sheetName) {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    });

    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : null;
  }

  async getSheetData(spreadsheetId, sheetName) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName
    });
    return response.data.values;
  }
}

module.exports = SpreadsheetService;
