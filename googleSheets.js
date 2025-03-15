const { google } = require('googleapis');
require('dotenv').config();

// Hàm để lấy ID của sheet từ URL
function getSheetId(url) {
    const matches = url.match(/[-\w]{25,}/);
    return matches ? matches[0] : null;
}

// Hàm tạo credentials object từ environment variables
function getGoogleCredentials() {
    return {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI,
        token_uri: process.env.GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
    };
}

async function getSheetData(url, sheetName) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: getGoogleCredentials(),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });
        
        const spreadsheetId = getSheetId(url);
        if (!spreadsheetId) {
            throw new Error('Link Google Sheet không hợp lệ');
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            throw new Error('Không tìm thấy dữ liệu trong sheet');
        }

        // Chuyển đổi dữ liệu thành mảng objects với header là key
        const headers = rows[5];
        const data = rows.slice(6).map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index] || '';
            });
            return rowData;
        });

        return {
            success: true,
            data: data,
            headers: headers
        };
    } catch (error) {
        console.error('Lỗi khi truy cập Google Sheet:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function updateComments(url, sheetName, comments) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: getGoogleCredentials(),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });
        
        const spreadsheetId = getSheetId(url);
        if (!spreadsheetId) {
            throw new Error('Link Google Sheet không hợp lệ');
        }

        // Lấy thông tin về sheet để tìm cột nhận xét
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A6:Z6`,
        });
        
        const headers = response.data.values[0];
        const commentColumnIndex = headers.findIndex(header => header === 'Nhận xét về buổi học');
        
        if (commentColumnIndex === -1) {
            throw new Error('Không tìm thấy cột "Nhận xét về buổi học" trong sheet');
        }

        // Chuyển đổi index sang chữ cái của cột (0 -> A, 1 -> B, etc.)
        const columnLetter = String.fromCharCode(65 + commentColumnIndex);
        
        // Cập nhật từng nhận xét
        const updates = comments.map((comment, index) => ({
            range: `${sheetName}!${columnLetter}${index + 7}`,
            values: [[comment]]
        }));

        // Thực hiện cập nhật
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: updates
            }
        });

        return {
            success: true,
            message: 'Cập nhật nhận xét thành công'
        };
    } catch (error) {
        console.error('Lỗi khi cập nhật nhận xét:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { getSheetData, updateComments }; 