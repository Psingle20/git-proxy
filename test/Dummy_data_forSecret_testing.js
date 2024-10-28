const fs = require('fs');
const path = require('path');

// Directory where dummy data will be stored
const testDataDir = path.join(__dirname, 'test_data', 'Secret_test_data');

// Create the directory if it doesn't exist
if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
}

// Dummy files to create
const dummyFiles = [
    {
        name: 'dummy1.js',
        content: 'const secret = "my_secret_123"; // This is a secret\nconsole.log(secret);'
    },
    {
        name: 'dummy2.js',
        content: 'let token = "another_secret"; // Another secret\nconsole.log(token);'
    },
    {
        name: 'dummy3.js',
        content: 'const apiKey = "API_KEY_12345"; // API Key\nconsole.log(apiKey);'
    },
    {
        name: 'dummy4.js',
        content: 'const password = "password123"; // User password\nconsole.log(password);'
    }
];

// Create the dummy files
dummyFiles.forEach(file => {
    fs.writeFileSync(path.join(testDataDir, file.name), file.content);
    console.log(`Created ${file.name}`);
});

console.log('Dummy data generation complete.');
